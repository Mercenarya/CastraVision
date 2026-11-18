from unittest.mock import patch
from uuid import UUID

import httpx
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase, override_settings

USER = "11111111-1111-1111-1111-111111111111"
WS = "22222222-2222-2222-2222-222222222222"


@override_settings(
    SUPABASE_URL="https://example.supabase.co", SUPABASE_PUBLISHABLE_KEY="fixture-public"
)
class SupabaseSessionFlowTests(TestCase):
    def setUp(self):
        self.client = Client(enforce_csrf_checks=True)
        self.role = "admin"
        self.auth_user = {
            "id": USER,
            "email": "fixture@example.test",
            "email_confirmed_at": "2026-01-01",
            "app_metadata": {},
            "user_metadata": {"role": "system_admin"},
        }
        self.writes = []
        self.auth_patch = patch("httpx.get", side_effect=self.auth_response)
        self.data_patch = patch("httpx.request", side_effect=self.data_response)
        self.auth_patch.start()
        self.data_patch.start()
        self.addCleanup(self.auth_patch.stop)
        self.addCleanup(self.data_patch.stop)
        self.headers = {
            "HTTP_AUTHORIZATION": "Bearer fixture-user-token",
            "HTTP_X_WORKSPACE_ID": WS,
        }

    def auth_response(self, url, **kwargs):
        self.assertEqual(kwargs["headers"]["Authorization"], "Bearer fixture-user-token")
        self.assertEqual(kwargs["headers"]["apikey"], "fixture-public")
        return httpx.Response(200, json=self.auth_user, request=httpx.Request("GET", url))

    def data_response(self, method, url, **kwargs):
        self.assertEqual(kwargs["headers"]["Authorization"], "Bearer fixture-user-token")
        self.assertEqual(kwargs["headers"]["apikey"], "fixture-public")
        resource = url.rsplit("/", 1)[-1]
        if method != "GET" and resource != "membership_onboarding_state":
            self.writes.append((resource, kwargs))
        if resource == "membership_onboarding_state":
            data = {"passwordSetupRequired": False}
        elif resource == "workspace_members":
            data = [{"workspace_id": WS, "role": self.role, "workspaces": {"name": "Fixture"}}]
        elif resource == "workspaces":
            data = [{"id": WS, "name": "Fixture"}]
        elif resource == "business_profiles":
            data = [{"workspace_id": WS, "industry": "Retail", "company_size": "sme"}]
        else:
            data = []
        return httpx.Response(200, json=data, request=httpx.Request(method, url))

    def test_missing_bearer_is_denied_even_with_django_cookie(self):
        user = get_user_model().objects.create_user(
            username="legacy-local", password="fixture-only"
        )
        self.client.force_login(user)
        for path in ("auth/session/", "business-profile/", "campaign-imports/", "supabase/test/"):
            self.assertEqual(self.client.get("/api/" + path).status_code, 401, path)

    def test_cross_origin_preflight_allows_bearer_and_workspace_header(self):
        response = self.client.options(
            "/api/business-profile/",
            HTTP_ORIGIN="http://localhost:5173",
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="GET",
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS="authorization,x-workspace-id",
        )
        self.assertIn("x-workspace-id", response.headers.get("Access-Control-Allow-Headers", ""))

    def test_session_uses_verified_identity_and_memberships_not_editable_metadata(self):
        response = self.client.get("/api/auth/session/", **self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["user"]["id"], USER)
        self.assertIsNone(response.json()["platform_role"])
        self.assertEqual(response.json()["memberships"][0]["role"], "admin")

    def test_operator_platform_role_is_separate_from_workspace(self):
        self.auth_user["app_metadata"] = {"platform_role": "system_admin"}
        response = self.client.get("/api/auth/session/", **self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["platform_role"], "system_admin")
        self.assertEqual(response.json()["memberships"], [])
        self.assertEqual(self.client.get("/api/business-profile/", **self.headers).status_code, 403)

    def test_workspace_admin_metadata_does_not_become_system_admin(self):
        self.auth_user["app_metadata"] = {"role": "admin"}
        response = self.client.get("/api/auth/session/", **self.headers)
        self.assertIsNone(response.json()["platform_role"])

    def test_operator_role_revocation_is_observed_on_next_request(self):
        self.auth_user["app_metadata"] = {"platform_role": "system_admin"}
        self.assertEqual(
            self.client.get("/api/auth/session/", **self.headers).json()["platform_role"],
            "system_admin",
        )
        self.auth_user["app_metadata"] = {}
        self.assertIsNone(
            self.client.get("/api/auth/session/", **self.headers).json()["platform_role"]
        )

    def test_auth_outage_does_not_fall_back_to_django_identity(self):
        with patch("httpx.get", side_effect=httpx.ConnectError("fixture outage")):
            response = self.client.get("/api/auth/session/", **self.headers)
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["error"]["code"], "AUTH_UNAVAILABLE")

    def test_unconfirmed_email_cannot_enter_business_api(self):
        self.auth_user["email_confirmed_at"] = None
        response = self.client.get("/api/business-profile/", **self.headers)
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["error"]["code"], "EMAIL_CONFIRMATION_REQUIRED")

    def test_profile_accepts_supabase_bearer_without_django_session(self):
        response = self.client.get("/api/business-profile/", **self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["profile"]["business_name"], "Fixture")

    def test_csv_preview_and_commit_use_user_jwt_without_django_session(self):
        content = (
            b"channel,period,spend,clicks,impressions,conversions,revenue\n"
            b"Meta,2026-11,100,10,1000,1,200\n"
        )
        for mode, status in (("preview", 200), ("commit", 201)):
            response = self.client.post(
                "/api/campaign-imports/upload/",
                {
                    "file": SimpleUploadedFile("fixture.csv", content, "text/csv"),
                    "mode": mode,
                    "campaign_id": str(UUID(int=3)),
                },
                **self.headers,
            )
            self.assertEqual(response.status_code, status)
        self.assertEqual(self.writes[-1][0], "leader_workflow")
        body = self.writes[-1][1]["json"]
        self.assertEqual(body["p_workspace_id"], WS)
        self.assertEqual(body["p_command"], "import")
        self.assertEqual(body["p_data"]["campaignId"], str(UUID(int=3)))
        self.assertNotIn("created_by", body["p_data"]["rows"][0])

    def test_legacy_password_endpoints_do_not_create_parallel_accounts(self):
        for path in ("auth/register/", "auth/login/"):
            response = self.client.post(
                "/api/" + path, {"email": "legacy@example.test", "password": "fixture"}
            )
            self.assertEqual(response.status_code, 410)
        self.assertEqual(get_user_model().objects.count(), 0)

    def test_strategy_rejects_anonymous_before_provider(self):
        with patch("CastraServices.views.generate_strategy") as provider:
            response = self.client.post(
                "/api/strategies/generate/", data="{}", content_type="application/json"
            )
        self.assertEqual(response.status_code, 401)
        provider.assert_not_called()

    def test_workspace_header_cannot_select_an_unowned_workspace(self):
        self.headers["HTTP_X_WORKSPACE_ID"] = str(UUID(int=99))
        response = self.client.get("/api/business-profile/", **self.headers)
        self.assertEqual(response.status_code, 403)
