"""Supabase Auth is the sole identity authority for product APIs."""

from uuid import UUID

import httpx
from django.conf import settings

from .authentication import AuthenticationError, _bearer_token


def verified_identity(request):
    token = _bearer_token(request)
    base = settings.SUPABASE_URL.rstrip("/")
    key = settings.SUPABASE_PUBLISHABLE_KEY
    if not base or not key:
        raise AuthenticationError("AUTH_UNAVAILABLE", "Supabase authentication is unavailable.")
    try:
        response = httpx.get(
            f"{base}/auth/v1/user",
            headers={"apikey": key, "Authorization": f"Bearer {token}"},
            timeout=getattr(settings, "SUPABASE_HTTP_TIMEOUT_SECONDS", 10),
        )
    except httpx.RequestError as exc:
        raise AuthenticationError(
            "AUTH_UNAVAILABLE", "Supabase authentication is unavailable."
        ) from exc
    if response.status_code in (401, 403):
        raise AuthenticationError(
            "INVALID_TOKEN", "The Supabase access token is invalid or expired."
        )
    if response.status_code != 200:
        raise AuthenticationError("AUTH_UNAVAILABLE", "Supabase authentication is unavailable.")
    try:
        user = response.json()
        UUID(str(user["id"]))
    except (KeyError, TypeError, ValueError) as exc:
        raise AuthenticationError("INVALID_TOKEN", "The Supabase identity is invalid.") from exc
    if not user.get("email_confirmed_at") and not user.get("confirmed_at"):
        raise AuthenticationError(
            "EMAIL_CONFIRMATION_REQUIRED", "Confirm your email before continuing."
        )
    return token, user


def platform_role(user):
    # This object came from Auth's server, not a request body/local storage/JWT
    # decode without verification. Never read editable user_metadata for authority.
    metadata = user.get("app_metadata") or {}
    if not isinstance(metadata, dict):
        return None
    value = metadata.get("platform_role", metadata.get("role"))
    return "system_admin" if value == "system_admin" else None
