from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, TailorProfile, TailoringRequest, Review, Notification, Message, PasswordResetToken


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'name', 'phone', 'password', 'password_confirm', 'is_tailor')
        extra_kwargs = {
            'username': {'required': True},
            'email': {'required': True},
            'name': {'required': True},
        }

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken. Please choose a different one.")
        if len(value) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters long.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists. Please use a different email or try logging in.")
        return value

    def validate_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Name must be at least 2 characters long.")
        return value.strip()

    def validate_phone(self, value):
        if value and len(value.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')) < 10:
            raise serializers.ValidationError("Please enter a valid phone number with at least 10 digits.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match. Please make sure both password fields are identical.")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    email = serializers.CharField()
    password = serializers.CharField()

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError('Email address or username is required.')
        return value

    def validate_password(self, value):
        if not value:
            raise serializers.ValidationError('Password is required.')
        return value

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            auth_username = email
            if '@' not in email:
                try:
                    user_obj = User.objects.get(username=email)
                    auth_username = user_obj.email
                except User.DoesNotExist:
                    pass
            
            user = authenticate(username=auth_username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid email/username or password. Please check your credentials and try again.')
            if not user.is_active:
                raise serializers.ValidationError('Your account has been disabled. Please contact support for assistance.')
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Both email/username and password are required to sign in.')


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile"""
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'name', 'phone', 'location_lat', 'location_lng', 
                 'profile_photo', 'is_tailor', 'created_at')
        read_only_fields = ('id', 'created_at')


class TailorProfileSerializer(serializers.ModelSerializer):
    """Serializer for tailor profile"""
    user = UserSerializer(read_only=True)
    location_lat = serializers.FloatField(source='user.location_lat', read_only=True)
    location_lng = serializers.FloatField(source='user.location_lng', read_only=True)

    class Meta:
        model = TailorProfile
        fields = ('id', 'user', 'shop_name', 'skills', 'portfolio_photos', 'store_picture', 'availability', 
                 'pricing', 'bio', 'address', 'rating', 'total_reviews', 'is_verified', 
                 'location_lat', 'location_lng', 'created_at')
        read_only_fields = ('id', 'rating', 'total_reviews', 'created_at')


class TailorProfileCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating tailor profile"""
    class Meta:
        model = TailorProfile
        fields = ('shop_name', 'skills', 'portfolio_photos', 'store_picture', 'availability', 'pricing', 'bio', 'address')


class TailoringRequestSerializer(serializers.ModelSerializer):
    """Serializer for tailoring requests"""
    user = UserSerializer(read_only=True)
    tailor = serializers.PrimaryKeyRelatedField(queryset=TailorProfile.objects.all(), write_only=True)
    tailor_details = TailorProfileSerializer(source='tailor', read_only=True)
    measurements = serializers.JSONField(write_only=True)
    decrypted_measurements = serializers.SerializerMethodField()

    class Meta:
        model = TailoringRequest
        fields = ('id', 'user', 'tailor', 'tailor_details', 'measurements', 'decrypted_measurements', 'notes', 
                 'status', 'estimated_completion', 'cancellation_reason', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def validate_tailor(self, value):
        """Validate that the tailor exists and is available"""
        if not value:
            raise serializers.ValidationError("Please select a tailor.")
        
        # Check if tailor has a complete profile
        if not value.shop_name:
            raise serializers.ValidationError("Selected tailor profile is incomplete.")
        
        return value

    def validate_measurements(self, value):
        """Validate measurements data"""
        if not value or not isinstance(value, dict):
            raise serializers.ValidationError("Measurements must be provided as a valid object.")
        
        if len(value) == 0:
            raise serializers.ValidationError("At least one measurement is required.")
        
        # Check for valid numeric values
        for key, val in value.items():
            if not isinstance(val, (int, float)) or val <= 0:
                raise serializers.ValidationError(f"Measurement '{key}' must be a positive number.")
        
        return value

    def validate(self, attrs):
        """Cross-field validation"""
        user = self.context['request'].user
        tailor = attrs.get('tailor')
        
        if tailor:
            # Check for duplicate pending requests
            existing_request = TailoringRequest.objects.filter(
                user=user,
                tailor=tailor,
                status__in=['pending', 'accepted', 'in_progress'],
                is_deleted=False
            ).first()
            
            if existing_request:
                raise serializers.ValidationError({
                    'tailor': f'You already have a pending request with {tailor.shop_name}. Please wait for it to be completed or cancelled.'
                })
        
        return attrs

    def get_decrypted_measurements(self, obj):
        """Return decrypted measurements for the request owner"""
        request = self.context.get('request')
        if request and (request.user == obj.user or request.user == obj.tailor.user):
            return obj.get_measurements()
        return {}

    def create(self, validated_data):
        measurements = validated_data.pop('measurements')
        # Create the request with a temporary measurements field
        request = TailoringRequest.objects.create(**validated_data, measurements={})
        request.set_measurements(measurements)
        return request


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for reviews"""
    class Meta:
        model = Review
        fields = ('id', 'request', 'rating', 'comment', 'created_at')
        read_only_fields = ('id', 'created_at')


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications"""
    class Meta:
        model = Notification
        fields = ('id', 'type', 'title', 'message', 'is_read', 'related_request', 'created_at')
        read_only_fields = ('id', 'created_at')


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for chat messages"""
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ('id', 'sender', 'message', 'created_at')
        read_only_fields = ('id', 'created_at')


class NearbyShopsSerializer(serializers.Serializer):
    """Serializer for nearby shops query"""
    lat = serializers.FloatField()
    lng = serializers.FloatField()
    radius = serializers.FloatField(default=10.0)  # km


class RequestStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating request status"""
    status = serializers.ChoiceField(choices=TailoringRequest.STATUS_CHOICES)
    estimated_completion = serializers.DateField(required=False)


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for changing user password"""
    old_password = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])
    new_password_confirm = serializers.CharField()

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match. Please make sure both password fields are identical.")
        return attrs

    def validate_old_password(self, value):
        if not value:
            raise serializers.ValidationError("Current password is required.")
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect. Please enter your current password.")
        return value

    def validate_new_password(self, value):
        if not value:
            raise serializers.ValidationError("New password is required.")
        return value

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for requesting password reset"""
    email = serializers.EmailField()

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError("Email address is required.")
        try:
            User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("No account found with this email address. Please check your email or create a new account.")
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for confirming password reset with token"""
    email = serializers.EmailField()
    token = serializers.CharField(max_length=6)
    new_password = serializers.CharField(validators=[validate_password])
    new_password_confirm = serializers.CharField()

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match. Please make sure both password fields are identical.")
        return attrs

    def validate_token(self, value):
        if not value:
            raise serializers.ValidationError("Reset code is required.")
        if len(value) != 6 or not value.isdigit():
            raise serializers.ValidationError("Reset code must be exactly 6 digits.")
        return value

    def validate_email(self, value):
        if not value:
            raise serializers.ValidationError("Email address is required.")
        try:
            user = User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("No account found with this email address. Please check your email or create a new account.")
        return value