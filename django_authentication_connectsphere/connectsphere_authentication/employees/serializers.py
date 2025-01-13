from rest_framework import serializers
from .models import Department, Employee, EmployeeDocument
from accounts.serializers import UserSerializer

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

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

    def create(self, validated_data):
        # Generate employee ID (you can customize this logic)
        department = validated_data.get('department')
        count = Employee.objects.filter(department=department).count()
        validated_data['employee_id'] = f"{department.name[:3].upper()}{count + 1:04d}"
        return super().create(validated_data)