from unittest.mock import patch
from uuid import UUID

from django.test import SimpleTestCase, override_settings

from .authentication import RequestAuthContext


@override_settings(SUPABASE_URL="http://127.0.0.1:58321", SUPABASE_PUBLISHABLE_KEY="fixture")
class ManagerToolsApiTests(SimpleTestCase):
    def test_anonymous_cannot_read_reports_or_competitors(self):
        for path in ("reports", "competitors"):
            self.assertEqual(self.client.get(f"/api/manager/{path}/").status_code, 401)

    @patch("CastraServices.permissions.authenticate_request")
    @patch("CastraServices.manager_tools_api.user_client")
    def test_leader_employee_denied_before_data_access(self, client, auth):
        for role in ("manager", "member"):
            auth.return_value = RequestAuthContext(UUID(int=1), UUID(int=2), role, "fixture")
            for path in ("reports", "competitors"):
                self.assertEqual(self.client.get(f"/api/manager/{path}/").status_code, 403)
        client.assert_not_called()

    @patch("CastraServices.permissions.authenticate_request")
    @patch("CastraServices.manager_tools_api.user_client")
    def test_report_list_uses_verified_workspace_and_excludes_artifact(self, factory, auth):
        auth.return_value = RequestAuthContext(UUID(int=1), UUID(int=2), "admin", "fixture")
        factory.return_value.request.return_value = []
        response = self.client.get("/api/manager/reports/?workspace_id=evil")
        self.assertEqual(response.status_code, 200)
        params = factory.return_value.request.call_args.kwargs["params"]
        self.assertEqual(params["workspace_id"], f"eq.{UUID(int=2)}")
        self.assertNotIn("artifact", params["select"])

    @patch("CastraServices.permissions.authenticate_request")
    @patch("CastraServices.manager_tools_api.user_client")
    def test_payload_cannot_supply_actor_workspace_or_file(self, factory, auth):
        auth.return_value = RequestAuthContext(UUID(int=1), UUID(int=2), "admin", "fixture")
        for path in ("reports", "competitors"):
            response = self.client.post(
                f"/api/manager/{path}/",
                {"workspace_id": "evil", "artifact": "fake"},
                content_type="application/json",
            )
            self.assertEqual(response.status_code, 400)
        factory.return_value.request.assert_not_called()
