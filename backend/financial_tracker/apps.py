from django.apps import AppConfig


class FinancialTrackerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'financial_tracker'
    # Preserve the original app label so historical migrations still resolve.
    label = 'project'
