from django.contrib import admin
from django.apps import apps

# Customize the default admin site
admin.site.site_header = "Connect Sphere Administration"
admin.site.site_title = "Connect Sphere Admin Portal"
admin.site.index_title = "Welcome to the Admin Dashboard"

# Register all models from specified apps
apps_to_register = ['accounts', 'employees', 'chat']

for app_label in apps_to_register:
    app_models = apps.get_app_config(app_label).get_models()
    for model in app_models:
        if model not in admin.site._registry:  # Check if the model is not already registered
            admin.site.register(model)


