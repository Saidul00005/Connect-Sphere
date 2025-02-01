from django.contrib import admin
from django.core.exceptions import ValidationError
from django import forms
from .models import ChatRoom, Message

class ChatRoomAdminForm(forms.ModelForm):
    class Meta:
        model = ChatRoom
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        if self.instance and self.instance.pk:
            self.initial['created_by'] = self.instance.created_by

    def clean_participants(self):
        participants = self.cleaned_data.get('participants')
        chat_type = self.cleaned_data.get('type')
        
        if not participants or not chat_type:
            return participants

        created_by = self.cleaned_data.get('created_by') or (self.instance.created_by if self.instance.pk else None)
        
        if not created_by:
            return participants
            
        other_participants = participants.exclude(id=created_by.id)
        other_participants_count = other_participants.count()

        if chat_type == 'DIRECT' and other_participants_count != 1:
            raise forms.ValidationError(
                'Direct chat rooms must have exactly 1 participant (excluding the creator). '
                f'Currently you have selected {other_participants_count} participants.'
            )
        
        if chat_type == 'GROUP' and other_participants_count < 2:
            raise forms.ValidationError(
                'Group chat rooms must have at least 2 participants (excluding the creator). '
                f'Currently you have selected {other_participants_count} participants.'
            )

        return participants

    def clean(self):
        cleaned_data = super().clean()
    
        if self.errors:
            return cleaned_data
            
        participants = cleaned_data.get('participants')
        chat_type = cleaned_data.get('type')
        created_by = cleaned_data.get('created_by')

        if not all([participants, chat_type, created_by]):
            return cleaned_data

        if created_by and created_by not in participants.all():
            cleaned_data['participants'] = participants | ChatRoom.participants.field.related_model.objects.filter(id=created_by.id)

        return cleaned_data

@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    form = ChatRoomAdminForm
    list_display = ('id', 'name', 'type', 'created_by', 'participant_count', 'created_at', 'is_active', 'is_deleted', 'last_deleted_at', 'is_restored', 'last_restore_at')
    list_filter = ('type', 'is_active', 'created_at', 'is_deleted', 'last_deleted_at', 'is_restored', 'last_restore_at')
    search_fields = ('name', 'created_by__email')
    filter_horizontal = ('participants',)
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)

    def save_model(self, request, obj, form, change):
        if not change: 
            obj.created_by = request.user
            form.cleaned_data['created_by'] = request.user
        super().save_model(request, obj, form, change)

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        if form.instance.created_by not in form.instance.participants.all():
            form.instance.participants.add(form.instance.created_by)

    def participant_count(self, obj):
        return obj.participants.count()
    participant_count.short_description = 'Participants Count'

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'room', 'sender', 'short_content', 'timestamp', 'is_deleted', 'last_deleted_at', 'is_modified', 'last_modified_at', 'is_restored', 'last_restore_at', 'is_delivered', 'is_sent')
    list_filter = ('timestamp', 'room__type', 'is_deleted', 'last_deleted_at', 'is_modified', 'last_modified_at', 'is_restored', 'last_restore_at', 'is_delivered', 'is_sent')
    search_fields = ('room__name', 'sender__email', 'content')
    filter_horizontal = ('read_by',)
    readonly_fields = ('timestamp',)
    ordering = ('-timestamp',)

    def short_content(self, obj):
        return (obj.content[:50] + '...') if len(obj.content) > 50 else obj.content
    short_content.short_description = 'Content Preview'