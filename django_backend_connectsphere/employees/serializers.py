from rest_framework import serializers
from .models import Department, Employee, EmployeeDocument
from accounts.serializers import UserSerializer

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id','name','description']

class EmployeeDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeDocument
        fields = '__all__'

class EmployeeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    department = DepartmentSerializer(read_only=True)
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


    reporting_manager_name = serializers.SerializerMethodField() 
    role_name = serializers.SerializerMethodField()

    def create(self, validated_data):
        department = validated_data.get('department')

        with transaction.atomic():
            dept_code = department.name.ljust(3)[:3].upper()
            department.last_employee_id += 1
            department.save() 
            validated_data['employee_id'] = f"{dept_code}{department.last_employee_id:04d}"
        
            return super().create(validated_data)