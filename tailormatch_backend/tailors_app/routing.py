from django.urls import re_path
from . import consumers
from . import chat_consumer

websocket_urlpatterns = [
    re_path(r'ws/notifications/$', consumers.NotificationConsumer.as_asgi()),
    re_path(r'ws/chat/(?P<request_id>\w+)/$', chat_consumer.ChatConsumer.as_asgi()),
]
