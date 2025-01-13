from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Role

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ('email', 'username', 'role', 'profile_picture', 'is_approved', 'approved_by', 'is_active', 'is_staff', 'is_superuser')
    list_filter = ('role', 'is_approved', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('email', 'username', 'role__name', 'is_approved')
    ordering = ('email',)
    actions = ['approve_users']
    fieldsets = UserAdmin.fieldsets + (
        ('Role Information', {'fields': ('role',)}),  # Adding the role field here
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


