from rest_framework import generics, status, permissions, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Q
import math

from .models import User, TailorProfile, TailoringRequest, Review, Notification, Message, PasswordResetToken
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserSerializer,
    TailorProfileSerializer, TailorProfileCreateSerializer, TailoringRequestSerializer,
    ReviewSerializer, NotificationSerializer, MessageSerializer,
    NearbyShopsSerializer, RequestStatusUpdateSerializer, PasswordChangeSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer
)
from .email_utils import generate_reset_token, send_password_reset_email
from django.utils import timezone
from datetime import timedelta


class RegisterView(APIView):
    """User registration endpoint"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()
                refresh = RefreshToken.for_user(user)
                return Response({
                    'user': UserSerializer(user).data,
                    'tokens': {
                        'access': str(refresh.access_token),
                        'refresh': str(refresh)
                    }
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({
                    'error': 'Registration failed',
                    'detail': 'An error occurred while creating your account. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({
            'error': 'Validation failed',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """User login endpoint"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.validated_data['user']
                refresh = RefreshToken.for_user(user)
                return Response({
                    'user': UserSerializer(user).data,
                    'tokens': {
                        'access': str(refresh.access_token),
                        'refresh': str(refresh)
                    }
                })
            except Exception as e:
                return Response({
                    'error': 'Login failed',
                    'detail': 'An error occurred during login. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({
            'error': 'Authentication failed',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """User profile management"""
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class TailorProfileView(generics.RetrieveUpdateAPIView):
    """Tailor profile management"""
    serializer_class = TailorProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        if not self.request.user.is_tailor:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only tailors can access this profile")
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


class TailorPortfolioView(APIView):
    """Get tailor portfolio photos"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, tailor_id):
        try:
            tailor = TailorProfile.objects.get(id=tailor_id)
            return Response({
                'id': tailor.id,
                'shop_name': tailor.shop_name,
                'portfolio_photos': tailor.portfolio_photos
            })
        except TailorProfile.DoesNotExist:
            return Response({'error': 'Tailor not found'}, status=status.HTTP_404_NOT_FOUND)


class UploadPortfolioPhotoView(APIView):
    """Upload portfolio photos for tailor"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            tailor_profile = request.user.tailor_profile
        except TailorProfile.DoesNotExist:
            return Response({'error': 'Tailor profile not found'}, status=status.HTTP_404_NOT_FOUND)

        if 'photo' not in request.FILES:
            return Response({'error': 'No photo provided'}, status=status.HTTP_400_BAD_REQUEST)

        photo = request.FILES['photo']
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if photo.content_type not in allowed_types:
            return Response({'error': 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file size (max 5MB)
        if photo.size > 5 * 1024 * 1024:
            return Response({'error': 'File too large. Maximum size is 5MB.'}, 
                          status=status.HTTP_400_BAD_REQUEST)

        # For now, we'll store the file info in the portfolio_photos field
        # In a production environment, you'd want to use a proper file storage service
        import uuid
        import os
        from django.conf import settings
        
        # Generate unique filename
        file_extension = photo.name.split('.')[-1]
        unique_filename = f"portfolio_{uuid.uuid4().hex}.{file_extension}"
        
        # Create portfolio_photos directory if it doesn't exist
        portfolio_dir = os.path.join(settings.MEDIA_ROOT, 'portfolio_photos')
        os.makedirs(portfolio_dir, exist_ok=True)
        
        # Save file
        file_path = os.path.join(portfolio_dir, unique_filename)
        with open(file_path, 'wb') as f:
            for chunk in photo.chunks():
                f.write(chunk)
        
        # Add to portfolio_photos list
        current_photos = tailor_profile.portfolio_photos or []
        # Use the correct media URL
        photo_url = f"{settings.MEDIA_URL}portfolio_photos/{unique_filename}"
        current_photos.append(photo_url)
        tailor_profile.portfolio_photos = current_photos
        tailor_profile.save()
        
        # Debug information
        print(f"File saved to: {file_path}")
        print(f"Photo URL: {photo_url}")
        print(f"Media URL: {settings.MEDIA_URL}")
        print(f"Media Root: {settings.MEDIA_ROOT}")
        
        return Response({
            'message': 'Photo uploaded successfully',
            'photo_url': photo_url,
            'portfolio_photos': current_photos,
            'debug_info': {
                'file_path': file_path,
                'media_url': settings.MEDIA_URL,
                'media_root': settings.MEDIA_ROOT
            }
        }, status=status.HTTP_201_CREATED)


class DeletePortfolioPhotoView(APIView):
    """Delete portfolio photo for tailor"""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, photo_index):
        try:
            tailor_profile = request.user.tailor_profile
        except TailorProfile.DoesNotExist:
            return Response({'error': 'Tailor profile not found'}, status=status.HTTP_404_NOT_FOUND)

        current_photos = tailor_profile.portfolio_photos or []
        
        if photo_index < 0 or photo_index >= len(current_photos):
            return Response({'error': 'Invalid photo index'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Remove photo from list
        removed_photo = current_photos.pop(photo_index)
        tailor_profile.portfolio_photos = current_photos
        tailor_profile.save()
        
        # Delete the actual file from storage
        import os
        from django.conf import settings
        if removed_photo.startswith(settings.MEDIA_URL):
            # Extract the relative path from the URL
            relative_path = removed_photo[len(settings.MEDIA_URL):]
            file_path = os.path.join(settings.MEDIA_ROOT, relative_path)
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except OSError:
                    pass  # File might already be deleted or in use
        
        return Response({
            'message': 'Photo deleted successfully',
            'portfolio_photos': current_photos
        })


class CreateRequestView(generics.CreateAPIView):
    """Create a new tailoring request"""
    serializer_class = TailoringRequestSerializer

    def perform_create(self, serializer):
        from django.db import transaction
        
        with transaction.atomic():
            # Create the request
            request = serializer.save(user=self.request.user)
            
            # Create notification for tailor
            try:
                Notification.objects.create(
                    user=request.tailor.user,
                    type='request_received',
                    title='New Tailoring Request',
                    message=f'You have received a new request from {request.user.name}',
                    related_request=request
                )
            except Exception as e:
                # Log the notification error but don't fail the request creation
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to create notification for request {request.id}: {str(e)}")
                # Continue with request creation even if notification fails


class MyRequestsView(generics.ListAPIView):
    """Get user's requests"""
    serializer_class = TailoringRequestSerializer

    def get_queryset(self):
        return TailoringRequest.objects.filter(
            user=self.request.user,
            is_deleted=False
        ).order_by('-created_at')


class TailorRequestsView(generics.ListAPIView):
    """Get requests for a tailor"""
    serializer_class = TailoringRequestSerializer

    def get_queryset(self):
        if not self.request.user.is_tailor:
            return TailoringRequest.objects.none()
        try:
            tailor_profile = self.request.user.tailor_profile
            return TailoringRequest.objects.filter(
                tailor=tailor_profile,
                is_deleted=False
            ).order_by('-created_at')
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


class CancelRequestView(APIView):
    """Cancel request (for users)"""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            tailoring_request = TailoringRequest.objects.get(pk=pk, user=request.user)
        except TailoringRequest.DoesNotExist:
            return Response({'error': 'Request not found'}, status=status.HTTP_404_NOT_FOUND)

        # Check if request can be cancelled - allow pending and accepted requests
        if tailoring_request.status not in ['pending', 'accepted']:
            return Response({
                'error': f'Cannot cancel request with status: {tailoring_request.status}. Only pending or accepted requests can be cancelled.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get cancellation reason from request data
        cancellation_reason = request.data.get('reason', 'No reason provided')
        
        # Update status to cancelled and store cancellation reason
        tailoring_request.status = 'cancelled'
        tailoring_request.cancellation_reason = cancellation_reason
        tailoring_request.save()

        # Create notification for tailor with reason
        Notification.objects.create(
            user=tailoring_request.tailor.user,
            type='request_cancelled',
            title='Request Cancelled',
            message=f'Request from {tailoring_request.user.name} has been cancelled.\n\n📝 Customer Reason: "{cancellation_reason}"\n\nThis will help you understand why the customer cancelled and improve your service.',
            related_request=tailoring_request
        )

        # Create notification for user
        Notification.objects.create(
            user=tailoring_request.user,
            type='request_cancelled',
            title='Request Cancelled',
            message=f'Your request to {tailoring_request.tailor.shop_name} has been cancelled',
            related_request=tailoring_request
        )

        return Response(TailoringRequestSerializer(tailoring_request).data)


class CreateReviewView(generics.CreateAPIView):
    """Create a review for a completed request"""
    serializer_class = ReviewSerializer

    def perform_create(self, serializer):
        # Validate that the request is completed
        request_obj = serializer.validated_data.get('request')
        if request_obj.status != 'completed':
            raise serializers.ValidationError({
                'request': 'Reviews can only be created for completed requests.'
            })
        
        # Check if a review already exists for this request
        if hasattr(request_obj, 'review'):
            raise serializers.ValidationError({
                'request': 'A review already exists for this request.'
            })
        
        serializer.save()


class TailorReviewsView(generics.ListAPIView):
    """Get reviews for a specific tailor"""
    serializer_class = ReviewSerializer

    def get_queryset(self):
        tailor_id = self.kwargs.get('tailor_id')
        return Review.objects.filter(request__tailor_id=tailor_id).order_by('-created_at')


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


class ChangePasswordView(APIView):
    """Change user password"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            try:
                serializer.save()
                return Response({
                    'status': 'success', 
                    'message': 'Your password has been changed successfully. Please sign in again with your new password.'
                })
            except Exception as e:
                return Response({
                    'status': 'error',
                    'message': 'An error occurred while changing your password. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({
            'error': 'Password change failed',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    """Request password reset with email"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                email = serializer.validated_data['email']
                user = User.objects.get(email=email)
                
                # Generate token
                token = generate_reset_token()
                expires_at = timezone.now() + timedelta(minutes=15)
                
                # Create or update reset token
                reset_token, created = PasswordResetToken.objects.update_or_create(
                    user=user,
                    defaults={
                        'token': token,
                        'is_used': False,
                        'expires_at': expires_at
                    }
                )
                
                # Send email
                if send_password_reset_email(email, token):
                    return Response({
                        'status': 'success', 
                        'message': 'Password reset code has been sent to your email address. Please check your inbox and spam folder.'
                    })
                else:
                    return Response({
                        'status': 'error', 
                        'message': 'Failed to send reset code. Please try again later or contact support.'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            except Exception as e:
                return Response({
                    'status': 'error',
                    'message': 'An error occurred while processing your request. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'error': 'Invalid request',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    """Confirm password reset with token"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            try:
                email = serializer.validated_data['email']
                token = serializer.validated_data['token']
                new_password = serializer.validated_data['new_password']
                
                user = User.objects.get(email=email)
                reset_token = PasswordResetToken.objects.get(
                    user=user, 
                    token=token, 
                    is_used=False
                )
                
                if not reset_token.is_valid():
                    return Response({
                        'status': 'error',
                        'message': 'Reset code has expired. Please request a new password reset code.'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Update password
                user.set_password(new_password)
                user.save()
                
                # Mark token as used
                reset_token.is_used = True
                reset_token.save()
                
                return Response({
                    'status': 'success',
                    'message': 'Password has been reset successfully. You can now sign in with your new password.'
                })
                
            except User.DoesNotExist:
                return Response({
                    'status': 'error',
                    'message': 'No account found with this email address.'
                }, status=status.HTTP_400_BAD_REQUEST)
            except PasswordResetToken.DoesNotExist:
                return Response({
                    'status': 'error',
                    'message': 'Invalid or expired reset code. Please request a new password reset code.'
                }, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({
                    'status': 'error',
                    'message': 'An error occurred while resetting your password. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'error': 'Invalid request',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


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


class UploadStorePictureView(APIView):
    """Upload store picture for tailor"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        import os
        from django.conf import settings
        
        try:
            tailor_profile = TailorProfile.objects.get(user=request.user)
        except TailorProfile.DoesNotExist:
            return Response({'error': 'Tailor profile not found'}, 
                          status=status.HTTP_404_NOT_FOUND)

        store_picture = request.FILES.get('store_picture')
        if not store_picture:
            return Response({'error': 'No store picture provided'}, 
                          status=status.HTTP_400_BAD_REQUEST)

        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if store_picture.content_type not in allowed_types:
            return Response({'error': 'Invalid file type. Only JPEG, PNG, and WebP are allowed.'}, 
                          status=status.HTTP_400_BAD_REQUEST)

        # Validate file size (max 5MB)
        if store_picture.size > 5 * 1024 * 1024:
            return Response({'error': 'File too large. Maximum size is 5MB.'}, 
                          status=status.HTTP_400_BAD_REQUEST)

        # Delete old store picture if it exists
        if tailor_profile.store_picture:
            try:
                if os.path.isfile(tailor_profile.store_picture.path):
                    os.remove(tailor_profile.store_picture.path)
            except (ValueError, OSError):
                pass  # File doesn't exist or can't be deleted

        # Save new store picture
        tailor_profile.store_picture = store_picture
        tailor_profile.save()
        
        # Debug information
        print(f"Store picture saved: {tailor_profile.store_picture.url}")
        print(f"Media URL: {settings.MEDIA_URL}")
        print(f"Media Root: {settings.MEDIA_ROOT}")
        
        return Response({
            'message': 'Store picture uploaded successfully',
            'store_picture': tailor_profile.store_picture.url,
            'debug_info': {
                'media_url': settings.MEDIA_URL,
                'media_root': settings.MEDIA_ROOT,
                'file_size': store_picture.size,
                'content_type': store_picture.content_type
            }
        }, status=status.HTTP_201_CREATED)


class DeleteRequestView(APIView):
    """Soft delete a tailoring request"""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            # Check if user is the owner of the request or the tailor
            tailoring_request = TailoringRequest.objects.filter(
                Q(user=request.user) | Q(tailor__user=request.user)
            ).get(pk=pk)
        except TailoringRequest.DoesNotExist:
            return Response({'error': 'Request not found'}, status=status.HTTP_404_NOT_FOUND)

        # Check if already deleted
        if tailoring_request.is_deleted:
            return Response({'error': 'Request already deleted'}, status=status.HTTP_400_BAD_REQUEST)

        # Get deletion reason from request data
        deletion_reason = request.data.get('reason', 'No reason provided')
        
        # Soft delete the request
        tailoring_request.soft_delete(
            deleted_by=request.user,
            reason=deletion_reason
        )
        
        return Response({
            'message': 'Request deleted successfully',
            'deleted_at': tailoring_request.deleted_at,
            'can_restore': True
        })


class RestoreRequestView(APIView):
    """Restore a soft-deleted tailoring request"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            # Check if user is the owner of the request or the tailor
            tailoring_request = TailoringRequest.objects.filter(
                Q(user=request.user) | Q(tailor__user=request.user)
            ).get(pk=pk)
        except TailoringRequest.DoesNotExist:
            return Response({'error': 'Request not found'}, status=status.HTTP_404_NOT_FOUND)

        # Check if request is actually deleted
        if not tailoring_request.is_deleted:
            return Response({'error': 'Request is not deleted'}, status=status.HTTP_400_BAD_REQUEST)

        # Restore the request
        tailoring_request.restore()
        
        return Response({
            'message': 'Request restored successfully',
            'restored_at': tailoring_request.updated_at
        })


class DeletedRequestsView(APIView):
    """Get soft-deleted requests for a user"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Get deleted requests for the current user (as customer or tailor)
        deleted_requests = TailoringRequest.objects.filter(
            Q(user=request.user) | Q(tailor__user=request.user),
            is_deleted=True
        ).order_by('-deleted_at')

        # Serialize the requests
        requests_data = []
        for req in deleted_requests:
            requests_data.append({
                'id': req.id,
                'user': {
                    'name': req.user.name,
                    'email': req.user.email
                },
                'tailor': {
                    'shop_name': req.tailor.shop_name,
                    'user': {
                        'name': req.tailor.user.name,
                        'email': req.tailor.user.email
                    }
                },
                'status': req.status,
                'notes': req.notes,
                'created_at': req.created_at,
                'deleted_at': req.deleted_at,
                'deleted_by': {
                    'name': req.deleted_by.name if req.deleted_by else None,
                    'email': req.deleted_by.email if req.deleted_by else None
                },
                'deletion_reason': req.deletion_reason,
                'can_restore': True
            })

        return Response({
            'deleted_requests': requests_data,
            'count': len(requests_data)
        })


class PermanentlyDeleteRequestView(APIView):
    """Permanently delete a soft-deleted request (cannot be restored)"""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            # Check if user is the owner of the request or the tailor
            tailoring_request = TailoringRequest.objects.filter(
                Q(user=request.user) | Q(tailor__user=request.user)
            ).get(pk=pk)
        except TailoringRequest.DoesNotExist:
            return Response({'error': 'Request not found'}, status=status.HTTP_404_NOT_FOUND)

        # Check if request is actually deleted
        if not tailoring_request.is_deleted:
            return Response({'error': 'Request is not deleted'}, status=status.HTTP_400_BAD_REQUEST)

        # Permanently delete the request
        tailoring_request.delete()
        
        return Response({'message': 'Request permanently deleted'})


class DeleteNotificationView(APIView):
    """Delete a notification"""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)

        notification.delete()
        
        return Response({'message': 'Notification deleted successfully'})


class ClearAllNotificationsView(APIView):
    """Clear all notifications for a user"""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        # Delete all notifications for the current user
        deleted_count = Notification.objects.filter(user=request.user).delete()[0]
        
        return Response({
            'message': f'{deleted_count} notifications cleared successfully'
        })