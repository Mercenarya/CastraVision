from unittest.mock import patch

from django.test import SimpleTestCase


class PlatformAPITests(SimpleTestCase):
    def test_anonymous_denied(self):
        self.assertEqual(self.client.get("/api/platform/companies/").status_code, 401)

    @patch("CastraServices.platform_api.verified_identity")
    def test_editable_metadata_cannot_grant_platform_access(self, identity):
        identity.return_value = (
            "transport-fixture",
            {
                "id": "11111111-1111-4111-8111-111111111111",
                "user_metadata": {"platform_role": "system_admin"},
            },
        )
        self.assertEqual(self.client.get("/api/platform/companies/").status_code, 403)

    @patch("CastraServices.platform_api.user_client")
    @patch("CastraServices.platform_api.verified_identity")
    def test_registry_uses_user_jwt(self, identity, client):
        identity.return_value = (
            "transport-fixture",
            {"app_metadata": {"platform_role": "system_admin"}},
        )
        client.return_value.rpc.return_value = {"companies": [], "metrics": {"totalRegistered": 0}}
        response = self.client.get("/api/platform/companies/")
        self.assertEqual(response.status_code, 200)
        client.assert_called_once_with("transport-fixture")
        client.return_value.rpc.assert_called_once_with("platform_directory", {})

    @patch("CastraServices.platform_api.user_client")
    @patch("CastraServices.platform_api.verified_identity")
    def test_no_mass_assignment(self, identity, client):
        identity.return_value = (
            "transport-fixture",
            {"app_metadata": {"platform_role": "system_admin"}},
        )
        response = self.client.post(
            "/api/platform/companies/",
            {"name": "Company", "platform_role": "system_admin"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        client.return_value.rpc.assert_not_called()
