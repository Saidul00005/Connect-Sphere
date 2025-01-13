from django.db import models
from django.conf import settings

class Department(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Employee(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    department = models.ForeignKey(Department, on_delete=models.PROTECT)
    employee_id = models.CharField(max_length=50, unique=True)
    designation = models.CharField(max_length=100)
    reporting_manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='reporting_employees'
    )
    joining_date = models.DateField()
    contact_number = models.CharField(max_length=20)
    emergency_contact = models.CharField(max_length=20)
    address = models.TextField()
    skills = models.JSONField(default=list)
    performance_rating = models.FloatField(null=True, blank=True)
    last_review_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.employee_id} - {self.user.get_full_name()}"

class EmployeeDocument(models.Model):
    DOCUMENT_TYPES = [
        ('ID_PROOF', 'ID Proof'),
        ('ADDRESS_PROOF', 'Address Proof'),
        ('RESUME', 'Resume'),
        ('CERTIFICATE', 'Certificate'),
        ('OTHER', 'Other')
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    document = models.FileField(upload_to='employee_documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.employee.employee_id} - {self.document_type}"
