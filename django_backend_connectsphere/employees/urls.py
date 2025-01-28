from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, EmployeeViewSet

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet)
router.register(r'employees', EmployeeViewSet)

urlpatterns = [
    # path('', include(router.urls)),
    path('employees/<int:pk>/', EmployeeViewSet.as_view({'get': 'retrieve'}), name='employee_retrieve_for_CEO_and_user'),
    path('employees/list/', EmployeeViewSet.as_view({'get': 'list'}), name='employee_list'),  

    path('departments/list/', DepartmentViewSet.as_view({'get': 'list'}), name='department_list_for_CEO'), 
    path('departments/<int:pk>/', DepartmentViewSet.as_view({'get': 'retrieve'}), name='department_details_retrieve'),
    path('departments/<int:pk>/department_details/', DepartmentViewSet.as_view({'get': 'department_details'}), name='department_details_for_CEO'),
  
]