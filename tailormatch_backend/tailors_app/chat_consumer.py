import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import TailoringRequest, Message

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.request_id = self.scope['url_route']['kwargs']['request_id']
        self.room_group_name = f'chat_{self.request_id}'
        
        # Check if user has access to this request
        if await self.check_user_access():
            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        message_type = text_data_json.get('type', 'chat_message')
        
        if message_type == 'chat_message':
            # Save message to database
            message_obj = await self.save_message(message)
            
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': {
                        'id': message_obj['id'],
                        'sender': message_obj['sender'],
                        'message': message_obj['message'],
                        'created_at': message_obj['created_at']
                    }
                }
            )
        elif message_type == 'typing':
            # Broadcast typing indicator
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'typing',
                    'user': self.scope['user'].name,
                    'is_typing': text_data_json.get('is_typing', False)
                }
            )

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': message
        }))

    # Receive typing indicator from room group
    async def typing(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user': event['user'],
            'is_typing': event['is_typing']
        }))

    @database_sync_to_async
    def check_user_access(self):
        """Check if user has access to this request"""
        try:
            request = TailoringRequest.objects.get(id=self.request_id)
            user = self.scope['user']
            
            # User can access if they are the customer or the tailor
            return (user == request.user or user == request.tailor.user)
        except TailoringRequest.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, message_text):
        """Save message to database and return message data"""
        try:
            request = TailoringRequest.objects.get(id=self.request_id)
            user = self.scope['user']
            
            message = Message.objects.create(
                request=request,
                sender=user,
                message=message_text
            )
            
            return {
                'id': message.id,
                'sender': {
                    'id': user.id,
                    'name': user.name,
                    'email': user.email
                },
                'message': message.message,
                'created_at': message.created_at.isoformat()
            }
        except Exception as e:
            print(f"Error saving message: {e}")
            return None
