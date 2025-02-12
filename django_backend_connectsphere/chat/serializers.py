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
    unread_messages_count = serializers.IntegerField(read_only=True)
    name = serializers.SerializerMethodField()

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

    def get_name(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return obj.name  

        if obj.type == 'DIRECT':
            other_user = next(
                (u for u in obj.participants.all() if u != request.user),
                None
            )
            return f"{other_user.first_name} {other_user.last_name}" if other_user else "Deleted User"

        return obj.name

    def get_last_message(self, obj):

        last_message_id = getattr(obj, 'last_message_id', None)
        if not last_message_id:
            return None  

        last_message_id = getattr(obj, 'last_message_id', None)
        last_message_content = getattr(obj, 'last_message_content', None)
        last_message_timestamp = getattr(obj, 'last_message_timestamp', None)
        last_message_is_deleted = getattr(obj, 'last_message_is_deleted', None)
        last_message_sender_id = getattr(obj, 'last_message_sender_id', None)
        last_message_sender_first_name = getattr(obj, 'last_message_sender_first_name', None)
        last_message_sender_last_name = getattr(obj, 'last_message_sender_last_name', None)

        if obj.last_message_id:
            return {
                'id': obj.last_message_id,
                'content': "This message was deleted" if obj.last_message_is_deleted else obj.last_message_content,
                'timestamp': obj.last_message_timestamp,
                'sender': {
                    'id': obj.last_message_sender_id,
                    'first_name': obj.last_message_sender_first_name,
                    'last_name': obj.last_message_sender_last_name,
                }
            }
        return None


    def get_unread_messages_count(self, obj):
        # return getattr(obj, 'unread_messages_count', 0)
        return obj.unread_messages_count or 0

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

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.is_deleted:
            representation['content'] = "This message was deleted"
        return representation
