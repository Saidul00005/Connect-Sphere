from django.contrib import admin
from .models import ChatRoom, Message

@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'type', 'created_by', 'participant_count', 'created_at', 'is_active')
    list_filter = ('type', 'is_active', 'created_at')
    search_fields = ('name', 'created_by__email')
    filter_horizontal = ('participants',)
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)

    def participant_count(self, obj):
        return obj.participants.count()
    participant_count.short_description = 'Participants Count'

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'room', 'sender', 'short_content', 'timestamp', 'is_deleted')
    list_filter = ('timestamp', 'is_deleted', 'room__type')
    search_fields = ('room__name', 'sender__email', 'content')
    filter_horizontal = ('shared_with',)
    readonly_fields = ('timestamp',)
    ordering = ('-timestamp',)

    def short_content(self, obj):
        return (obj.content[:50] + '...') if len(obj.content) > 50 else obj.content
    short_content.short_description = 'Content Preview'
