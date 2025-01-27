from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import UserViewSet,CustomTokenObtainPairView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    # Custom endpoints for specific functionalities
    path('users/list/all/', UserViewSet.as_view({'get': 'all_users'}), name='all_users'),
    path('users/list/unapproved/', UserViewSet.as_view({'get': 'unapproved_users'}), name='unapproved_users'),
    path('users/search/', UserViewSet.as_view({'get': 'search'}), name='user_search'),
    
    # JWT Token endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('login/', CustomTokenObtainPairView.as_view(), name='custom_token_obtain_pair'),
    
    # Default router endpoints
    path('', include(router.urls)),
    path('users/<int:pk>/approve/', UserViewSet.as_view({'post': 'approve_user'}), name='approve_user'),
]