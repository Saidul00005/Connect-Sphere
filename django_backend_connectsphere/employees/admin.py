from django.contrib import admin
from .models import Department, Employee, EmployeeDocument
from django.utils.html import format_html

class EmployeeInline(admin.TabularInline):
    model = Employee
    extra = 1
    fields = ('user','employee_id', 'designation', 'department', 'reporting_manager', 'joining_date', 'contact_number', 'emergency_contact', 'address','skills','performance_rating', 'last_review_date')
    autocomplete_fields = ['user'] 
    readonly_fields = ('employee_id',)

class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('id','name', 'description', 'created_at', 'updated_at')
    search_fields = ('name',)
    list_filter = ('created_at',)
    inlines = [EmployeeInline]

class EmployeeAdmin(admin.ModelAdmin):
    list_display = (
        'id','employee_id', 'user','full_name', 'department', 'designation','reporting_manager','reporting_manager_name',
        'joining_date', 'contact_number', 'emergency_contact', 'performance_rating', 'last_review_date'
    )
    list_filter = ('department', 'designation', 'performance_rating', 'last_review_date')
    search_fields = ('employee_id', 'user__first_name', 'user__last_name')
    ordering = ('employee_id',)
    autocomplete_fields = ['user', 'department', 'reporting_manager']
    readonly_fields = ('employee_id',)

    def get_reported_to(self, obj):
        return obj.reporting_manager.get_full_name() if obj.reporting_manager else None
    get_reported_to.admin_order_field = 'reporting_manager' 
    get_reported_to.short_description = 'Reporting Manager'

    def save_model(self, request, obj, form, change):
        if not obj.reporting_manager:
            obj.reporting_manager = request.user
        super().save_model(request, obj, form, change)

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser or (
            hasattr(request.user, 'role') and 
            request.user.role.name in ['MANAGER', 'CEO']
        )

    actions = ['mark_as_approved', 'mark_as_pending']

    def mark_as_approved(self, request, queryset):
        # Update the related User's is_approved status
        for employee in queryset:
            employee.user.is_approved = True
            employee.user.save()
    mark_as_approved.short_description = "Approve selected employees"

    def mark_as_pending(self, request, queryset):
        # Update the related User's is_approved status
        for employee in queryset:
            employee.user.is_approved = False
            employee.user.save()
    mark_as_pending.short_description = "Mark selected as pending"

class EmployeeDocumentAdmin(admin.ModelAdmin):
    list_display = ('employee', 'document_type', 'document_link', 'uploaded_at', 'description')
    search_fields = ('employee__employee_id', 'document_type')
    list_filter = ('document_type', 'uploaded_at')
    readonly_fields = ('uploaded_at',)

    def document_link(self, obj):
        return format_html('<a href="{}" target="_blank">View Document</a>', obj.document.url)
    document_link.short_description = 'Document'

admin.site.register(Department, DepartmentAdmin)
admin.site.register(Employee, EmployeeAdmin)
admin.site.register(EmployeeDocument, EmployeeDocumentAdmin)

