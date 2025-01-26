from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.shortcuts import get_object_or_404
from .models import User, Role
from .serializers import UserSerializer, RoleSerializer, UserRegistrationSerializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.tokens import UntypedToken

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def approve_user(self, request, pk=None):
        valid_roles = ['CEO', 'MANAGER', 'EMPLOYEE']  # Add all valid roles
        if request.user.role.name not in valid_roles:
            return Response({'error': 'Unauthorized'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        user = self.get_object()
        user.is_approved = True
        user.approved_by = request.user
        user.save()
        
        return Response({'message': 'User approved successfully'})

    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        role = request.query_params.get('role', '')
        
        users = self.queryset
        if query:
            users = users.filter(
                models.Q(first_name__icontains=query) |
                models.Q(last_name__icontains=query) |
                models.Q(email__icontains=query)
            )
        if role:
            users = users.filter(role__name=role)
            
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Check if the user exists
        try:
            user = User.objects.get(email=attrs['email'])
        except User.DoesNotExist:
            raise AuthenticationFailed('User does not exist.')

        # Call the superclass validation to check password
        data = super().validate(attrs)

        # Additional validation: Check if user is approved
        if not user.is_approved:
            raise AuthenticationFailed('User account is not approved yet.')

        # Additional validation: Ensure the role matches
        request_role = self.context['request'].data.get('role')
        if not request_role or user.role.name != request_role:
            raise AuthenticationFailed('Invalid role provided.')

        # Add custom user information to the response
        data['user'] = {
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role.name,
            'is_active': user.is_active,
            'profile_picture': user.profile_picture.url if user.profile_picture else None, 
        }

        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

