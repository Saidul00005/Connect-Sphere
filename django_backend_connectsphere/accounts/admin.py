from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Role

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ('id','email', 'username','first_name', 'last_name', 'role', 'profile_picture', 'is_approved', 'approved_by', 'is_active', 'is_staff', 'is_superuser')
    list_filter = ('role', 'is_approved', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('email', 'username', 'role__name', 'is_approved')
    ordering = ('email',)
    actions = ['approve_users']
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'profile_picture')}), 
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('Role Information', {'fields': ('role',)}),  
        ('Approval Information', {'fields': ('is_approved', 'approved_by')}), 
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username','first_name', 'last_name', 'password1', 'password2', 'role', 'profile_picture','is_approved','approved_by', 'is_active', 'is_staff', 'is_superuser')}
        ),
    )

    def approve_users(self, request, queryset):
        queryset.update(is_approved=True)
    approve_users.short_description = "Mark selected users as approved"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('role', 'approved_by')

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'permissions')
    search_fields = ('name',)
    ordering = ('name',)

