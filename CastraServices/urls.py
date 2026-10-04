from django.urls import path

from . import account_api, views

app_name = "castra_services"

urlpatterns = [
    path("health/", views.health, name="health"),
    path("strategies/generate/", views.strategy_generate, name="strategy-generate"),
    path("auth/csrf/", account_api.csrf, name="csrf"),
    path("auth/session/", account_api.session, name="session"),
    path("auth/register/", account_api.register, name="register"),
    path("auth/login/", account_api.sign_in, name="login"),
    path("auth/logout/", account_api.sign_out, name="logout"),
    path("business-profile/", account_api.profile, name="business-profile"),
    path("campaign-imports/", account_api.import_history, name="campaign-imports"),
    path("campaign-imports/upload/", account_api.import_file, name="campaign-import-upload"),
    path(
        "campaign-imports/sandbox/",
        account_api.sandbox_import,
        name="campaign-import-sandbox",
    ),
]
