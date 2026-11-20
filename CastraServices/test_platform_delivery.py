from unittest.mock import Mock, patch

import httpx
from django.test import SimpleTestCase, override_settings

from .platform_delivery import send_manager_invitation
from .supabase_client import SupabaseAPIError


@override_settings(
    CORS_ALLOWED_ORIGINS=["http://127.0.0.1:61300"],
    SUPABASE_URL="http://127.0.0.1:61321",
    SUPABASE_PUBLISHABLE_KEY="local-transport-placeholder",
    SUPABASE_SERVICE_ROLE_KEY="local-transport-placeholder",
)
class PlatformDeliveryTests(SimpleTestCase):
    @patch("CastraServices.platform_delivery.service_client")
    @patch("CastraServices.platform_delivery.httpx.post")
    @patch("CastraServices.platform_delivery.user_client")
    def test_provider_failure_records_failure_without_raw_response(self, user, post, service):
        user.return_value.rpc.return_value = {
            "recipientEmail": "recipient@example.test",
            "attemptId": "attempt-fixture",
        }
        post.return_value = Mock(is_success=False)
        service.return_value.rpc.return_value = {"deliveryStatus": "failed"}
        result = send_manager_invitation(
            "user-fixture", "invitation-fixture", "https://untrusted.test"
        )
        self.assertEqual(result["deliveryStatus"], "failed")
        self.assertTrue(
            post.call_args.kwargs["params"]["redirect_to"].startswith("http://127.0.0.1:61300/")
        )
        service.return_value.rpc.assert_called_once_with(
            "platform_record_delivery",
            {
                "p_id": "invitation-fixture",
                "p_attempt": "attempt-fixture",
                "p_succeeded": False,
            },
        )

    @patch("CastraServices.platform_delivery.service_client")
    @patch("CastraServices.platform_delivery.httpx.post")
    @patch("CastraServices.platform_delivery.user_client")
    def test_timeout_is_not_success(self, user, post, service):
        user.return_value.rpc.return_value = {
            "recipientEmail": "recipient@example.test",
            "attemptId": "attempt-fixture",
        }
        post.side_effect = httpx.ConnectTimeout("transport unavailable")
        service.return_value.rpc.return_value = {"deliveryStatus": "failed"}
        self.assertEqual(
            send_manager_invitation("user-fixture", "invitation-fixture")["deliveryStatus"],
            "failed",
        )

    @patch("CastraServices.platform_delivery.httpx.post")
    @patch("CastraServices.platform_delivery.user_client")
    def test_denied_claim_never_calls_provider(self, user, post):
        user.return_value.rpc.side_effect = SupabaseAPIError("Denied", code="FORBIDDEN", status=403)
        with self.assertRaises(SupabaseAPIError):
            send_manager_invitation("user-fixture", "invitation-fixture")
        post.assert_not_called()
