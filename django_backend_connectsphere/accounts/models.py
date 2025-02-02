from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

class Role(models.Model):
    ROLE_CHOICES = [
        ('CEO', 'Chief Executive Officer'),
        ('MANAGER', 'Manager'),
        ('EMPLOYEE', 'Employee'),
    ]
    
    name = models.CharField(max_length=20, choices=ROLE_CHOICES, unique=True)
    permissions = models.JSONField(default=dict)

    def __str__(self):
        return self.get_name_display() 


class User(AbstractUser):
    email = models.EmailField(unique=True)
    role = models.ForeignKey(Role, on_delete=models.PROTECT)
    is_approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )
    is_active = models.BooleanField(default=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name','role']

    def soft_delete(self):
        self.is_deleted = True
        self.save()

    def restore(self):
        self.is_deleted = False
        self.save()

    def save(self, *args, **kwargs):
        if not self.role:
            self.role, _ = Role.objects.get_or_create(name='EMPLOYEE')
        super().save(*args, **kwargs)
