from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView,TokenRefreshView
from .models import User, Role
from .serializers import UserSerializer,CustomTokenObtainPairSerializer
from .pagination import CustomPagination
from rest_framework.exceptions import PermissionDenied
from rest_framework_api_key.permissions import HasAPIKey
from rest_framework.throttling import UserRateThrottle
from rest_framework.exceptions import NotFound
from django.http import Http404
from django.db import models


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(is_deleted=False).select_related("role")
    serializer_class = UserSerializer
    permission_classes = [HasAPIKey,permissions.IsAuthenticated]
    pagination_class = CustomPagination
    throttle_classes = [UserRateThrottle]

    def get_object_with_deleted(self):
        return User.objects.select_related("role").get(pk=self.kwargs["pk"])  


    def retrieve(self, request, *args, **kwargs):
        try:
            user = self.get_object()
        except Http404:
            raise NotFound("The requested user does not exist.") 

        if request.user.role.name != "CEO" and request.user != user:
            raise PermissionDenied("You are not authorized to view this user's information.")

        serializer = self.get_serializer(user)  
        return Response(serializer.data, status=status.HTTP_200_OK)

    def list(self, request, *args, **kwargs):
        if request.user.role.name != 'CEO':
            raise PermissionDenied('Only the CEO can view all users.')

        users = self.get_queryset().order_by('id') 
        paginator = self.pagination_class()
        paginated_users = paginator.paginate_queryset(users, request, view=self)

        if paginated_users is not None:
            serializer = self.get_serializer(paginated_users, many=True)
            return paginator.get_paginated_response(serializer.data)

        return Response({"error": "Unable to paginate users."}, status=status.HTTP_400_BAD_REQUEST)

    def create(self, request, *args, **kwargs):
        if request.user.role.name != "CEO":
            return Response({"error": "Only CEO can create users."}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User created successfully.", "user": serializer.data}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        return Response(
        {"detail": "Updating User is not permitted through this route."},
        status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    def destroy(self, request, *args, **kwargs):
        try:
            user = self.get_object()
        except Http404:
            raise NotFound("The requested user does not exist.")

        if request.user.role.name != "CEO":
            raise PermissionDenied("Only the CEO can delete users.")

        user.soft_delete()  

        return Response(
            {"message": f"User {user.first_name} {user.last_name} has been soft deleted."},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["POST"])
    def restore(self, request, pk=None):
        if request.user.role.name != "CEO":
            return Response({"detail": "Only the CEO can restore users."}, status=status.HTTP_403_FORBIDDEN)

        try:
            user = self.get_object_with_deleted()
            if not user.is_deleted:
                return Response({"message": "User is already active."}, status=status.HTTP_400_BAD_REQUEST)

            user.restore()
            return Response({"message": "User restored successfully."}, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({"error": "User not found or not deleted."}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def approve_user(self, request, pk=None):
        try:
            user = self.get_object() 
        except NotFound:
            return Response(
                {'error': 'User not found. Cannot approve non-existent user.'},
                status=status.HTTP_404_NOT_FOUND
            )

        approver_role = request.user.role.name  
        valid_roles = ['CEO', 'MANAGER']  

        if approver_role not in valid_roles:
            return Response({'error': 'Only CEO or Manager can approve users.'}, 
                            status=status.HTTP_403_FORBIDDEN)

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
            users = self.queryset.filter(is_approved=False).order_by('id').select_related("role")
        
        elif user_role == "MANAGER":
            if not is_user_approved:
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

        return Response({"error": "Unable to paginate users."}, status=status.HTTP_400_BAD_REQUEST)
        
        # serializer = self.get_serializer(users, many=True)
        # return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        if request.user.role.name != 'CEO':
            raise PermissionDenied("Only CEO can search user.")

        query = request.query_params.get('q', '')
        role = request.query_params.get('role', '')
        
        users = self.queryset.order_by('id').select_related("role")
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

        paginator = CustomPagination()
        paginated_users = paginator.paginate_queryset(users, request)
        if paginated_users is not None:
            serializer = self.get_serializer(paginated_users, many=True)
            return paginator.get_paginated_response(serializer.data)

        return Response({"error": "Unable to paginate users."}, status=status.HTTP_400_BAD_REQUEST)

        # serializer = self.get_serializer(users, many=True)
        # return Response(serializer.data)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [HasAPIKey]
    throttle_classes = [UserRateThrottle]

class CustomTokenRefreshView(TokenRefreshView):
    permission_classes = [HasAPIKey]
    throttle_classes = [UserRateThrottle]



