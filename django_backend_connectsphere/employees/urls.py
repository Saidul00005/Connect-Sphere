from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, EmployeeViewSet

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet)
router.register(r'employees', EmployeeViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('employees/', EmployeeViewSet.as_view({'get': 'list'}), name='employee_list_for_CEO'), 
    path('employees/list_employee/', EmployeeViewSet.as_view({'get': 'list_employee'}), name='employee_list_for_request_user'), 
    path('employees/<int:pk>/', EmployeeViewSet.as_view({'get': 'retrieve'}), name='employee_retrieve_for_CEO_and_requestUser'), 
    path('employees/retrieve_by_user_id/<int:user_id>/', EmployeeViewSet.as_view({'get': 'retrieve_by_user_id'}), name='employee_profile_by_user_id_for_request_user'),
    path('employees/public_details_of_employee_by_user_id/<int:user_id>/', EmployeeViewSet.as_view({'get': 'public_details_of_employee_by_user_id'}), name='employee_public_details_by_user_id_for_user'),
    path('employees/<int:pk>/get_employee_details/', EmployeeViewSet.as_view({'get': 'get_employee_details'}), name='employee_retrieve_for_all_users'),  
    path('employees/<int:pk>/documents/', EmployeeViewSet.as_view({'get': 'documents'}), name='employee_documents_for_CEO_and_requestUser'),
    path('employees/<int:pk>/update_performance/', EmployeeViewSet.as_view({'post': 'update_performance'}), name='update_performance_of_employee_for_CEO'),
    path('employees/<int:pk>/upload_document/', EmployeeViewSet.as_view({'post': 'upload_document'}), name='upload_document_of_employee_for_CEO_and_department_manager'),

    path('departments/', DepartmentViewSet.as_view({'get': 'list'}), name='department_list_for_CEO'), 
    path('departments/departments_list_for_request_user/', DepartmentViewSet.as_view({'get': 'departments_list_for_request_user'}), name='departments_list_for_request_user'),
    path('departments/<int:pk>/', DepartmentViewSet.as_view({'get': 'retrieve'}), name='department_details_retrieve'),
]