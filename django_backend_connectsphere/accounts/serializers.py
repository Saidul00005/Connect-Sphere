from rest_framework import serializers
from .models import User, Role
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'permissions']

class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='role.name')
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role',
                 'is_approved', 'is_active', 'profile_picture','is_deleted']
        read_only_fields = ['is_approved', 'approved_by']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name']

    def validate_password(self, value):
        # user = self.instance or User(**self.initial_data)
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(str(e))
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # try:
        #     user = User.objects.get(email=attrs['email'])
        # except User.DoesNotExist:
        #     raise AuthenticationFailed('User does not exist.')

        data = super().validate(attrs)
        user = self.user

        if not user.is_approved:
            raise AuthenticationFailed('User account is not approved yet.')

        request_role = self.context['request'].data.get('role')
        if not request_role or user.role.name != request_role:
            raise AuthenticationFailed('Invalid role provided.')

        data['user'] = {
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role.name,
            'is_active': user.is_active,
            # 'profile_picture': user.profile_picture.url if user.profile_picture else None, 
            'profile_picture': user.profile_picture.url if hasattr(user, "profile_picture") and user.profile_picture else None
        }

        return data