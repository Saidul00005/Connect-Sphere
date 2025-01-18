from rest_framework import serializers
from .models import ChatRoom, Message
from accounts.models import User

class ChatRoomSerializer(serializers.ModelSerializer):
    created_by = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),  # Ensure the User model is imported
        required=False  # Make the field optional
    )
    class Meta:
        model = ChatRoom
        fields = ['id', 'name', 'type', 'created_by', 'participants', 
                 'created_at', 'is_active']
        extra_kwargs = {
            'id': {'read_only': True},  # Make id read-only
            'room': {'read_only': False, 'required': True},
            'created_by': {'read_only': True},  # Make created_by read-only
            'created_at': {'read_only': True},  # Make created_at read-only
            'is_active': {'read_only': True}  # Make is_active read-only (if needed)
        }

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'room', 'sender', 'content', 'timestamp', 
                 'is_deleted', 'shared_with']
        extra_kwargs = {
            'id': {'read_only': True},  # Make id read-only
            'sender': {'read_only': True},  # Make sender read-only
            'timestamp': {'read_only': True},  # Make timestamp read-only
            'is_deleted': {'read_only': True},  # Make is_deleted read-only (if needed)
            'shared_with': {'required': False}  # Make shared_with optional
        }


class MessageDeleteSerializer(serializers.Serializer):
    room = serializers.IntegerField(required=True)

    def validate_room(self, value):
        # Check if the room exists
        if not ChatRoom.objects.filter(id=value).exists():
            raise serializers.ValidationError("Room not found")
        return value