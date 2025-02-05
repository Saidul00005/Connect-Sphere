from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Department, Employee, EmployeeDocument
from .serializers import (
    DepartmentSerializer,
    EmployeeSerializer,
    EmployeeDocumentSerializer,
    DepartmentSerializerForEmployeeSerializer,
    CustomEmployeeSerializerFor_list_employee_action
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound
from rest_framework.throttling import UserRateThrottle
from rest_framework_api_key.permissions import HasAPIKey
from .pagination import CustomPagination
from rest_framework.exceptions import PermissionDenied
from django.db.models import Count,F,Value,Q
from django.db.models.functions import Concat
from django.utils import timezone
from django.contrib.postgres.aggregates import ArrayAgg
from django.db.models.functions import Coalesce

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
        if request.user.role.name != 'CEO':
            raise PermissionDenied("You do not have permission to view department list.")
        
        departments = Department.objects.annotate(
        employee_count=Count('employee', distinct=True),
        designations=Coalesce(
            ArrayAgg('employee__designation', distinct=True), 
            Value([])
            )
        ).order_by('id')

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

    @action(detail=False, methods=['get'])
    def departments_list_for_request_user(self, request):
        departments = Department.objects.all().order_by('id')
        serializer = DepartmentSerializerForEmployeeSerializer(departments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

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

    @action(detail=False, methods=['get'])
    def list_employee(self, request):
        if not hasattr(request.user, 'role') or request.user.role is None:
            raise PermissionDenied("You do not have permission to view this employee's details.")

        department_name = request.GET.get('department', None)
        search_query = request.GET.get('search', None)

        employeesList = Employee.objects.select_related('user', 'department').only(
           'id', 'user__id', 'user__first_name','user__last_name', 'user__role__name', 'designation', 'department__name'
        )

        filters = Q()
        if department_name:
            filters &= Q(department__name__iexact=department_name) 
        if search_query:
            filters &= Q(user__first_name__icontains=search_query) | Q(user__last_name__icontains=search_query)

        employeesList = employeesList.filter(filters).order_by('id') 

        serializer = CustomEmployeeSerializerFor_list_employee_action(employeesList, many=True)

        paginator = CustomPagination()
        paginated_employees = paginator.paginate_queryset(serializer.data, request)

        if paginated_employees is not None:
            return paginator.get_paginated_response(paginated_employees)

        return Response({"error": "Unable to paginate employees."}, status=status.HTTP_400_BAD_REQUEST)


    def retrieve(self, request, *args, **kwargs):
        employee = self.get_object()

        if not (request.user.role.name == 'CEO'):
            raise PermissionDenied("You do not have permission to view this employee's details.")

        serializer = self.get_serializer(employee)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def retrieve_by_user_id(self, request, user_id=None):
        try:
            employee = Employee.objects.get(user__id=user_id)
        except Employee.DoesNotExist:
            raise NotFound("Employee not found for this user.")

        if not (request.user.id == int(user_id)):
            raise PermissionDenied("You do not have permission to view this employee.")

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

    @action(detail=True, methods=['get'])
    def get_employee_details(self, request, pk=None):
        employee = self.get_object()

        if not request.user.role:
            raise PermissionDenied("You do not have permission to view this employee's details.")

        employee_data = {
            'employee_id': employee.employee_id,
            'name': employee.full_name,
            'role':employee.role_name,
            'designation': employee.designation,
            'reporting_manager': employee.reporting_manager_name,
            'joining_date': employee.joining_date,
            'performance_rating': employee.performance_rating,
            'last_review_date': employee.last_review_date,
            'department': employee.department.name,
            'contact_number': employee.contact_number,
            'emergency_contact': employee.emergency_contact,
            'address': employee.address,
            'skills': employee.skills,
        }

        return Response(employee_data)
    
    @action(detail=True, methods=['get'])
    def documents(self, request, pk=None):
        employee = self.get_object()
        
        if not (request.user.role.name == 'CEO' or employee.user == request.user):
            raise PermissionDenied("You do not have permission to view these documents.")
        
        documents = EmployeeDocument.objects.filter(employee=employee)
        serializer = EmployeeDocumentSerializer(documents, many=True)
        return Response(serializer.data)

    def get_queryset(self):
        if self.request.user.role.name != 'CEO':
            return Employee.objects.none()

        queryset = Employee.objects.all()

        department = self.request.query_params.get('department')
        designation = self.request.query_params.get('designation')
        performance_rating = self.request.query_params.get('performance_rating')

        if department:
            queryset = queryset.filter(department_id=department)
        if designation:
            queryset = queryset.filter(designation__iexact=designation.strip())
        if performance_rating:
            try:
                rating = float(performance_rating)
                queryset = queryset.filter(performance_rating=rating)
            except ValueError:
                raise ValidationError({"performance_rating": "Must be a numeric value."})

        return queryset

    @action(detail=True, methods=['post'])
    def upload_document(self, request, pk=None):
        employee = self.get_object()
        document = request.FILES.get('document')
        document_type = request.data.get('document_type')

        user = request.user
        allowed_document_types = ['ID_PROOF', 'ADDRESS_PROOF', 'RESUME', 'CERTIFICATE', 'OTHER']

        if not (hasattr(user, 'role')):
            raise PermissionDenied("You do not have permission to upload documents.")

        is_ceo = user.role.name == 'CEO'
        is_manager = user.role.name == 'Manager'

        if is_manager:
            try:
                manager_employee = user.employee  
                same_department = manager_employee.department == employee.department
            except AttributeError:
                same_department = False

        if not (is_ceo or (is_manager and same_department)):
            raise PermissionDenied("Only CEO or department managers can upload documents.")

        if not document or not document_type:
            return Response(
                {'status': 'error', 'error': 'Both document and document_type are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if document_type not in allowed_document_types:
            return Response(
                {'status': 'error', 'error': f'Invalid document_type. Allowed: {allowed_document_types}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        document = EmployeeDocument.objects.create(
            employee=employee,
            document=document,
            document_type=document_type,
            description=request.data.get('description', '')
        )

        serializer = EmployeeDocumentSerializer(document)
        return Response(
            {
                'status': 'success',
                'message': 'Document uploaded successfully',
                'data': serializer.data
            },
            status=status.HTTP_201_CREATED
        )


    @action(detail=True, methods=['post'])
    def update_performance(self, request, pk=None):

        if not (hasattr(request.user, 'role') and request.user.role.name == 'CEO'):
            raise PermissionDenied("Only the CEO can update performance ratings.")

        employee = self.get_object()
        rating = request.data.get('rating')

        if rating is None:
            return Response(
                {'error': 'Rating is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            rating = float(rating)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Rating must be a numeric value'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not (0.0 <= rating <= 5.0):
            return Response(
                {'error': 'Rating must be between 0.0 and 5.0'},
                status=status.HTTP_400_BAD_REQUEST
            )

        employee.performance_rating = rating
        employee.last_review_date = timezone.now().date()
        employee.save()

        serializer = self.get_serializer(employee)
        return Response(
        {'message': 'Performance rating updated successfully', 'employee': serializer.data},
        status=status.HTTP_200_OK
    )

