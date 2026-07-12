from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Q
import math

from .models import User, TailorProfile, TailoringRequest, Review, Notification, Message
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserSerializer,
    TailorProfileSerializer, TailorProfileCreateSerializer, TailoringRequestSerializer,
    ReviewSerializer, NotificationSerializer, MessageSerializer,
    NearbyShopsSerializer, RequestStatusUpdateSerializer
)


class RegisterView(APIView):
    """User registration endpoint"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """User login endpoint"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                }
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """User profile management"""
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class TailorProfileView(generics.RetrieveUpdateAPIView):
    """Tailor profile management"""
    serializer_class = TailorProfileSerializer

    def get_object(self):
        if not self.request.user.is_tailor:
            return None
        profile, created = TailorProfile.objects.get_or_create(user=self.request.user)
        return profile


class CreateTailorProfileView(generics.CreateAPIView):
    """Create tailor profile"""
    serializer_class = TailorProfileCreateSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class NearbyShopsView(APIView):
    """Get nearby tailoring shops"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = NearbyShopsSerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        lat = serializer.validated_data['lat']
        lng = serializer.validated_data['lng']
        radius = serializer.validated_data['radius']

        # Get all tailor profiles
        tailors = TailorProfile.objects.filter(
            user__location_lat__isnull=False,
            user__location_lng__isnull=False
        )

        nearby_tailors = []
        for tailor in tailors:
            # Calculate distance using Haversine formula
            distance = self.calculate_distance(lat, lng, tailor.user.location_lat, tailor.user.location_lng)
            if distance <= radius:
                tailor_data = TailorProfileSerializer(tailor).data
                tailor_data['distance'] = round(distance, 2)
                nearby_tailors.append(tailor_data)

        # Sort by distance
        nearby_tailors.sort(key=lambda x: x['distance'])
        return Response(nearby_tailors)

    def calculate_distance(self, lat1, lng1, lat2, lng2):
        """Calculate distance between two points in kilometers"""
        R = 6371  # Earth's radius in kilometers
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        a = (math.sin(dlat/2) * math.sin(dlat/2) +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlng/2) * math.sin(dlng/2))
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c


class CreateRequestView(generics.CreateAPIView):
    """Create a new tailoring request"""
    serializer_class = TailoringRequestSerializer

    def perform_create(self, serializer):
        request = serializer.save(user=self.request.user)
        # Create notification for tailor
        Notification.objects.create(
            user=request.tailor.user,
            type='request_received',
            title='New Tailoring Request',
            message=f'You have received a new request from {request.user.name}',
            related_request=request
        )


class MyRequestsView(generics.ListAPIView):
    """Get user's requests"""
    serializer_class = TailoringRequestSerializer

    def get_queryset(self):
        return TailoringRequest.objects.filter(user=self.request.user).order_by('-created_at')


class TailorRequestsView(generics.ListAPIView):
    """Get requests for a tailor"""
    serializer_class = TailoringRequestSerializer

    def get_queryset(self):
        if not self.request.user.is_tailor:
            return TailoringRequest.objects.none()
        try:
            tailor_profile = self.request.user.tailor_profile
            return TailoringRequest.objects.filter(tailor=tailor_profile).order_by('-created_at')
        except TailorProfile.DoesNotExist:
            return TailoringRequest.objects.none()


class RequestDetailView(generics.RetrieveUpdateAPIView):
    """Get and update request details"""
    serializer_class = TailoringRequestSerializer

    def get_queryset(self):
        return TailoringRequest.objects.filter(
            Q(user=self.request.user) | Q(tailor__user=self.request.user)
        )


class UpdateRequestStatusView(APIView):
    """Update request status (for tailors)"""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            tailoring_request = TailoringRequest.objects.get(pk=pk, tailor__user=request.user)
        except TailoringRequest.DoesNotExist:
            return Response({'error': 'Request not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = RequestStatusUpdateSerializer(data=request.data)
        if serializer.is_valid():
            tailoring_request.status = serializer.validated_data['status']
            if 'estimated_completion' in serializer.validated_data:
                tailoring_request.estimated_completion = serializer.validated_data['estimated_completion']
            tailoring_request.save()

            # Create notification for user
            Notification.objects.create(
                user=tailoring_request.user,
                type='status_update',
                title='Request Status Updated',
                message=f'Your request status has been updated to {tailoring_request.get_status_display()}',
                related_request=tailoring_request
            )

            return Response(TailoringRequestSerializer(tailoring_request).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CreateReviewView(generics.CreateAPIView):
    """Create a review for a completed request"""
    serializer_class = ReviewSerializer

    def perform_create(self, serializer):
        serializer.save()


class NotificationsView(generics.ListAPIView):
    """Get user notifications"""
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')


class MarkNotificationReadView(APIView):
    """Mark notification as read"""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
            notification.is_read = True
            notification.save()
            return Response({'status': 'success'})
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)


class MessagesView(generics.ListCreateAPIView):
    """Get and create messages for a request"""
    serializer_class = MessageSerializer

    def get_queryset(self):
        request_id = self.kwargs.get('request_id')
        return Message.objects.filter(request_id=request_id).order_by('created_at')

    def perform_create(self, serializer):
        request_id = self.kwargs.get('request_id')
        tailoring_request = TailoringRequest.objects.get(id=request_id)
        serializer.save(sender=self.request.user, request=tailoring_request)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_location(request):
    """Update user location"""
    lat = request.data.get('lat')
    lng = request.data.get('lng')
    
    if lat is None or lng is None:
        return Response({'error': 'Latitude and longitude are required'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    request.user.location_lat = lat
    request.user.location_lng = lng
    request.user.save()
    
    return Response({'status': 'success'})
