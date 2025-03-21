# Generated by Django 5.1.4 on 2025-01-26 22:21

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Department',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('description', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name='Employee',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('employee_id', models.CharField(max_length=50, unique=True)),
                ('designation', models.CharField(max_length=100)),
                ('joining_date', models.DateField()),
                ('contact_number', models.CharField(max_length=20)),
                ('emergency_contact', models.CharField(max_length=20)),
                ('address', models.TextField()),
                ('skills', models.JSONField(default=list)),
                ('performance_rating', models.FloatField(blank=True, null=True)),
                ('last_review_date', models.DateField(blank=True, null=True)),
                ('department', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='employees.department')),
                ('reporting_manager', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reporting_employees', to=settings.AUTH_USER_MODEL)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='EmployeeDocument',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('document_type', models.CharField(choices=[('ID_PROOF', 'ID Proof'), ('ADDRESS_PROOF', 'Address Proof'), ('RESUME', 'Resume'), ('CERTIFICATE', 'Certificate'), ('OTHER', 'Other')], max_length=20)),
                ('document', models.FileField(upload_to='employee_documents/')),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('description', models.TextField(blank=True)),
                ('employee', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='employees.employee')),
            ],
        ),
    ]
