from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatRoomViewSet, MessageViewSet

router = DefaultRouter()
router.register(r'rooms', ChatRoomViewSet)
router.register(r'messages', MessageViewSet)

urlpatterns = [
    path('', include(router.urls)), 

    path('rooms/', ChatRoomViewSet.as_view({'get': 'list'}), name='chatroom_list_for_request_user'),
    path('rooms/create/', ChatRoomViewSet.as_view({'post': 'create'}), name='create_chat_room_for_request_user'),

    path('rooms/<int:pk>/', ChatRoomViewSet.as_view({'get': 'retrieve'}), name='fetch_chat_room_details_for_chatroom_participants'),
    path('rooms/<int:pk>/update/', ChatRoomViewSet.as_view({'patch': 'update'}), name='update_chat_room_information_for_chatroom_admin'),
    path('rooms/<int:pk>/delete/', ChatRoomViewSet.as_view({'delete': 'destroy'}), name='soft_delete_chat_room_for_chatroom_admin'),
    path('rooms/<int:pk>/delete/', ChatRoomViewSet.as_view({'delete': 'destroy'}), name='soft_delete_chat_room_for_chatroom_admin'),
    path('rooms/<int:pk>/remove_participant/', ChatRoomViewSet.as_view({'post': 'remove_participant_for_chatroom_admin'}), name='remove_participant_for_chatroom_admin'),
    path('rooms/add_participants/', ChatRoomViewSet.as_view({'post': 'add_participants'}), name='add_participants_in_chat_room_for_chat_room_admin'),


    path('messages/', MessageViewSet.as_view({'get': 'list'}), name='list_messages_for_request_user'),
    path('messages/mark_as_read/', MessageViewSet.as_view({'post': 'mark_as_read'}), name='mark_as_read_messages_in_specific_chatroom_for_request_user'),
    path('messages/create/', MessageViewSet.as_view({'post': 'create'}), name='create_message_in_chat_room_for_chatroom_participants'),

    path('messages/<int:pk>/', MessageViewSet.as_view({'get': 'retrieve'}), name='fetch_message_details_for_message_sender'),
    path('messages/<int:pk>/update/', MessageViewSet.as_view({'patch': 'update'}), name='update_message_for_message_sender'),
    path('messages/<int:pk>/delete/', MessageViewSet.as_view({'delete': 'destroy'}), name='soft_delete_message_for_message_sender'),

    path('messages/<int:pk>/restore/', MessageViewSet.as_view({'post': 'restore_message'}), name='restore_deleted_message_for_CEO'),
    path('messages/soft_deleted_messages/', MessageViewSet.as_view({'get': 'soft_deleted_messages'}), name='list_soft_deleted_messages_for_CEO'),
]