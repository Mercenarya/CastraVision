from unittest.mock import patch
from uuid import UUID

from django.test import SimpleTestCase

from .authentication import RequestAuthContext
from .brand_safety import DEFAULT_RULES, check_content, validate_rules


class BrandSafetyEngineTests(SimpleTestCase):
    def test_custom_terms_are_literal_unicode_and_word_bounded(self):
        rules = {
            **DEFAULT_RULES,
            "bannedTerms": ["cấm", "C++"],
            "requiredTerms": ["Điều kiện áp dụng"],
        }
        result = check_content({"headline": "CẤM C++", "body": "Điều kiện áp dụng"}, rules)
        self.assertEqual(result["provider"], "internal_rules")
        self.assertEqual(sum(x["code"] == "BANNED_TERM" for x in result["findings"]), 2)
        result = check_content({"body": "cấmtest Điều kiện áp dụng"}, rules)
        self.assertFalse(result["findings"])

    def test_personal_data_is_flagged_but_not_echoed(self):
        result = check_content(
            {"body": "Contact private.person@example.test +84 912 345 678"}, DEFAULT_RULES
        )
        self.assertTrue(any(x["code"] == "PERSONAL_DATA" for x in result["findings"]))
        self.assertNotIn("private.person", str(result))
        self.assertNotIn("912", str(result))

    def test_claims_and_missing_required_terms_are_review_warnings(self):
        result = check_content(
            {"body": "Guaranteed results"}, {**DEFAULT_RULES, "requiredTerms": ["Terms apply"]}
        )
        self.assertEqual(
            {x["code"] for x in result["findings"]}, {"ABSOLUTE_CLAIM", "MISSING_REQUIRED_TERM"}
        )
        self.assertNotIn("score", result)
        self.assertNotIn("approved", result)

    def test_invalid_config_and_oversized_content_fail_closed(self):
        for rules in (
            {**DEFAULT_RULES, "actorId": "spoof"},
            {**DEFAULT_RULES, "bannedTerms": ["x" * 81]},
            {**DEFAULT_RULES, "warnPersonalData": "false"},
        ):
            with self.assertRaises(ValueError):
                validate_rules(rules)
        with self.assertRaises(ValueError):
            check_content({"body": "x" * 8001}, DEFAULT_RULES)

    def test_disabled_heuristics_and_clean_content_are_not_legal_approval(self):
        result = check_content({"body": "A comfortable everyday shoe"}, DEFAULT_RULES)
        self.assertEqual(result["findings"], [])
        self.assertEqual(result["status"], "no_findings")
        result = check_content(
            {"body": "guaranteed results"}, {**DEFAULT_RULES, "warnAbsoluteClaims": False}
        )
        self.assertEqual(result["findings"], [])


class BrandSafetyAPITests(SimpleTestCase):
    version = "2026-11-20T14:00:00+00:00"

    @patch("CastraServices.employee_api.user_client")
    @patch("CastraServices.permissions.authenticate_request")
    def test_employee_checks_stored_rules_with_forwarded_identity(self, auth, client):
        auth.return_value = RequestAuthContext(UUID(int=1), UUID(int=2), "member", "fixture-jwt")
        client.return_value.request.return_value = [
            {"brand_safety_rules": DEFAULT_RULES, "updated_at": self.version}
        ]
        response = self.client.post(
            "/api/employee/brand-safety/",
            {"fields": {"body": "guaranteed results"}, "expectedVersion": self.version},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["findings"][0]["code"], "ABSOLUTE_CLAIM")
        client.assert_called_once_with("fixture-jwt")
        self.assertEqual(
            client.return_value.request.call_args.kwargs["params"]["workspace_id"],
            "eq." + str(UUID(int=2)),
        )

    @patch("CastraServices.employee_api.user_client")
    @patch("CastraServices.permissions.authenticate_request")
    def test_employee_rules_write_and_actor_injection_denied(self, auth, client):
        auth.return_value = RequestAuthContext(UUID(int=1), UUID(int=2), "member", "fixture-jwt")
        self.assertEqual(
            self.client.patch(
                "/api/employee/brand-safety-rules/", {}, content_type="application/json"
            ).status_code,
            403,
        )
        client.assert_not_called()
        self.assertEqual(
            self.client.post(
                "/api/employee/brand-safety/",
                {"actorId": str(UUID(int=3)), "fields": {}, "expectedVersion": self.version},
                content_type="application/json",
            ).status_code,
            400,
        )
        client.assert_not_called()

    @patch("CastraServices.employee_api.user_client")
    @patch("CastraServices.permissions.authenticate_request")
    def test_stale_check_and_stale_update_conflict(self, auth, client):
        auth.return_value = RequestAuthContext(UUID(int=1), UUID(int=2), "admin", "fixture-jwt")
        profile = {"brand_safety_rules": DEFAULT_RULES, "updated_at": self.version}
        client.return_value.request.return_value = [profile]
        self.assertEqual(
            self.client.post(
                "/api/employee/brand-safety/",
                {"fields": {"body": "text"}, "expectedVersion": "2026-11-19T00:00:00+00:00"},
                content_type="application/json",
            ).status_code,
            409,
        )
        client.return_value.request.side_effect = [[profile], []]
        self.assertEqual(
            self.client.patch(
                "/api/employee/brand-safety-rules/",
                {"rules": DEFAULT_RULES, "expectedVersion": self.version},
                content_type="application/json",
            ).status_code,
            409,
        )
        self.assertEqual(
            client.return_value.request.call_args.kwargs["prefer"], "return=representation"
        )

    def test_anonymous_and_get_mutation_are_denied(self):
        self.assertEqual(self.client.get("/api/employee/brand-safety/").status_code, 405)
        self.assertEqual(self.client.get("/api/employee/brand-safety-rules/").status_code, 401)
