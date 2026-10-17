import json
from unittest.mock import Mock, patch
from uuid import UUID

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase, override_settings
from django.urls import reverse

from .authentication import RequestAuthContext
from .models import KnowledgeChunk
from .rag import ingest_document, search_knowledge

VALID_PROFILE = {
    "business_name": "Castra Coffee",
    "industry": "F&B",
    "business_size": "Small",
    "product_service": "Cà phê rang xay giao tận nơi",
    "target_audience": "Nhân viên văn phòng 22-35 tuổi tại TP.HCM",
    "campaign_goal": "Tăng đơn hàng trực tuyến",
    "budget": 30_000_000,
    "currency": "VND",
    "preferred_channels": ["Meta", "TikTok"],
    "historical_data": [
        {"channel": "Meta", "period": "2026-Q3", "ctr": 1.8, "cpa": 85000, "roas": 2.4}
    ],
}

AUTH_CONTEXT = RequestAuthContext(
    user_id=UUID("11111111-1111-1111-1111-111111111111"),
    workspace_id=UUID("22222222-2222-2222-2222-222222222222"),
    role="admin",
    access_token="signed-token",
)


@override_settings(OPENAI_API_KEY="", EMBEDDING_PROVIDER="local")
class StrategyApiTests(TestCase):
    def setUp(self):
        self.auth_patch = patch(
            "CastraServices.permissions.authenticate_request",
            return_value=AUTH_CONTEXT,
        )
        self.auth_patch.start()
        self.addCleanup(self.auth_patch.stop)

    def test_health_endpoint(self):
        response = self.client.get(reverse("castra_services:health"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")
        self.assertEqual(response.json()["check"], "liveness")

    @patch("CastraServices.views._redis_ready", return_value=True)
    @patch("CastraServices.views._supabase_ready", return_value=True)
    @patch("CastraServices.views._database_ready", return_value=True)
    def test_readiness_endpoint_reports_ready(self, *_checks):
        response = self.client.get(reverse("castra_services:readiness"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ready")
        self.assertTrue(all(response.json()["dependencies"].values()))

    @patch("CastraServices.views._redis_ready", return_value=False)
    @patch("CastraServices.views._supabase_ready", return_value=True)
    @patch("CastraServices.views._database_ready", return_value=True)
    def test_readiness_endpoint_reports_degraded(self, *_checks):
        response = self.client.get(reverse("castra_services:readiness"))
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["status"], "degraded")
        self.assertFalse(response.json()["dependencies"]["redis"])

    def test_rejects_invalid_profile(self):
        response = self.client.post(
            reverse("castra_services:strategy-generate"),
            data=json.dumps({"business_name": "X"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"]["code"], "VALIDATION_ERROR")

    def test_requires_business_size_from_fr01_contract(self):
        profile = {
            key: value for key, value in VALID_PROFILE.items() if key != "business_size"
        }
        response = self.client.post(
            reverse("castra_services:strategy-generate"),
            data=json.dumps(profile),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        detail_locations = [item["loc"] for item in response.json()["error"]["details"]]
        self.assertIn(["business_size"], detail_locations)

    def test_returns_structured_strategy_and_fallback_notice(self):
        response = self.client.post(
            reverse("castra_services:strategy-generate"),
            data=json.dumps(VALID_PROFILE),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["provider"], "deterministic-fallback")
        self.assertEqual(payload["strategy"]["recommended_channel"], "Meta")
        self.assertEqual(
            sum(
                item["percentage"] for item in payload["strategy"]["budget_allocation"]
            ),
            100,
        )
        self.assertTrue(payload["warning"])


@override_settings(OPENAI_API_KEY="", EMBEDDING_PROVIDER="local", RAG_TOP_K=3)
class RagPipelineTests(TestCase):
    def test_ingestion_is_idempotent_and_retrieval_returns_top_k(self):
        first_count = ingest_document(
            source="google_ads",
            external_id="search-intent",
            title="Search intent",
            content="Google Search tiếp cận khách hàng đang tìm kiếm dịch vụ với ý định mua cao.",
        )
        second_count = ingest_document(
            source="google_ads",
            external_id="search-intent",
            title="Search intent",
            content="Google Search tiếp cận khách hàng đang tìm kiếm dịch vụ với ý định mua cao.",
        )
        self.assertEqual(first_count, 1)
        self.assertEqual(second_count, 1)
        self.assertEqual(KnowledgeChunk.objects.count(), 1)

        results = search_knowledge("khách hàng tìm kiếm dịch vụ", top_k=1)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].source, "google_ads")
        self.assertGreater(results[0].score, 0)


class SupabaseCampaignImportTests(TestCase):
    def setUp(self):
        self.auth_patch = patch(
            "CastraServices.permissions.authenticate_request",
            return_value=AUTH_CONTEXT,
        )
        self.auth_patch.start()
        self.addCleanup(self.auth_patch.stop)
        self.supabase = Mock()
        self.client_patch = patch(
            "CastraServices.campaign_api.user_client",
            return_value=self.supabase,
        )
        self.client_patch.start()
        self.addCleanup(self.client_patch.stop)

    @staticmethod
    def upload(name="metrics.csv", content=None):
        data = content or (
            b"channel,period,spend,clicks,impressions,conversions,revenue\n"
            b"Meta,2026-09,1000,40,2000,3,2500\n"
        )
        return SimpleUploadedFile(name, data, content_type="text/csv")

    def test_preview_validates_without_writing(self):
        response = self.client.post(
            reverse("castra_services:campaign-import-upload"),
            {"file": self.upload()},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["row_count"], 1)
        self.supabase.request.assert_not_called()

    def test_commit_writes_workspace_scoped_raw_metrics(self):
        response = self.client.post(
            reverse("castra_services:campaign-import-upload"),
            {"file": self.upload(), "mode": "commit"},
        )
        self.assertEqual(response.status_code, 201)
        payload = self.supabase.request.call_args.kwargs["json"][0]
        self.assertEqual(payload["workspace_id"], str(AUTH_CONTEXT.workspace_id))
        self.assertEqual(payload["created_by"], str(AUTH_CONTEXT.user_id))
        self.assertEqual(payload["clicks"], 40)
        self.assertEqual(payload["conversions"], 3)
        self.assertEqual(payload["revenue"], 2500)

    def test_rejects_invalid_rows_before_writing(self):
        bad = (
            b"channel,period,spend,clicks,impressions,conversions\n"
            b"Meta,2026-09,-10,40,20,3\n"
        )
        response = self.client.post(
            reverse("castra_services:campaign-import-upload"),
            {"file": self.upload("bad.csv", bad), "mode": "commit"},
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"]["code"], "VALIDATION_ERROR")
        self.supabase.request.assert_not_called()


class CsrfBearerBoundaryTests(TestCase):
    def test_bearer_endpoints_are_csrf_exempt_but_still_require_authentication(self):
        client = Client(enforce_csrf_checks=True)
        response = client.post(
            reverse("castra_services:strategy-generate"),
            data="{}",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["error"]["code"], "AUTH_REQUIRED")
