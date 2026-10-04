import json

from django.contrib.auth import authenticate, get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.urls import reverse

from .models import BusinessAccount, KnowledgeChunk
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


@override_settings(OPENAI_API_KEY="", EMBEDDING_PROVIDER="local")
class StrategyApiTests(TestCase):
    def test_health_endpoint(self):
        response = self.client.get(reverse("castra_services:health"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

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


class SprintOneAccountFlowTests(TestCase):
    def setUp(self):
        self.client.get(reverse("castra_services:csrf"))

    def test_registration_profile_and_login(self):
        register = self.client.post(
            reverse("castra_services:register"),
            data=json.dumps(
                {"email": "owner@example.com", "password": "A-strong-passphrase-2026"}
            ),
            content_type="application/json",
        )
        self.assertEqual(register.status_code, 201)
        duplicate = self.client.post(
            reverse("castra_services:register"),
            data=json.dumps(
                {"email": "OWNER@example.com", "password": "A-strong-passphrase-2026"}
            ),
            content_type="application/json",
        )
        self.assertEqual(duplicate.status_code, 409)
        missing_size = self.client.put(
            reverse("castra_services:business-profile"),
            data=json.dumps(
                {
                    "business_name": "Studio",
                    "industry": "Fashion",
                    "target_customers": "Gen Z",
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(missing_size.status_code, 400)
        saved = self.client.put(
            reverse("castra_services:business-profile"),
            data=json.dumps(
                {
                    "business_name": "Studio",
                    "industry": "Fashion",
                    "business_size": "Small",
                    "target_customers": "Gen Z",
                    "preferred_channels": ["Meta"],
                    "monthly_budget": 1000000,
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(saved.status_code, 200)
        self.assertEqual(
            self.client.get(reverse("castra_services:business-profile")).json()[
                "profile"
            ]["industry"],
            "Fashion",
        )
        self.client.post(reverse("castra_services:logout"))
        self.assertEqual(
            self.client.get(reverse("castra_services:business-profile")).status_code,
            401,
        )
        login = self.client.post(
            reverse("castra_services:login"),
            data=json.dumps(
                {"email": "owner@example.com", "password": "A-strong-passphrase-2026"}
            ),
            content_type="application/json",
        )
        self.assertEqual(login.status_code, 200)

    def test_import_preview_validation_and_commit(self):
        self.client.post(
            reverse("castra_services:register"),
            data=json.dumps(
                {
                    "email": "importer@example.com",
                    "password": "A-strong-passphrase-2026",
                }
            ),
            content_type="application/json",
        )
        data = (
            b"channel,period,spend,clicks,impressions,conversions,revenue\n"
            b"Meta,2026-09,1000,40,2000,3,2500\n"
        )
        endpoint = reverse("castra_services:campaign-import-upload")
        preview = self.client.post(
            endpoint,
            {"file": SimpleUploadedFile("metrics.csv", data, content_type="text/csv")},
        )
        self.assertEqual(preview.status_code, 200)
        self.assertEqual(preview.json()["row_count"], 1)
        committed = self.client.post(
            endpoint,
            {
                "file": SimpleUploadedFile(
                    "metrics.csv", data, content_type="text/csv"
                ),
                "mode": "commit",
            },
        )
        self.assertEqual(committed.status_code, 201)
        history = self.client.get(reverse("castra_services:campaign-imports")).json()
        self.assertEqual(history["imports"][0]["row_count"], 1)
        self.assertEqual(history["latest_rows"][0]["channel"], "Meta")
        bad = b"channel,period,spend,clicks,impressions,conversions\nMeta,2026-09,-10,40,2000,3\n"
        invalid = self.client.post(
            endpoint,
            {"file": SimpleUploadedFile("bad.csv", bad, content_type="text/csv")},
        )
        self.assertEqual(invalid.json()["error_count"], 1)

    def test_sandbox_sync_returns_report_and_persists_import(self):
        self.client.post(
            reverse("castra_services:register"),
            data=json.dumps(
                {
                    "email": "sandbox@example.com",
                    "password": "A-strong-passphrase-2026",
                }
            ),
            content_type="application/json",
        )

        response = self.client.post(
            reverse("castra_services:campaign-import-sandbox")
        )

        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(payload["source"], "sandbox")
        self.assertEqual(payload["success_count"], 9)
        self.assertEqual(payload["failed_count"], 0)
        self.assertEqual(len(payload["preview"]), 5)
        history = self.client.get(
            reverse("castra_services:campaign-imports")
        ).json()
        self.assertEqual(history["imports"][0]["filename"], payload["filename"])
        self.assertEqual(history["imports"][0]["row_count"], 9)


class SeedDemoUsersCommandTests(TestCase):
    def test_command_is_repeatable_and_creates_login_ready_profiles(self):
        password = "Demo-command-password-2026!"

        call_command("seed_demo_users", password=password)
        call_command("seed_demo_users", password=password)

        User = get_user_model()
        self.assertEqual(
            User.objects.filter(username__endswith="@demo.castravision.vn").count(),
            3,
        )
        self.assertEqual(BusinessAccount.objects.count(), 3)
        self.assertIsNotNone(
            authenticate(
                username="owner@demo.castravision.vn",
                password=password,
            )
        )
