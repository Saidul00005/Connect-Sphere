from rest_framework import serializers
from .models import Department, Employee, EmployeeDocument
from accounts.models import User

class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='role.name')
    class Meta:
        model = User
        fields = ['id', 'first_name','last_name','role','profile_picture','is_approved','is_deleted']

class DepartmentSerializer(serializers.ModelSerializer):
    employee_count = serializers.SerializerMethodField()
    designations = serializers.SerializerMethodField()
    class Meta:
        model = Department
        fields = ['id','name','description','employee_count', 'designations']

    def get_employee_count(self, obj):
        return Employee.objects.filter(department=obj).count()

    def get_designations(self, obj):
        designations = Employee.objects.filter(department=obj).values_list('designation', flat=True).distinct()
        return list(designations)

class DepartmentSerializerForEmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id','name']

class EmployeeDocumentSerializer(serializers.ModelSerializer):
    document_type_display = serializers.SerializerMethodField()
    class Meta:
        model = EmployeeDocument
        fields = [
            'id', 
            'employee', 
            'document_type', 
            'document_type_display', 
            'document', 
            'uploaded_at', 
            'description', 
        ]

    def get_document_type_display(self, obj):
        return obj.get_document_type_display()

class EmployeeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    department = DepartmentSerializerForEmployeeSerializer(read_only=True)
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        write_only=True,
        source='department'
    )
    documents = EmployeeDocumentSerializer(
        many=True,
        read_only=True,
        source='employeedocument_set'
    )

    reporting_manager_name = serializers.SerializerMethodField() 

    class Meta:
        model = Employee
        fields = '__all__'
        read_only_fields = ('employee_id',)

    def get_reporting_manager_name(self, obj):
        manager = obj.reporting_manager  
        return f"{manager.first_name} {manager.last_name}" if manager else "Unknown"

    def get_role_name(self, obj):
        role = getattr(obj.user, 'role', None)
        return role.name if role else "No role assigned"

    def create(self, validated_data):
        department = validated_data.get('department')

        with transaction.atomic():
            dept_code = department.name.ljust(3)[:3].upper()
            department.last_employee_id += 1
            department.save() 
            validated_data['employee_id'] = f"{dept_code}{department.last_employee_id:04d}"
        
            return super().create(validated_data)


class CustomEmployeeSerializerFor_list_employee_action(serializers.ModelSerializer):
    user__id = serializers.IntegerField(source='user.id', read_only=True)
    user__first_name = serializers.CharField(source='user.first_name', read_only=True)
    user__last_name = serializers.CharField(source='user.last_name', read_only=True)
    user__role_name = serializers.CharField(source='user.role.name', read_only=True)
    department__name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Employee
        fields = ['id', 'user__id', 'user__first_name','user__last_name', 'user__role_name', 'designation', 'department__name']