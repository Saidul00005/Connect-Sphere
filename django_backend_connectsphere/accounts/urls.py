from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import UserViewSet,CustomTokenObtainPairView

router = DefaultRouter()
router.register(r'users', UserViewSet)

urlpatterns = [
    path('/', include(router.urls)),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('pytoken/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('login/', CustomTokenObtainPairView.as_view(), name='custom_token_obtain_pair'),
    path('users/<int:pk>/approve/', UserViewSet.as_view({'post': 'approve_user'}), name='approve_user'),
    path('users/unapproved/', UserViewSet.as_view({'get': 'unapproved_users'}), name='unapproved_users'),
    path('users/all/', UserViewSet.as_view({'get': 'all_users'}), name='all_users'),  # CEO can view all users
]