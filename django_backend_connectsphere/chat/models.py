from django.db import models
from django.conf import settings

class ChatRoom(models.Model):
    CHAT_TYPES = [
        ('DIRECT', 'Direct Message'),
        ('GROUP', 'Group Chat'),
    ]
    
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=CHAT_TYPES)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, 
                                 on_delete=models.CASCADE)
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='chat_rooms'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

class Message(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE)
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)
    shared_with = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='shared_messages'
    )