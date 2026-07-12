from django.apps import AppConfig


class TailorsAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'tailors_app'
    
    def ready(self):
        import tailors_app.signals
