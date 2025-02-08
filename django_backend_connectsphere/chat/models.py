from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError

class ChatRoom(models.Model):
    CHAT_TYPES = [
        ('DIRECT', 'Direct Message'),
        ('GROUP', 'Group Chat'),
    ]
    
    name = models.CharField(max_length=255, blank=True, null=True)
    type = models.CharField(max_length=20, choices=CHAT_TYPES)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, 
                                 on_delete=models.CASCADE)
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='chat_rooms'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    is_deleted = models.BooleanField(default=False)
    last_deleted_at = models.DateTimeField(null=True, blank=True)

    last_modified_at = models.DateTimeField(null=True, blank=True)

    is_restored = models.BooleanField(default=False)
    last_restore_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.type})" if self.name else f"ChatRoom {self.id} ({self.type})"

class Message(models.Model):
    room = models.ForeignKey(ChatRoom,related_name="message", on_delete=models.CASCADE)
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True,db_index=True)

    is_deleted = models.BooleanField(default=False)
    last_deleted_at = models.DateTimeField(null=True, blank=True)
    
    is_modified = models.BooleanField(default=False)
    last_modified_at = models.DateTimeField(null=True, blank=True)

    is_restored = models.BooleanField(default=False)
    last_restore_at = models.DateTimeField(null=True, blank=True)

    is_delivered = models.BooleanField(default=False)
    is_sent = models.BooleanField(default=False)
    read_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='read_messages', blank=True,db_index=True)

    def __str__(self):
        return f"Message {self.id} in {self.room.name} by {self.sender.username}"