from unittest.mock import patch
from uuid import UUID

from django.test import SimpleTestCase, override_settings

from .authentication import RequestAuthContext
from .supabase_client import SupabaseAPIError


@override_settings(SUPABASE_URL="http://127.0.0.1:59321", SUPABASE_PUBLISHABLE_KEY="fixture")
class LeaderWorkflowApiTests(SimpleTestCase):
    def setUp(self):
        self.context = RequestAuthContext(UUID(int=1), UUID(int=2), "manager", "fixture-user")

    def test_anonymous_is_denied(self):
        self.assertEqual(self.client.get("/api/leader/context/").status_code, 401)

    @patch("CastraServices.permissions.authenticate_request")
    @patch("CastraServices.supabase_client.SupabaseDataClient.rpc")
    def test_forwards_verified_workspace_and_body_without_actor_override(self, rpc, auth):
        auth.return_value = self.context
        rpc.return_value = {"items": [], "total": 0}
        response = self.client.post(
            "/api/leader/campaigns/", {"search": "Demo"}, content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        rpc.assert_called_once_with(
            "leader_workflow",
            {
                "p_workspace_id": str(UUID(int=2)),
                "p_command": "campaigns",
                "p_data": {"search": "Demo"},
            },
        )

    @patch("CastraServices.permissions.authenticate_request")
    @patch("CastraServices.supabase_client.SupabaseDataClient.rpc")
    def test_client_identity_fields_rejected_before_rpc(self, rpc, auth):
        auth.return_value = self.context
        response = self.client.post(
            "/api/leader/create_campaign/", {"role": "admin"}, content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
        rpc.assert_not_called()

    @patch("CastraServices.permissions.authenticate_request")
    @patch("CastraServices.supabase_client.SupabaseDataClient.rpc")
    def test_mutations_reject_get_and_malformed_json(self, rpc, auth):
        auth.return_value = self.context
        self.assertEqual(self.client.get("/api/leader/decide/").status_code, 405)
        response = self.client.post("/api/leader/decide/", "[", content_type="application/json")
        self.assertEqual(response.status_code, 400)
        rpc.assert_not_called()

    @patch("CastraServices.permissions.authenticate_request")
    @patch("CastraServices.supabase_client.SupabaseDataClient.rpc")
    def test_stale_version_keeps_server_conflict_status(self, rpc, auth):
        auth.return_value = self.context
        rpc.side_effect = SupabaseAPIError("Stale proposal", status=409, code="STALE_VERSION")
        response = self.client.post("/api/leader/decide/", {}, content_type="application/json")
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["error"]["code"], "STALE_VERSION")

    @patch("CastraServices.leader_workflow_api.generate_strategy")
    @patch("CastraServices.supabase_client.SupabaseDataClient.request")
    @patch("CastraServices.supabase_client.SupabaseDataClient.rpc")
    @patch("CastraServices.permissions.authenticate_request")
    def test_generate_retry_returns_saved_strategy_without_second_provider_call(
        self, auth, rpc, request, generate
    ):
        auth.return_value = self.context
        campaign_id, request_id = str(UUID(int=3)), str(UUID(int=4))
        rpc.return_value = {"id": campaign_id}
        saved = {
            "id": str(UUID(int=5)),
            "campaign_id": campaign_id,
            "target_type": "strategy",
            "payload": {"requestInput": {"objective": "Growth", "audience": "Athletes"}},
        }
        request.return_value = [saved]
        response = self.client.post(
            "/api/leader/generate/",
            {
                "campaignId": campaign_id,
                "requestId": request_id,
                "objective": "Growth",
                "audience": "Athletes",
            },
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), saved)
        generate.assert_not_called()

    @patch("CastraServices.permissions.authenticate_request")
    @patch("CastraServices.supabase_client.SupabaseDataClient.rpc")
    def test_import_requires_campaign_and_invalid_xlsx_never_writes(self, rpc, auth):
        from io import BytesIO

        from django.core.files.uploadedfile import SimpleUploadedFile
        from openpyxl import Workbook

        auth.return_value = self.context
        workbook = Workbook()
        sheet = workbook.active
        sheet.append(["channel", "period", "spend", "clicks", "impressions", "conversions"])
        sheet.append(["Meta", "2026-11-18", -1, 1, 10, 1])
        stream = BytesIO()
        workbook.save(stream)
        workbook.close()
        response = self.client.post(
            "/api/campaign-imports/upload/",
            {
                "file": SimpleUploadedFile("negative.xlsx", stream.getvalue()),
                "mode": "commit",
                "campaign_id": str(UUID(int=3)),
            },
        )
        self.assertEqual(response.status_code, 400)
        response = self.client.post(
            "/api/campaign-imports/upload/",
            {
                "file": SimpleUploadedFile(
                    "valid.csv",
                    b"channel,period,spend,clicks,impressions,conversions\nMeta,2026-11-18,1,1,10,1\n",
                ),
                "mode": "commit",
            },
        )
        self.assertEqual(response.status_code, 400)
        rpc.assert_not_called()
