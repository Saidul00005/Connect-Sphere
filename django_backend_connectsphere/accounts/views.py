from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.shortcuts import get_object_or_404
from .models import User, Role
from .serializers import UserSerializer, RoleSerializer, UserRegistrationSerializer

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