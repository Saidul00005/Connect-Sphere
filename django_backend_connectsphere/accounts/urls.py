from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet,CustomTokenObtainPairView,CustomTokenRefreshView


router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
    path('users/', UserViewSet.as_view({'post': 'create'}), name='create_user_for_CEO'),
    path('users/list/', UserViewSet.as_view({'get': 'list'}), name='all_users_for_CEO'),
    path('users/<int:pk>/', UserViewSet.as_view({'get': 'retrieve'}), name='Specific_user_information_for_CEO_and_request_user'),
    path('users/<int:pk>/', UserViewSet.as_view({'delete': 'destroy'}), name='Soft_delete_specific_user_for_CEO'),
    path('users/<int:pk>/restore/', UserViewSet.as_view({'post': 'restore'}), name='Restore_soft_deleted_specific_user_for_CEO'),
    path('users/<int:pk>/approve/', UserViewSet.as_view({'post': 'approve_user'}), name='approve_user_for_CEO_and_Manager'),
    path('users/list/unapproved/', UserViewSet.as_view({'get': 'unapproved_users'}), name='unapproved_users_for_CEO'),
    path('users/search/', UserViewSet.as_view({'get': 'search'}), name='user_search_for_CEO'),

    path('login/', CustomTokenObtainPairView.as_view(), name='custom_token_obtain_pair'),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('pytoken/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
     
]