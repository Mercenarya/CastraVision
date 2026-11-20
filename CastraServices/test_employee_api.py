from unittest.mock import patch
from uuid import UUID

from django.test import SimpleTestCase, override_settings

from .authentication import RequestAuthContext
from .supabase_client import SupabaseAPIError


@override_settings(SUPABASE_URL="http://127.0.0.1:61321", SUPABASE_PUBLISHABLE_KEY="fixture-public")
class EmployeeTaskAPITests(SimpleTestCase):
    def test_anonymous_denied(self):
        self.assertEqual(self.client.post("/api/employee/list/").status_code, 401)

    @patch("CastraServices.permissions.authenticate_request")
    @patch("CastraServices.supabase_client.SupabaseDataClient.rpc")
    def test_verified_token_and_workspace_forwarded(self, rpc, auth):
        auth.return_value = RequestAuthContext(UUID(int=1), UUID(int=2), "member", "fixture-user")
        rpc.return_value = {"items": [], "total": 0}
        response = self.client.post(
            "/api/employee/list/", {"search": "Actual"}, content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        rpc.assert_called_once_with(
            "employee_tasks",
            {
                "p_workspace_id": str(UUID(int=2)),
                "p_command": "list",
                "p_data": {"search": "Actual"},
            },
        )

    @patch("CastraServices.permissions.authenticate_request")
    @patch("CastraServices.supabase_client.SupabaseDataClient.rpc")
    def test_identity_injection_and_bad_json_denied(self, rpc, auth):
        auth.return_value = RequestAuthContext(UUID(int=1), UUID(int=2), "member", "fixture-user")
        self.assertEqual(
            self.client.post(
                "/api/employee/create/", {"role": "admin"}, content_type="application/json"
            ).status_code,
            400,
        )
        self.assertEqual(
            self.client.post(
                "/api/employee/list/", "[", content_type="application/json"
            ).status_code,
            400,
        )
        self.assertEqual(self.client.get("/api/employee/create/").status_code, 405)
        rpc.assert_not_called()

    @patch("CastraServices.permissions.authenticate_request")
    @patch("CastraServices.supabase_client.SupabaseDataClient.rpc")
    def test_db_conflict_keeps_conflict_status(self, rpc, auth):
        auth.return_value = RequestAuthContext(UUID(int=1), UUID(int=2), "member", "fixture-user")
        rpc.side_effect = SupabaseAPIError("Stale task", status=409, code="STALE_VERSION")
        response = self.client.post("/api/employee/update/", {}, content_type="application/json")
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["error"]["code"], "STALE_VERSION")
