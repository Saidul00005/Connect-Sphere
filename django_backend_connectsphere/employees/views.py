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


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]

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

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def profile(self, request):
        try:
            # Get the logged-in user's employee profile
            employee = Employee.objects.get(user=request.user)
        except Employee.DoesNotExist:
            raise NotFound('Employee profile not found for the logged-in user.')

        # Fetch the documents associated with the employee
        documents = EmployeeDocument.objects.filter(employee=employee)

        # Serialize the employee details and documents
        employee_serializer = self.get_serializer(employee)
        document_serializer = EmployeeDocumentSerializer(documents, many=True)

        # Return both in the response
        return Response({
            'employee_details': employee_serializer.data,
            'employee_documents': document_serializer.data
        })



