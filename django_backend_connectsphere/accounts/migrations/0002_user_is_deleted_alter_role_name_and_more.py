# Generated by Django 5.1.4 on 2025-01-30 08:28

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='is_deleted',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='role',
            name='name',
            field=models.CharField(choices=[('CEO', 'Chief Executive Officer'), ('MANAGER', 'Manager'), ('EMPLOYEE', 'Employee')], max_length=20, unique=True),
        ),
        migrations.AlterField(
            model_name='user',
            name='approved_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL),
        ),
    ]
