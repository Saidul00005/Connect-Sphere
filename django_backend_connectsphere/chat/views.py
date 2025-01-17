from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer

class ChatRoomViewSet(viewsets.ModelViewSet):
    queryset = ChatRoom.objects.all()
    serializer_class = ChatRoomSerializer

    def perform_create(self, serializer):
        print("perform_create called")
        print("Current user:", self.request.user)
        # Automatically set the `created_by` field to the current user
        serializer.save(created_by=self.request.user)
    
    def get_queryset(self):
        return ChatRoom.objects.filter(participants=self.request.user)
        # return ChatRoom.objects.all()
    
    @action(detail=False, methods=['post'])  # Set detail=False since room_id is not in the URL
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
        
        # Check if the current user is the creator of the room
        if room.created_by != self.request.user:
            return Response(
                {'error': 'You do not have permission to add participants to this room'}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        room.participants.add(user_id)
        return Response({'message': 'Participant added successfully'})

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    
    def get_queryset(self):
        room_id = self.request.query_params.get('room_id')
        if room_id:
            return Message.objects.filter(room_id=room_id)
        return Message.objects.none()

    def perform_create(self, serializer):
        # Automatically set the sender to the current user
        serializer.save(sender=self.request.user)

def update(self, request, *args, **kwargs):
    # Extract message_id from the URL (kwargs)
    message_id = kwargs.get('pk')  # 'pk' is the primary key from the URL

    # Extract room_id and content from the request body
    room_id = request.data.get('room')  # Extract room_id from the request body
    content = request.data.get('content')  # Extract content from the request body

    # Validate required fields
    if not room_id or not content:
        return Response(
            {'error': 'Room ID and Content are required in the request body'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Get the message object using the message_id from the URL
        message = Message.objects.get(id=message_id)
    except Message.DoesNotExist:
        return Response(
            {'error': 'Message not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        # Get the room object using the room_id from the request body
        room = ChatRoom.objects.get(id=room_id)
    except ChatRoom.DoesNotExist:
        return Response(
            {'error': 'Room not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

    # Check if the message belongs to the specified room
    if message.room.id != room.id:
        return Response(
            {'error': 'The message does not belong to the specified room'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if the current user is the sender of the message
    if message.sender != self.request.user:
        return Response(
            {'error': 'You do not have permission to update this message'}, 
            status=status.HTTP_403_FORBIDDEN
        )

    # Validate and update the message using the serializer
    serializer = self.get_serializer(message, data=request.data, partial=False)
    serializer.is_valid(raise_exception=True)
    serializer.save()

    return Response(serializer.data)