# Signals disabled for development - Redis not required
# from django.db.models.signals import post_save
# from django.dispatch import receiver
# from channels.layers import get_channel_layer
# from asgiref.sync import async_to_sync
# from .models import TailoringRequest, Notification

# channel_layer = get_channel_layer()


# @receiver(post_save, sender=TailoringRequest)
# def send_request_notification(sender, instance, created, **kwargs):
#     """Send WebSocket notification when a request is created or updated"""
#     if created:
#         # New request created - notify tailor
#         notification = Notification.objects.create(
#             user=instance.tailor.user,
#             type='request_received',
#             title='New Tailoring Request',
#             message=f'You have received a new request from {instance.user.name}',
#             related_request=instance
#         )
        
#         # Send WebSocket notification
#         async_to_sync(channel_layer.group_send)(
#             f"notifications_{instance.tailor.user.id}",
#             {
#                 'type': 'send_notification',
#                 'notification': {
#                     'id': notification.id,
#                     'type': notification.type,
#                     'title': notification.title,
#                     'message': notification.message,
#                     'created_at': notification.created_at.isoformat(),
#                 }
#             }
#         )
#     else:
#         # Request updated - notify user
#         notification = Notification.objects.create(
#             user=instance.user,
#             type='status_update',
#             title='Request Status Updated',
#             message=f'Your request status has been updated to {instance.get_status_display()}',
#             related_request=instance
#         )
        
#         # Send WebSocket notification
#         async_to_sync(channel_layer.group_send)(
#             f"notifications_{instance.user.id}",
#             {
#                 'type': 'send_notification',
#                 'notification': {
#                     'id': notification.id,
#                     'type': notification.type,
#                     'title': notification.title,
#                     'message': notification.message,
#                     'created_at': notification.created_at.isoformat(),
#                 }
#             }
#         )
