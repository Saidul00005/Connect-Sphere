from rest_framework import serializers
from .models import ChatRoom, Message
from accounts.models import User
from django.db.models import Count

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name','last_name']

class ChatRoomSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True) 
    participants = UserSerializer(many=True, read_only=True) 
    last_message = serializers.SerializerMethodField() 
    unread_messages_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = [
            'id', 'name', 'type', 'created_by', 'participants', 'created_at', 
            'is_active', 'last_message', 'unread_messages_count', 'is_deleted', 
            'last_deleted_at', 'is_restored', 'last_restore_at'
        ]
        extra_kwargs = {
            'id': {'read_only': True},
            'created_at': {'read_only': True},
            'is_active': {'read_only': True},
            'is_deleted': {'read_only': True},
            'last_deleted_at': {'read_only': True},
            'is_restored': {'read_only': True},
            'last_restore_at': {'read_only': True},
        }

    def get_last_message(self, obj):
        last_message = Message.objects.filter(room=obj).order_by('-timestamp').first()
        if last_message:
            return {
                'id': last_message.id,
                'content': last_message.content,
                'timestamp': last_message.timestamp,
                'sender': UserSerializer(last_message.sender).data
            }
        return None

    def get_unread_messages_count(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Message.objects.filter(room=obj).exclude(read_by=request.user).count()
        return 0

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True) 
    read_by = UserSerializer(many=True, read_only=True)  

    class Meta:
        model = Message
        fields = [
            'id', 'room', 'sender', 'content', 'timestamp', 'is_deleted', 
            'read_by', 'is_modified', 'last_modified_at', 'is_restored', 
            'last_restore_at', 'is_delivered', 'is_sent'
        ]
        extra_kwargs = {
            'id': {'read_only': True},
            'timestamp': {'read_only': True},
            'is_deleted': {'read_only': True},
            'is_modified': {'read_only': True},
            'last_modified_at': {'read_only': True},
            'is_restored': {'read_only': True},
            'last_restore_at': {'read_only': True},
            'is_delivered': {'read_only': True},
            'is_sent': {'read_only': True},
        }
