from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, TailorProfile, TailoringRequest, Review, Notification, Message


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'name', 'is_tailor', 'is_active', 'created_at')
    list_filter = ('is_tailor', 'is_active', 'created_at')
    search_fields = ('email', 'name')
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('name', 'email', 'phone', 'profile_photo')}),
        ('Location', {'fields': ('location_lat', 'location_lng')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_tailor', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )


@admin.register(TailorProfile)
class TailorProfileAdmin(admin.ModelAdmin):
    list_display = ('shop_name', 'user', 'rating', 'total_reviews', 'is_verified', 'created_at')
    list_filter = ('is_verified', 'created_at')
    search_fields = ('shop_name', 'user__name', 'user__email')
    readonly_fields = ('rating', 'total_reviews', 'created_at', 'updated_at')


@admin.register(TailoringRequest)
class TailoringRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'tailor', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__name', 'tailor__shop_name')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('request', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('request__user__name', 'request__tailor__shop_name')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'type', 'title', 'is_read', 'created_at')
    list_filter = ('type', 'is_read', 'created_at')
    search_fields = ('user__name', 'title')


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('request', 'sender', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('sender__name', 'request__user__name')
