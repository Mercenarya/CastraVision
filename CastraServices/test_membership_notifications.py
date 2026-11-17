from unittest.mock import patch

from django.test import SimpleTestCase, override_settings

from .test_membership_api import REQUEST, USER


@override_settings(SUPABASE_URL="http://127.0.0.1:58321", SUPABASE_PUBLISHABLE_KEY="fixture-public")
class MembershipNotificationTests(SimpleTestCase):
    def test_notification_recipient_is_always_auth_identity(self):
        with (
            patch(
                "CastraServices.membership_api.verified_identity",
                return_value=("fixture-token", {"id": USER}),
            ),
            patch(
                "CastraServices.supabase_client.SupabaseDataClient.rpc", return_value={"ok": True}
            ) as rpc,
        ):
            response = self.client.post(
                f"/api/membership-notifications/{REQUEST}/read/",
                {},
                content_type="application/json",
            )
        self.assertEqual(response.status_code, 200)
        rpc.assert_called_once_with("membership_read_notification", {"p_notification_id": REQUEST})

    def test_unread_false_is_not_coerced_to_true(self):
        with (
            patch(
                "CastraServices.membership_api.verified_identity",
                return_value=("fixture-token", {"id": USER}),
            ),
            patch(
                "CastraServices.supabase_client.SupabaseDataClient.rpc",
                return_value={"items": [], "unreadCount": 0},
            ) as rpc,
        ):
            response = self.client.get("/api/membership-notifications/", {"unreadOnly": "false"})
        self.assertEqual(response.status_code, 200)
        rpc.assert_called_once_with(
            "membership_list_notifications", {"p_unread_only": False, "p_limit": 20, "p_offset": 0}
        )
