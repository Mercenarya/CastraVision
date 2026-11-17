from unittest.mock import patch
from uuid import UUID

from django.test import SimpleTestCase, override_settings

from .authentication import RequestAuthContext
from .test_membership_api import REQUEST, USER, WS


@override_settings(SUPABASE_URL="http://127.0.0.1:57321", SUPABASE_PUBLISHABLE_KEY="fixture-public")
class MembershipDeliveryTests(SimpleTestCase):
    def test_mail_failure_keeps_saved_invitation_but_not_fake_sent(self):
        context = RequestAuthContext(UUID(USER), UUID(WS), "admin", "fixture-token")
        invitation = {"id": REQUEST, "deliveryStatus": "failed"}
        with (
            patch("CastraServices.membership_api.authenticate_request", return_value=context),
            patch("CastraServices.supabase_client.SupabaseDataClient.rpc", return_value=invitation),
            patch("CastraServices.membership_api.send_invitation_email", return_value=invitation),
        ):
            response = self.client.post(
                "/api/workspace/invitations/",
                {"email": "candidate@example.test", "role": "member", "teamId": None},
                content_type="application/json",
            )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["deliveryStatus"], "failed")

    def test_no_frontend_can_choose_delivery_status(self):
        context = RequestAuthContext(UUID(USER), UUID(WS), "admin", "fixture-token")
        with (
            patch("CastraServices.membership_api.authenticate_request", return_value=context),
            patch("CastraServices.membership_api.send_invitation_email") as delivery,
        ):
            response = self.client.post(
                "/api/workspace/invitations/",
                {"email": "candidate@example.test", "deliveryStatus": "sent"},
                content_type="application/json",
            )
        self.assertEqual(response.status_code, 400)
        delivery.assert_not_called()
