"""Provider side effect separated from atomic invitation and membership changes."""

from urllib.parse import urlencode, urlparse

import httpx
from django.conf import settings

from .supabase_client import SupabaseAPIError, service_client, user_client


def send_invitation_email(*, access_token, workspace_id, invitation, origin=None):
    allowed = settings.CORS_ALLOWED_ORIGINS
    chosen = origin if origin in allowed else (allowed[0] if allowed else None)
    if (
        not chosen
        or urlparse(chosen).scheme not in ("http", "https")
        or not settings.SUPABASE_SERVICE_ROLE_KEY
    ):
        raise SupabaseAPIError(
            "Delivery configuration unavailable.", code="AUTH_UNAVAILABLE", status=503
        )
    user = user_client(access_token)
    claim = user.rpc(
        "membership_claim_delivery",
        {"p_workspace_id": workspace_id, "p_invitation_id": invitation["id"]},
    )
    callback = (
        chosen.rstrip("/") + "/auth/complete?" + urlencode({"invitationId": invitation["id"]})
    )
    delivered = False
    try:
        response = httpx.post(
            settings.SUPABASE_URL.rstrip("/") + "/auth/v1/otp",
            params={"redirect_to": callback},
            headers={"apikey": settings.SUPABASE_PUBLISHABLE_KEY},
            json={"email": claim["recipientEmail"], "create_user": True},
            timeout=20,
        )
        delivered = response.is_success
    except httpx.RequestError:
        pass
    service_client().rpc(
        "membership_record_delivery",
        {
            "p_invitation_id": invitation["id"],
            "p_attempt_id": claim["attemptId"],
            "p_succeeded": delivered,
        },
    )
    return {**invitation, "deliveryStatus": "sent" if delivered else "failed"}
