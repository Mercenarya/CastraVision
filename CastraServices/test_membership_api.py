from unittest.mock import patch
from uuid import UUID

from django.test import SimpleTestCase, override_settings

from .authentication import RequestAuthContext

USER = "16000000-0000-4000-8000-000000000001"
WS = "26000000-0000-4000-8000-000000000001"
REQUEST = "36000000-0000-4000-8000-000000000001"


@override_settings(SUPABASE_URL="http://127.0.0.1:57321", SUPABASE_PUBLISHABLE_KEY="fixture-public")
class MembershipApiTests(SimpleTestCase):
    def test_onboarding_does_not_require_workspace_or_django_cookie(self):
        with (
            patch(
                "CastraServices.membership_api.verified_identity",
                return_value=("fixture-token", {"id": USER, "email": "candidate@example.test"}),
            ),
            patch(
                "CastraServices.supabase_client.SupabaseDataClient.rpc",
                return_value={"passwordSetupRequired": True},
            ) as rpc,
        ):
            response = self.client.get(
                "/api/onboarding/state/", HTTP_AUTHORIZATION="Bearer fixture-token"
            )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["passwordSetupRequired"])
        rpc.assert_called_once_with("membership_onboarding_state", {})

    def test_anonymous_cannot_list_company_directory(self):
        response = self.client.get("/api/onboarding/companies/")
        self.assertEqual(response.status_code, 401)

    def test_request_actor_and_role_cannot_come_from_client_body(self):
        with (
            patch(
                "CastraServices.membership_api.verified_identity",
                return_value=("fixture-token", {"id": USER}),
            ),
            patch("CastraServices.supabase_client.SupabaseDataClient.rpc") as rpc,
        ):
            response = self.client.post(
                "/api/onboarding/requests/",
                {"workspaceId": WS, "role": "admin", "applicantId": "forged"},
                content_type="application/json",
            )
        self.assertEqual(response.status_code, 400)
        rpc.assert_not_called()

    def test_manager_approval_uses_verified_active_workspace(self):
        context = RequestAuthContext(UUID(USER), UUID(WS), "admin", "fixture-token")
        with (
            patch("CastraServices.membership_api.authenticate_request", return_value=context),
            patch(
                "CastraServices.supabase_client.SupabaseDataClient.rpc",
                return_value={"id": REQUEST, "status": "approved"},
            ) as rpc,
        ):
            response = self.client.post(
                f"/api/workspace/requests/{REQUEST}/review/",
                {"decision": "approve", "teamId": None, "reason": ""},
                content_type="application/json",
                HTTP_X_WORKSPACE_ID=WS,
            )
        self.assertEqual(response.status_code, 200)
        rpc.assert_called_once_with(
            "membership_review_request",
            {
                "p_workspace_id": WS,
                "p_request_id": REQUEST,
                "p_decision": "approve",
                "p_team_id": None,
                "p_reason": "",
            },
        )

    def test_leader_is_denied_before_rpc(self):
        context = RequestAuthContext(UUID(USER), UUID(WS), "manager", "fixture-token")
        with (
            patch("CastraServices.membership_api.authenticate_request", return_value=context),
            patch("CastraServices.supabase_client.SupabaseDataClient.rpc") as rpc,
        ):
            response = self.client.get("/api/workspace/personnel/")
        self.assertEqual(response.status_code, 403)
        rpc.assert_not_called()

    def test_company_pagination_rejects_null_or_unbounded_limit(self):
        with (
            patch(
                "CastraServices.membership_api.verified_identity",
                return_value=("fixture-token", {"id": USER}),
            ),
            patch("CastraServices.supabase_client.SupabaseDataClient.rpc") as rpc,
        ):
            for limit in ("0", "10000", "null"):
                self.assertEqual(
                    self.client.get("/api/onboarding/companies/", {"limit": limit}).status_code, 400
                )
        rpc.assert_not_called()
