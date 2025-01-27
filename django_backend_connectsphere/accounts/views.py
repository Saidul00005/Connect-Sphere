from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User, Role
from .serializers import UserSerializer, RoleSerializer, UserRegistrationSerializer, CustomTokenObtainPairSerializer
from .pagination import CustomPagination
from rest_framework.exceptions import PermissionDenied


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    pagination_class = CustomPagination
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]


    @action(detail=False, methods=['get'])
    def all_users(self, request):
        if request.user.role.name != 'CEO':
            raise PermissionDenied('Only the CEO can view all users.')

        users = self.queryset.order_by('id') 
        paginator = CustomPagination()
        paginated_users = paginator.paginate_queryset(users, request)
        if paginated_users is not None:
            serializer = self.get_serializer(paginated_users, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def approve_user(self, request, pk=None):
        approver_role = request.user.role.name  
        valid_roles = ['CEO', 'MANAGER']  

        if approver_role not in valid_roles:
            return Response({'error': 'Only CEO or Manager can approve users.'}, 
                            status=status.HTTP_403_FORBIDDEN)

        user = self.get_object() 
        user_role = user.role.name  

        if user == request.user:
            if user_role == 'CEO':
                user.is_approved = True
                user.approved_by = request.user
                user.save()
                return Response({'message': 'You have approved yourself successfully.'})
            else:
                return Response({'error': 'You cannot approve yourself unless you are a CEO.'}, 
                                status=status.HTTP_400_BAD_REQUEST)


        if user_role == 'MANAGER' and approver_role != 'CEO':
            return Response({'error': 'Only a CEO can approve a Manager.'}, 
                            status=status.HTTP_403_FORBIDDEN)

        user.is_approved = True
        user.approved_by = request.user
        user.save()
        return Response({'message': f'User {user.first_name + ' ' + user.last_name} approved successfully.'})

    
    @action(detail=False, methods=['get'])
    def unapproved_users(self, request):
        user_role = request.user.role.name.upper()
        is_user_approved = request.user.is_approved

        if user_role == "CEO":
            users = self.queryset.filter(is_approved=False).order_by('id')
        
        elif user_role == "MANAGER":
            if not is_user_approved:  # Unapproved managers can't access this
                return Response({'error': 'Access denied. Manager account not approved.'}, 
                                status=status.HTTP_403_FORBIDDEN)
            users = self.queryset.filter(is_approved=False, role__name="EMPLOYEE")
        else:
            if not is_user_approved:  
                if user_role == "CEO":
                    users = self.queryset.filter(is_approved=False, id=request.user.id)
                else:
                    return Response({'error': 'Access denied. Unauthorized.'}, 
                                    status=status.HTTP_403_FORBIDDEN)
            else:
                return Response({'error': 'Access denied. Unauthorized.'}, 
                                status=status.HTTP_403_FORBIDDEN)

        paginator = CustomPagination()
        paginated_users = paginator.paginate_queryset(users, request)
        if paginated_users is not None:
            serializer = self.get_serializer(paginated_users, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)

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

        if not users.exists():
            return Response({'message': 'No users found matching the search criteria.'}, 
                            status=status.HTTP_404_NOT_FOUND)

            
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

