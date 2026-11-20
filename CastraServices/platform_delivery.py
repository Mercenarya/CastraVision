"""OTP delivery for a DB-authorized platform invitation; never changes passwords."""

from urllib.parse import urlencode, urlparse

import httpx
from django.conf import settings

from .supabase_client import SupabaseAPIError, service_client, user_client


def send_manager_invitation(token, invitation_id, origin=None):
    allowed = settings.CORS_ALLOWED_ORIGINS
    chosen = origin if origin in allowed else (allowed[0] if allowed else None)
    if (
        not chosen
        or urlparse(chosen).scheme not in ("http", "https")
        or not settings.SUPABASE_SERVICE_ROLE_KEY
    ):
        raise SupabaseAPIError("Delivery unavailable.", code="AUTH_UNAVAILABLE", status=503)
    claim = user_client(token).rpc(
        "platform_invitation_action", {"p_id": invitation_id, "p_action": "claim"}
    )
    callback = (
        chosen.rstrip("/") + "/auth/complete?" + urlencode({"platformInvitationId": invitation_id})
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
    result = service_client().rpc(
        "platform_record_delivery",
        {"p_id": invitation_id, "p_attempt": claim["attemptId"], "p_succeeded": delivered},
    )
    return {"id": invitation_id, **result}
