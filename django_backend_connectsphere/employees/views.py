from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Department, Employee, EmployeeDocument
from .serializers import (
    DepartmentSerializer,
    EmployeeSerializer,
    EmployeeDocumentSerializer
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound
from rest_framework.throttling import UserRateThrottle
from rest_framework_api_key.permissions import HasAPIKey
from .pagination import CustomPagination
from rest_framework.exceptions import PermissionDenied
from django.db.models import Count
from django.db.models import F, Value
from django.db.models.functions import Concat


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    pagination_class = CustomPagination
    permission_classes = [HasAPIKey,permissions.IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    # def get_permissions(self):
    #     if self.action in ['create', 'update', 'partial_update', 'destroy']:
    #         return [HasAPIKey(),permissions.IsAuthenticated()]
    #     return [HasAPIKey(),permissions.IsAuthenticated()]
    
    def list(self, request, *args, **kwargs):
        if request.user.role.name not in ['CEO']:
            raise PermissionDenied("You do not have permission to view department list.")
        
        departments = self.get_queryset().order_by('id')  
        
        paginator = CustomPagination()
        paginated_departments = paginator.paginate_queryset(departments, request)
        
        if paginated_departments is not None:
            serializer = self.get_serializer(paginated_departments, many=True)
            return paginator.get_paginated_response(serializer.data)

        return Response({"error": "Unable to paginate departments."}, status=status.HTTP_400_BAD_REQUEST)


    def retrieve(self, request, *args, **kwargs):
        employee = self.get_object()

        if not request.user.role:
            raise PermissionDenied("You do not have permission to view Department details.")
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
       return Response(
        {"detail": "Creating department is not permitted through this route."},
        status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    def update(self, request, *args, **kwargs):
        return Response(
        {"detail": "Updating department is not permitted through this route."},
        status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    def destroy(self, request, *args, **kwargs):
        return Response(
        {"detail": "Deleting department is not permitted through this route."},
        status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    @action(detail=True, methods=['get'])
    def department_details(self, request, pk=None):
        department = self.get_object()

        if request.user.role.name != 'CEO':
            raise PermissionDenied("You do not have permission to view department details.")

        employees = department.employee_set.all().annotate(
            full_name=Concat(F('user__first_name'), Value(' '), F('user__last_name'))
        ).values(
            'id', 
            'full_name',  
            'designation', 
            'performance_rating',
        ).order_by('id')

        paginator = CustomPagination()
        paginated_employees = paginator.paginate_queryset(employees, request)
        
        if paginated_employees is not None:
            employee_count = employees.count()
            department_data = {
                'department_id': department.id,
                'department_name': department.name,
                'department_description':department.description,
                'employee_count': employee_count,
                'employees': paginated_employees
            }
            return paginator.get_paginated_response(department_data)

        return Response({"error": "Unable to paginate department employees."}, status=status.HTTP_400_BAD_REQUEST)

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    pagination_class = CustomPagination
    permission_classes = [HasAPIKey,permissions.IsAuthenticated]
    throttle_classes = [UserRateThrottle]

    def list(self, request, *args, **kwargs):
        if request.user.role.name != 'CEO':
            raise PermissionDenied("You do not have permission to view the employee list.")

        users = self.get_queryset().order_by('id')  
        
        paginator = CustomPagination()
        paginated_users = paginator.paginate_queryset(users, request)
        
        if paginated_users is not None:
            serializer = self.get_serializer(paginated_users, many=True)
            return paginator.get_paginated_response(serializer.data)

        return Response({"error": "Unable to paginate employees."}, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, *args, **kwargs):
        employee = self.get_object()

        if not (request.user.role.name == 'CEO' or employee.user == request.user):
            raise PermissionDenied("You do not have permission to view this employee's details.")

        serializer = self.get_serializer(employee)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
       return Response(
        {"detail": "Creating employees is not permitted through this route."},
        status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    def update(self, request, *args, **kwargs):
        return Response(
        {"detail": "Updating employees is not permitted through this route."},
        status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    def destroy(self, request, *args, **kwargs):
        return Response(
        {"detail": "Deleting employees is not permitted through this route."},
        status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    def get_queryset(self):
        queryset = Employee.objects.all()
        department = self.request.query_params.get('department', None)
        if department:
            queryset = queryset.filter(department_id=department)
        return queryset

    @action(detail=True, methods=['post'])
    def upload_document(self, request, pk=None):
        employee = self.get_object()
        document = request.FILES.get('document')
        document_type = request.data.get('document_type')
        
        if not document or not document_type:
            return Response(
                {'error': 'Both document and document_type are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        document = EmployeeDocument.objects.create(
            employee=employee,
            document=document,
            document_type=document_type,
            description=request.data.get('description', '')
        )

        serializer = EmployeeDocumentSerializer(document)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def documents(self, request, pk=None):
        employee = self.get_object()
        documents = EmployeeDocument.objects.filter(employee=employee)
        serializer = EmployeeDocumentSerializer(documents, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_performance(self, request, pk=None):
        employee = self.get_object()
        rating = request.data.get('rating')
        
        if rating is None:
            return Response(
                {'error': 'Rating is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        employee.performance_rating = rating
        employee.last_review_date = timezone.now().date()
        employee.save()

        serializer = self.get_serializer(employee)
        return Response(serializer.data)



