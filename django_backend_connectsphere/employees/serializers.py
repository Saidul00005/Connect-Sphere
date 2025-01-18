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
    # documents = EmployeeDocumentSerializer(
    #     many=True,
    #     read_only=True,
    #     source='employeedocument_set'
    # )

    reporting_manager_name = serializers.SerializerMethodField()  # Add a new field for the reporting manager's name
    role_name = serializers.SerializerMethodField()  # New field for role name

    class Meta:
        model = Employee
        fields = '__all__'
        read_only_fields = ('employee_id',)

    def get_reporting_manager_name(self, obj):
        # Ensure that 'reporting_manager' is the Employee object ID referring to the manager
        manager = obj.reporting_manager  # `reporting_manager` is a User instance
        return f"{manager.first_name} {manager.last_name}" if manager else "Unknown"

    def get_role_name(self, obj):
        # Assuming `role` is a ForeignKey in `User` model or you have a role field
        role = obj.user.role  # Fetching the role of the user
        return role.name if role else "Unknown"  # Return the role name or 'Unknown' if role is not set

    def create(self, validated_data):
        department = validated_data.get('department')
    
        # Use atomic transaction to avoid race conditions
        with transaction.atomic():
        # Safeguard against short department names
            dept_code = department.name.ljust(3)[:3].upper()
            count = Employee.objects.filter(department=department).count()
            validated_data['employee_id'] = f"{dept_code}{count + 1:04d}"
        
        # Create the instance
            return super().create(validated_data)