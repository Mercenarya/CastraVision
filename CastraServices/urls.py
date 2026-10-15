from django.urls import path

from . import campaign_api, views

app_name = "castra_services"

urlpatterns = [
    path("health/", views.health, name="health"),
    path("strategies/generate/", views.strategy_generate, name="strategy-generate"),
    path("campaign-imports/upload/", campaign_api.import_file, name="campaign-import-upload"),
    path("campaign-imports/sandbox/", campaign_api.sandbox_import, name="campaign-import-sandbox"),
]
