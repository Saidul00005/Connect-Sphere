from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework_api_key.permissions import HasAPIKey
from .pagination import CursorMessagePagination,CursorChatroomPagination
from rest_framework.throttling import UserRateThrottle
from django.utils import timezone
from django.db.models import OuterRef,Count,Subquery,Prefetch,IntegerField,Q
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from accounts.models import User
import os
import redis
import json

REDIS_URL = os.getenv("REDIS_URL")

redis_client = redis.Redis.from_url(REDIS_URL,ssl_cert_reqs=None )

class ChatRoomViewSet(viewsets.ModelViewSet):
    queryset = ChatRoom.objects.all()
    serializer_class = ChatRoomSerializer
    pagination_class = CursorChatroomPagination
    permission_classes = [HasAPIKey,IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def get_queryset(self):
        request = self.request
        user = request.user

        prefetch_users = Prefetch(
        'participants', 
        queryset=User.objects.only('id', 'first_name', 'last_name')
        )

        last_message_subquery = Message.objects.filter(
            room=OuterRef('pk') 
        ).order_by('-timestamp')

        chatrooms = ChatRoom.objects.prefetch_related(prefetch_users).annotate(
        last_message_id=Subquery(last_message_subquery.values('id')[:1]),
        last_message_content=Subquery(last_message_subquery.values('content')[:1]),
        last_message_timestamp=Subquery(last_message_subquery.values('timestamp')[:1]),
        last_message_is_deleted=Subquery(last_message_subquery.values('is_deleted')[:1]),
        last_message_sender_id=Subquery(last_message_subquery.values('sender__id')[:1]),
        last_message_sender_first_name=Subquery(last_message_subquery.values('sender__first_name')[:1]),
        last_message_sender_last_name=Subquery(last_message_subquery.values('sender__last_name')[:1]),
        # unread_messages_count=Count(
        #     'message',
        #     filter=Q(message__is_deleted=False) & ~Q(message__read_by__id=user.id)
        # )
        unread_messages_count=Subquery(
            Message.objects.filter(
                room=OuterRef('pk'),
                is_deleted=False
            ).exclude(
                read_by=user
            ).values('room')
            .annotate(count=Count('*'))
            .values('count'),
            output_field=IntegerField()
        )
        ).filter(is_deleted=False)

        # chatrooms = chatrooms.filter(participants=user)
        
        return chatrooms.order_by('-last_modified_at','-created_at','-id')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        queryset = queryset.filter(participants=request.user)
        
        if not hasattr(request.user, 'role') or request.user.role is None:
            raise PermissionDenied("You do not have permission to view chat rooms.")

        search_query = request.GET.get('search', None)

        # filters = Q()
        # if search_query:
        #     filters &= Q(name__icontains=search_query)

        # if filters:
        #     queryset = queryset.filter(filters).order_by('last_modified_at','id')
        # else:
        #     queryset = queryset.order_by('last_modified_at','id')

        if search_query:
            user = request.user
            direct_filter = Q(type='DIRECT') & (
                Q(participants__first_name__icontains=search_query) |
                Q(participants__last_name__icontains=search_query)
            )
            #  & ~Q(participants__id=user.id)  
            
            group_filter = Q(type='GROUP') & Q(name__icontains=search_query)
            
            queryset = queryset.filter(direct_filter | group_filter).distinct().order_by('last_modified_at','id')
        else:
            queryset = queryset.order_by('last_modified_at','id')


        paginator = CursorChatroomPagination()
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

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        chat_type = request.data.get('type')
        participants = set(request.data.get('participants', []))
        user = request.user

        if user.id in participants:
            participants.remove(user.id)

        if chat_type == 'DIRECT':
            if len(participants) != 1:
                return Response(
                    {'error': 'Direct chats require exactly 2 participants.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            other_user_id = participants.pop()
            participant_ids = sorted([user.id, other_user_id])
            participants_hash = f"{participant_ids[0]}-{participant_ids[1]}"

            existing_chat = ChatRoom.objects.filter(participants_hash=participants_hash).first()
            if existing_chat:
                if existing_chat.is_deleted:
                    existing_chat.is_deleted = False
                    existing_chat.last_restore_at = timezone.now()
                    existing_chat.is_restored = True
                    existing_chat.save()
                    data = self.get_serializer(existing_chat).data
                    data['message'] = 'Chatroom restored successfully.'
                    print("Restored direct chatroom data:", data) 
                    
                else:
                    data = self.get_serializer(existing_chat).data
                    data['message'] = 'Chatroom already exists.'
                
                redis_client.publish(
                'room_events',
                    json.dumps({
                        'event': 'room_created',
                        'roomId':str(existing_chat.id),
                        'data': data  
                    })
                )

                return Response(data, status=status.HTTP_200_OK)
            
            serializer.validated_data['name'] = None 
            chatroom = serializer.save(created_by=user, participants_hash=participants_hash)
            chatroom.participants.add(user, other_user_id)
            data = self.get_serializer(chatroom).data

            redis_client.publish(
                'room_events',
                json.dumps({
                    'event': 'room_created',
                    'roomId': str(chatroom.id),
                    'data': data  
                })
            )
            return Response(data, status=status.HTTP_201_CREATED)

        elif chat_type == 'GROUP':
            group_name = serializer.validated_data.get('name')
            if not group_name or not group_name.strip():
                return Response(
                    {'error': 'Group chats require a valid name.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if len(participants) < 2:
                return Response(
                    {'error': 'Group chats require at least 3 participants.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            chatroom = serializer.save(
                created_by=user,
                participants_hash=None,  
                name=serializer.validated_data.get('name')
            )
            chatroom.participants.add(user, *participants)
            data = self.get_serializer(chatroom).data

            redis_client.publish(
                'room_events',
                json.dumps({
                    'event': 'room_created',
                    'roomId':str(chatroom.id),
                    'data': data
                })
            )
            return Response(data, status=status.HTTP_201_CREATED)
        else:
            return Response(
                {'error': 'Invalid chat type.'},
                status=status.HTTP_400_BAD_REQUEST
            )


    @action(detail=False, methods=['post'])
    def add_participants(self, request):
        room_id = request.data.get('room_id')
        user_ids = request.data.get('user_ids', [])
        
        if not room_id or not user_ids:
            return Response(
                {'error': 'Both room_id and user_ids are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not isinstance(user_ids, list):
            return Response(
                {'error': 'user_ids must be a list of IDs.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return Response(
                {'error': 'Room not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if room.type != 'GROUP':
            return Response(
                {'error': 'Participants can only be added to group chatrooms.'},
                status=status.HTTP_400_BAD_REQUEST
            )


        if room.created_by != request.user:
            return Response(
                {'error': 'You do not have permission to add participants to this room'},
                status=status.HTTP_403_FORBIDDEN
            )

        if request.user.id in user_ids:
            user_ids.remove(request.user.id)
        
        room.participants.add(*user_ids)

        new_users = User.objects.filter(id__in=user_ids)
        users_info = [
            {"id": user.id, "first_name": user.first_name, "last_name": user.last_name}
            for user in new_users
        ]

        redis_client.publish(
            'room_events',
            json.dumps({
                'event': 'participants_added',
                'roomId': str(room.id),
                'data': {
                    'users': users_info,
                    'roomId': room.id
                }
            })
        )

        return Response({'message': 'Participants added successfully'}, status=status.HTTP_200_OK)

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
        chatroom.is_restored = False
        chatroom.save()

        try:    
            redis_client.publish(
                'room_events',
                json.dumps({
                    'event': 'room_deleted',
                    'roomId': str(chatroom.id),
                    'data': {'roomId': chatroom.id}
                })
            )
        except redis.exceptions.ConnectionError as e:
            print(f"Redis publish failed: {e}")  

        return Response({'message': 'Chatroom successfully deleted (soft delete)'},
                        status=status.HTTP_200_OK)

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

    @action(detail=True, methods=['post'])
    def remove_participant_for_chatroom_admin(self, request, pk=None):

        chatroom = self.get_object()
        user_id = request.data.get('user_id')

        if not user_id:
            return Response(
                {'error': 'user_id is required in request body'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if chatroom.type != 'GROUP':
            return Response(
                {'error': 'Participants can only be removed from group chatrooms'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if chatroom.created_by != request.user:
            return Response(
                {'error': 'Only the chatroom owner can remove participants'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            user_to_remove = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not chatroom.participants.filter(id=user_id).exists():
            return Response(
                {'error': 'User is not a participant in this chatroom'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if user_id == chatroom.created_by.id:
            return Response(
                {'error': 'Cannot remove chatroom owner'},
                status=status.HTTP_400_BAD_REQUEST
            )

        chatroom.participants.remove(user_to_remove)
        chatroom.last_modified_at = timezone.now()
        chatroom.save()

        redis_client.publish(
            'room_events',
            json.dumps({
                'event': 'participant_removed',
                'roomId': str(chatroom.id),
                'data': {
                        'user': {
                            'id': user_to_remove.id,
                            'first_name': user_to_remove.first_name,
                            'last_name': user_to_remove.last_name,
                        },
                        'roomId': chatroom.id
                    }
            })
        )

        return Response(
            {'message': f'Participant {user_id} removed successfully'},
            status=status.HTTP_200_OK
        )

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    pagination_class = CursorMessagePagination
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

        return messages.order_by('-timestamp')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        room_id = self.request.data.get('room')

        if not ChatRoom.objects.filter(id=room_id, participants=self.request.user).exists():
            raise PermissionDenied(detail="You are not a participant of this room.")

        message = serializer.save(sender=self.request.user, is_sent=True, is_delivered=True)
        message.read_by.add(self.request.user)

        message_data = MessageSerializer(message).data
        redis_client.publish(
            'message_events',
            json.dumps({
                'event': 'new_message',
                'roomId': str(room_id),
                'data': message_data
            })
        )

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

        redis_client.publish(
            'message_events',
            json.dumps({
                'event': 'edit_message',
                'roomId': str(room_id),
                'data': serializer.data
            })
        )
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

        message_data = MessageSerializer(message).data

        redis_client.publish(
            'message_events',
            json.dumps({
                'event': 'delete_message',
                'roomId': str(room_id),
                'data': message_data
            })
        )

        return Response(
            {'message': 'Message soft deleted successfully'},
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'])
    def mark_as_read(self, request):
        user = request.user
        room_id = request.data.get('room_id')

        if not room_id:
            return Response(
                {'error': 'room_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            room = ChatRoom.objects.get(id=room_id, participants=user)
        except ChatRoom.DoesNotExist:
            return Response(
                {'error': 'Room not found or access denied.'},
                status=status.HTTP_404_NOT_FOUND
            )

        unread_message_ids = Message.objects.filter(
            room=room,
            is_deleted=False
        ).exclude(
            read_by=user
        ).values_list('id', flat=True)

        if not unread_message_ids:
            return Response(
                {'message': 'No unread messages found.'},
                status=status.HTTP_200_OK
            )

        MessageRead = Message.read_by.through
        batch_size = 500  
        
        try:
            for i in range(0, len(unread_message_ids), batch_size):
                batch = unread_message_ids[i:i + batch_size]
                objs = [
                    MessageRead(message_id=mid, user_id=user.id)
                    for mid in batch
                ]
                MessageRead.objects.bulk_create(objs, ignore_conflicts=True)

            # redis_client.publish(
            #     'room_events',
            #     json.dumps({
            #         'event': 'mark_read',
            #         # 'roomId': str(room_id),
            #         'data': {'user': user,'roomId': room_id}
            #     })
            # )

            redis_client.publish(
                'room_events',
                json.dumps({
                    'event': 'mark_read',
                    'roomId': str(room_id),
                    'data': {
                        'user': {
                            'id': user.id,
                            'first_name': user.first_name,
                            'last_name': user.last_name,
                        },
                        'roomId': room_id
                    }
                })
            )
                
        except Exception as e:
            return Response(
                {'error': f'Error marking messages as read: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {
                'message': 'Messages marked as read successfully.',
                'count': len(unread_message_ids)
            },
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