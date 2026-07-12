from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'tailors_app'

urlpatterns = [
    # Authentication
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/password-reset-request/', views.PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('auth/password-reset-confirm/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    
    # User Profile
    path('users/profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('users/location/', views.update_location, name='update_location'),
    path('users/change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    
    # Tailor Profile
    path('tailors/profile/', views.TailorProfileView.as_view(), name='tailor_profile'),
    path('tailors/profile/create/', views.CreateTailorProfileView.as_view(), name='create_tailor_profile'),
    path('tailors/requests/', views.TailorRequestsView.as_view(), name='tailor_requests'),
    path('tailors/portfolio/upload/', views.UploadPortfolioPhotoView.as_view(), name='upload_portfolio_photo'),
    path('tailors/portfolio/delete/<int:photo_index>/', views.DeletePortfolioPhotoView.as_view(), name='delete_portfolio_photo'),
    path('tailors/profile/store-picture/', views.UploadStorePictureView.as_view(), name='upload_store_picture'),
    
    # Shops
    path('shops/nearby/', views.NearbyShopsView.as_view(), name='nearby_shops'),
    path('shops/<int:tailor_id>/portfolio/', views.TailorPortfolioView.as_view(), name='tailor_portfolio'),
    
    # Requests
    path('requests/create/', views.CreateRequestView.as_view(), name='create_request'),
    path('requests/my/', views.MyRequestsView.as_view(), name='my_requests'),
    path('requests/<int:pk>/', views.RequestDetailView.as_view(), name='request_detail'),
    path('requests/<int:pk>/update-status/', views.UpdateRequestStatusView.as_view(), name='update_request_status'),
    path('requests/<int:pk>/cancel/', views.CancelRequestView.as_view(), name='cancel_request'),
    path('requests/<int:pk>/delete/', views.DeleteRequestView.as_view(), name='delete_request'),
    
    # Deleted Requests Management
    path('requests/deleted/', views.DeletedRequestsView.as_view(), name='deleted_requests'),
    path('requests/<int:pk>/restore/', views.RestoreRequestView.as_view(), name='restore_request'),
    path('requests/<int:pk>/permanent-delete/', views.PermanentlyDeleteRequestView.as_view(), name='permanent_delete_request'),
    
    # Reviews
    path('reviews/create/', views.CreateReviewView.as_view(), name='create_review'),
    path('tailors/<int:tailor_id>/reviews/', views.TailorReviewsView.as_view(), name='tailor_reviews'),
    
    # Notifications
    path('notifications/', views.NotificationsView.as_view(), name='notifications'),
    path('notifications/<int:pk>/read/', views.MarkNotificationReadView.as_view(), name='mark_notification_read'),
    path('notifications/<int:pk>/delete/', views.DeleteNotificationView.as_view(), name='delete_notification'),
    path('notifications/clear-all/', views.ClearAllNotificationsView.as_view(), name='clear_all_notifications'),
    
    # Messages
    path('requests/<int:request_id>/messages/', views.MessagesView.as_view(), name='request_messages'),
]
