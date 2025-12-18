from django.contrib.auth.models import UserManager
from django.apps import apps

class CustomUserManager(UserManager):
    def _get_role_model(self):
        return apps.get_model('accounts', 'Role')

    def _resolve_role(self, value):
        Role = self._get_role_model()
        if isinstance(value, Role):
            return value
        if value is None or value == '':
            return value
        try:
            pk = int(value)
            return Role.objects.get(pk=pk)
        except (ValueError, Role.DoesNotExist):
            try:
                return Role.objects.get(name=str(value).upper())
            except Role.DoesNotExist:
                raise ValueError('Invalid role value')

    def _create_user(self, username, email, password, **extra_fields):
        if 'role' in extra_fields:
            extra_fields['role'] = self._resolve_role(extra_fields['role'])
        return super()._create_user(username, email, password, **extra_fields)
