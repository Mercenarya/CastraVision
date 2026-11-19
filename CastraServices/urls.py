from django.urls import path

from . import (
    auth_api,
    campaign_api,
    leader_workflow_api,
    manager_tools_api,
    membership_api,
    membership_notifications_api,
    views,
    workspace_api,
)

app_name = "castra_services"

urlpatterns = [
    path("manager/reports/", manager_tools_api.reports),
    path("manager/reports/<uuid:report_id>/", manager_tools_api.reports),
    path("manager/competitors/", manager_tools_api.competitors),
    path("leader/<str:command>/", leader_workflow_api.workflow),
    path("onboarding/state/", membership_api.onboarding_state),
    path("onboarding/companies/", membership_api.companies),
    path("onboarding/requests/", membership_api.requests),
    path("onboarding/requests/<uuid:id>/cancel/", membership_api.cancel_request),
    path("onboarding/invitations/", membership_api.my_invitations),
    path("onboarding/invitations/<uuid:id>/accept/", membership_api.accept_invitation),
    path("workspace/personnel/", membership_api.personnel),
    path("workspace/recruitment/", membership_api.recruitment),
    path("workspace/teams/", membership_api.teams),
    path("workspace/requests/<uuid:id>/review/", membership_api.review_request),
    path("workspace/invitations/", membership_api.invite),
    path("workspace/invitations/<uuid:id>/resend/", membership_api.resend_invitation),
    path("workspace/invitations/<uuid:id>/revoke/", membership_api.revoke_invitation),
    path("workspace/members/<uuid:user_id>/", membership_api.member),
    path("membership-notifications/", membership_notifications_api.notifications),
    path(
        "membership-notifications/<uuid:id>/read/", membership_notifications_api.read_notification
    ),
    path("health/", views.health, name="health"),
    path("strategies/generate/", views.strategy_generate, name="strategy-generate"),
    path("supabase/test/", views.supabase_test, name="supabase-test"),
    path("auth/csrf/", auth_api.retired_password_endpoint, name="csrf"),
    path("auth/session/", auth_api.session, name="session"),
    path("auth/register/", auth_api.retired_password_endpoint, name="register"),
    path("auth/login/", auth_api.retired_password_endpoint, name="login"),
    path("auth/logout/", auth_api.retired_password_endpoint, name="logout"),
    path("business-profile/", workspace_api.profile, name="business-profile"),
    path("campaign-imports/", workspace_api.import_history, name="campaign-imports"),
    path("campaign-imports/upload/", campaign_api.import_file, name="campaign-import-upload"),
]
