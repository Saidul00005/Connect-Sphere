from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework_api_key.permissions import HasAPIKey
from .pagination import CustomPagination
from rest_framework.throttling import UserRateThrottle
from django.utils import timezone
from django.db.models import OuterRef,Count,Subquery,Prefetch,IntegerField
from django.core.exceptions import ValidationError

class ChatRoomViewSet(viewsets.ModelViewSet):
    queryset = ChatRoom.objects.all()
    serializer_class = ChatRoomSerializer
    pagination_class = CustomPagination
    permission_classes = [HasAPIKey,IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def get_queryset(self):
        request = self.request

        last_message_subquery = Message.objects.filter(
            room=OuterRef('pk') 
        ).order_by('-timestamp').values('id')[:1] 

        unread_count_subquery = Message.objects.filter(
            room=OuterRef('pk'), 
        ).exclude(read_by=request.user).values('room').annotate(
            count=Count('id')
        ).values('count')

        chatrooms = ChatRoom.objects.annotate(
            last_message_id=Subquery(last_message_subquery),
            unread_messages_count=Subquery(unread_count_subquery, output_field=IntegerField())
        ).filter(participants__id=request.user.id).order_by('-created_at')

        # chatrooms = chatrooms.prefetch_related(
        #     Prefetch('last_message', queryset=Message.objects.filter(id__in=Subquery(last_message_subquery)))
        # )

        return chatrooms

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        paginator = CustomPagination()
        paginated_queryset = paginator.paginate_queryset(queryset, request)
        
        if paginated_queryset is not None:
            serializer = self.get_serializer(paginated_queryset, many=True)
            return paginator.get_paginated_response(serializer.data)

        return Response({"error": "Unable to paginate chatrooms."}, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, *args, **kwargs):
        chatroom = self.get_object()

        if request.user not in chatroom.participants.all():
            return Response(
                {'error': 'You are not a participant of this chatroom'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(chatroom)

        return Response(serializer.data)

    def perform_create(self, serializer):
        chat_type = self.request.data.get('type') 
        participants = set(self.request.data.get('participants', [])) 

        if self.request.user.id in participants: 
            participants.remove(self.request.user.id)

        if chat_type == 'DIRECT' and len(participants) != 1:  
            raise ValidationError("A direct chat must have exactly 2 participants (including creator).")

        if chat_type == 'GROUP' and len(participants) < 2:  
            raise ValidationError("A group chat must have at least 3 participants (including creator).")

        chatroom = serializer.save(created_by=self.request.user)
        chatroom.participants.add(self.request.user, *participants) 
        
    @action(detail=False, methods=['post'])
    def add_participant(self, request):
        room_id = request.data.get('room_id')
        user_id = request.data.get('user_id')

        if not room_id or not user_id:
            return Response(
                {'error': 'Both room_id and user_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return Response(
                {'error': 'Room not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if room.created_by != self.request.user:
            return Response(
                {'error': 'You do not have permission to add participants to this room'},
                status=status.HTTP_403_FORBIDDEN
            )

        room.participants.add(user_id)
        return Response({'message': 'Participant added successfully'})

    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        if instance.created_by != request.user:
            return Response(
                {'error': 'You do not have permission to update this chatroom'},
                status=status.HTTP_403_FORBIDDEN
            )

        name = request.data.get('name')
        if name:
            instance.name = name
            instance.last_modified_at = timezone.now()  

            instance.save() 

            serializer = self.get_serializer(instance)
            return Response(serializer.data)

        return Response(
            {'error': 'Name field is required to update the chatroom.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    def destroy(self, request, *args, **kwargs):
        chatroom = self.get_object()

        if chatroom.created_by != request.user:
            return Response(
                {'error': 'You do not have permission to delete this chatroom'},
                status=status.HTTP_403_FORBIDDEN
            )

        chatroom.is_deleted = True
        chatroom.last_deleted_at = timezone.now()
        chatroom.save()

        return Response({'message': 'Chatroom successfully deleted (soft delete)'},
                        status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['patch'])
    def restore(self, request, *args, **kwargs):
        chatroom = self.get_object()

        if request.user.role.name != "CEO":
            return Response(
                {'error': 'Only CEO can restore the chatroom'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        chatroom.is_deleted = False
        chatroom.is_restored = True
        chatroom.last_restore_at = timezone.now()
        chatroom.save()

        return Response({'message': 'Chatroom successfully restored'}, status=status.HTTP_200_OK)

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    pagination_class = CustomPagination
    permission_classes = [HasAPIKey,IsAuthenticated]
    throttle_classes = [UserRateThrottle]
    
    def get_queryset(self):
        user = self.request.user
        room_id = self.request.query_params.get('room_id')

        user_chatrooms = ChatRoom.objects.filter(participants=user)

        messages = Message.objects.filter(room__in=user_chatrooms)

        if room_id:
            messages = messages.filter(room_id=room_id)

        # # Exclude soft-deleted messages unless the user is a CEO
        # if user.role.name != 'CEO':
        #     messages = messages.filter(is_deleted=False)

        return messages.order_by('timestamp')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        paginator = CustomPagination()
        paginated_queryset = paginator.paginate_queryset(queryset, request)
        
        if paginated_queryset is not None:
            serializer = self.get_serializer(paginated_queryset, many=True)
            return paginator.get_paginated_response(serializer.data)

        return Response({"error": "Unable to paginate messages."}, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, serializer):
        room_id = self.request.data.get('room')

        if not ChatRoom.objects.filter(id=room_id, participants=self.request.user).exists():
            raise PermissionDenied(detail="You are not a participant of this room.")

        serializer.save(sender=self.request.user)

    def update(self, request, *args, **kwargs):
        message_id = kwargs.get('pk')
        room_id = request.data.get('room')
        content = request.data.get('content')

        if not room_id or not content:
            return Response(
                {'error': 'Room ID and Content are required in the request body'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            message = Message.objects.get(id=message_id)
        except Message.DoesNotExist:
            return Response(
                {'error': 'Message not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return Response(
                {'error': 'Room not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if message.room.id != room.id:
            return Response(
                {'error': 'The message does not belong to the specified room'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if message.sender != self.request.user:
            return Response(
                {'error': 'You do not have permission to update this message'},
                status=status.HTTP_403_FORBIDDEN
            )

        message.is_modified = True
        message.last_modified_at = timezone.now()

        serializer = self.get_serializer(message, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        message_id = kwargs.get('pk')
        room_id = request.data.get('room')

        if not room_id:
            return Response(
                {'error': 'Room ID is required in the request body'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            message = Message.objects.get(id=message_id)
        except Message.DoesNotExist:
            return Response(
                {'error': 'Message not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return Response(
                {'error': 'Room not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if message.room.id != room.id:
            return Response(
                {'error': 'The message does not belong to the specified room'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if message.sender != request.user:
            return Response(
                {'error': 'You do not have permission to delete this message'},
                status=status.HTTP_403_FORBIDDEN
            )

        message.is_deleted = True
        message.is_restored = False
        message.last_deleted_at = timezone.now()
        message.save()

        return Response(
            {'message': 'Message soft deleted successfully'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def restore_message(self, request, pk=None):
        if request.user.role.name != 'CEO':
            return Response(
                {'error': 'Only the CEO can restore soft-deleted messages'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            message = Message.objects.get(id=pk)
        except Message.DoesNotExist:
            return Response(
                {'error': 'Message not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        message.is_deleted = False
        message.is_restored = True
        message.last_restore_at = timezone.now()
        message.save()

        return Response(
            {'message': 'Message restored successfully'},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'])
    def soft_deleted_messages(self, request):
        if request.user.role.name != 'CEO':
            return Response(
                {'error': 'Only the CEO can view soft-deleted messages'},
                status=status.HTTP_403_FORBIDDEN
            )

        queryset = Message.objects.filter(is_deleted=True).order_by('-last_deleted_at')
        paginator = CustomPagination()
        paginated_queryset = paginator.paginate_queryset(queryset, request)

        if paginated_queryset is not None:
            serializer = self.get_serializer(paginated_queryset, many=True)
            return paginator.get_paginated_response(serializer.data)

        return Response({"error": "Unable to paginate messages."}, status=status.HTTP_400_BAD_REQUEST)