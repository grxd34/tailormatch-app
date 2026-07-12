from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from cryptography.fernet import Fernet
import json
import os


class User(AbstractUser):
    """Extended User model with additional fields for TailorMatch"""
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    location_lat = models.FloatField(null=True, blank=True)
    location_lng = models.FloatField(null=True, blank=True)
    profile_photo = models.ImageField(upload_to='profile_photos/', blank=True, null=True)
    is_tailor = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'name']

    def __str__(self):
        return f"{self.name} ({self.email})"


class TailorProfile(models.Model):
    """Profile for tailors with shop information and skills"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='tailor_profile')
    shop_name = models.CharField(max_length=200)
    skills = models.JSONField(default=list, help_text="List of skills like ['suits', 'dresses']")
    portfolio_photos = models.JSONField(default=list, help_text="List of portfolio image URLs")
    store_picture = models.ImageField(upload_to='store_photos/', blank=True, null=True, help_text="Main store/shop picture")
    availability = models.JSONField(default=dict, help_text="Availability schedule like {'mon': '9-5'}")
    pricing = models.JSONField(default=dict, blank=True, help_text="Pricing information")
    bio = models.TextField(blank=True)
    address = models.CharField(max_length=300, blank=True)
    rating = models.FloatField(default=0.0, validators=[MinValueValidator(0.0), MaxValueValidator(5.0)])
    total_reviews = models.IntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.shop_name} - {self.user.name}"

    @property
    def location_lat(self):
        return self.user.location_lat

    @property
    def location_lng(self):
        return self.user.location_lng


class TailoringRequest(models.Model):
    """Request for tailoring services"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('in_progress', 'In Progress'),
        ('ready_for_fitting', 'Ready for Fitting'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requests')
    tailor = models.ForeignKey(TailorProfile, on_delete=models.CASCADE, related_name='requests')
    measurements = models.JSONField(help_text="Encrypted measurements data")
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    estimated_completion = models.DateField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True, null=True, help_text="Reason provided by customer for cancellation")
    
    # Soft delete fields
    is_deleted = models.BooleanField(default=False, help_text="Soft delete flag")
    deleted_at = models.DateTimeField(null=True, blank=True, help_text="When the request was deleted")
    deleted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='deleted_requests', help_text="User who deleted the request")
    deletion_reason = models.TextField(blank=True, null=True, help_text="Reason for deletion")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Request from {self.user.name} to {self.tailor.shop_name}"

    def set_measurements(self, measurements_dict):
        """Encrypt and store measurements with improved error handling"""
        try:
            # Validate measurements data before encryption
            if not isinstance(measurements_dict, dict):
                raise ValueError("Measurements must be a dictionary")
            
            # Ensure all values are serializable
            json.dumps(measurements_dict)
            
            # Generate encryption key
            key = Fernet.generate_key()
            f = Fernet(key)
            
            # Encrypt the measurements
            encrypted_data = f.encrypt(json.dumps(measurements_dict).encode())
            
            # Store encrypted data and key
            self.measurements = {
                'encrypted_data': encrypted_data.decode(),
                'key': key.decode(),
                'version': '1.0'  # Add version for future compatibility
            }
            self.save()
            
        except (TypeError, ValueError, json.JSONDecodeError) as e:
            raise ValueError(f"Invalid measurements data: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to encrypt measurements: {str(e)}")

    def get_measurements(self):
        """Decrypt and return measurements with improved error handling"""
        if not self.measurements or 'encrypted_data' not in self.measurements:
            return {}
        
        try:
            # Check if key exists
            if 'key' not in self.measurements:
                raise ValueError("Encryption key not found")
            
            # Decrypt the data
            f = Fernet(self.measurements['key'].encode())
            decrypted_data = f.decrypt(self.measurements['encrypted_data'].encode())
            
            # Parse JSON
            measurements = json.loads(decrypted_data.decode())
            
            # Validate the decrypted data
            if not isinstance(measurements, dict):
                raise ValueError("Decrypted data is not a valid dictionary")
            
            return measurements
            
        except (KeyError, ValueError, json.JSONDecodeError) as e:
            # Log the error for debugging but return empty dict to prevent crashes
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to decrypt measurements for request {self.id}: {str(e)}")
            return {}
        except Exception as e:
            # Log unexpected errors
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Unexpected error decrypting measurements for request {self.id}: {str(e)}")
            return {}

    def soft_delete(self, deleted_by, reason=None):
        """Soft delete the request"""
        from django.utils import timezone
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.deleted_by = deleted_by
        self.deletion_reason = reason
        self.save()

    def restore(self):
        """Restore a soft-deleted request"""
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by = None
        self.deletion_reason = None
        self.save()

    @property
    def is_active(self):
        """Check if request is active (not soft deleted)"""
        return not self.is_deleted


class Review(models.Model):
    """Reviews for tailoring services"""
    request = models.OneToOneField(TailoringRequest, on_delete=models.CASCADE, related_name='review')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review for {self.request.tailor.shop_name} - {self.rating} stars"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update tailor's rating
        self.update_tailor_rating()

    def update_tailor_rating(self):
        """Update tailor's average rating"""
        tailor = self.request.tailor
        reviews = Review.objects.filter(request__tailor=tailor)
        if reviews.exists():
            total_rating = sum(review.rating for review in reviews)
            tailor.rating = total_rating / reviews.count()
            tailor.total_reviews = reviews.count()
            tailor.save()


class Notification(models.Model):
    """Real-time notifications for users"""
    NOTIFICATION_TYPES = [
        ('request_received', 'Request Received'),
        ('request_accepted', 'Request Accepted'),
        ('request_rejected', 'Request Rejected'),
        ('status_update', 'Status Update'),
        ('message', 'Message'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    related_request = models.ForeignKey(TailoringRequest, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.user.name}"


class Message(models.Model):
    """Chat messages between users and tailors"""
    request = models.ForeignKey(TailoringRequest, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message in {self.request} from {self.sender.name}"


class PasswordResetToken(models.Model):
    """Password reset tokens for email verification"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.CharField(max_length=6, unique=True)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def __str__(self):
        return f"Reset token for {self.user.email}"

    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at

    def is_valid(self):
        return not self.is_used and not self.is_expired()