"""Supabase JWT verification for product-facing Django APIs."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from uuid import UUID

import httpx
import jwt
from django.conf import settings
from django.http import HttpRequest

from .supabase_client import (
    MembershipNotFound,
    SupabaseAPIError,
    user_client,
)


class AuthenticationError(RuntimeError):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


class WorkspaceAuthorizationError(RuntimeError):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass(frozen=True)
class RequestAuthContext:
    user_id: UUID
    workspace_id: UUID
    role: str
    access_token: str


@lru_cache(maxsize=4)
def _jwk_client(jwks_url: str) -> jwt.PyJWKClient:
    return jwt.PyJWKClient(
        jwks_url,
        cache_keys=True,
        lifespan=settings.SUPABASE_JWKS_CACHE_SECONDS,
        timeout=settings.SUPABASE_HTTP_TIMEOUT_SECONDS,
    )


def _bearer_token(request: HttpRequest) -> str:
    authorization = request.headers.get("Authorization", "")
    scheme, separator, token = authorization.partition(" ")
    if not separator or scheme.casefold() != "bearer" or not token.strip():
        raise AuthenticationError(
            "AUTH_REQUIRED", "A Supabase Bearer token is required."
        )
    if " " in token.strip():
        raise AuthenticationError("INVALID_TOKEN", "The Bearer token is malformed.")
    return token.strip()


def _verified_hs256_subject(token: str) -> UUID:
    """Verify legacy symmetric Supabase tokens without distributing the JWT secret."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_PUBLISHABLE_KEY:
        raise AuthenticationError(
            "AUTH_UNAVAILABLE", "Authentication could not be completed."
        )
    try:
        response = httpx.get(
            f"{settings.SUPABASE_URL}/auth/v1/user",
            headers={
                "apikey": settings.SUPABASE_PUBLISHABLE_KEY,
                "Authorization": f"Bearer {token}",
            },
            timeout=settings.SUPABASE_HTTP_TIMEOUT_SECONDS,
        )
    except httpx.RequestError as exc:
        raise AuthenticationError(
            "AUTH_UNAVAILABLE", "Authentication could not be completed."
        ) from exc
    if response.status_code in {401, 403}:
        raise AuthenticationError("INVALID_TOKEN", "The access token is invalid.")
    if response.status_code != 200:
        raise AuthenticationError(
            "AUTH_UNAVAILABLE", "Authentication could not be completed."
        )
    try:
        return UUID(str(response.json()["id"]))
    except (KeyError, TypeError, ValueError) as exc:
        raise AuthenticationError(
            "INVALID_TOKEN", "The access token is invalid."
        ) from exc


def _verified_subject(token: str) -> UUID:
    try:
        header = jwt.get_unverified_header(token)
        algorithm = str(header.get("alg", ""))
        if algorithm not in settings.SUPABASE_JWT_ALGORITHMS:
            raise AuthenticationError(
                "INVALID_TOKEN", "The token algorithm is not allowed."
            )
        if algorithm == "HS256":
            return _verified_hs256_subject(token)
        signing_key = _jwk_client(settings.SUPABASE_JWKS_URL).get_signing_key_from_jwt(
            token
        )
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=settings.SUPABASE_JWT_ALGORITHMS,
            audience=settings.SUPABASE_JWT_AUDIENCE,
            issuer=settings.SUPABASE_JWT_ISSUER,
            options={"require": ["exp", "iat", "sub", "aud", "iss"]},
        )
        return UUID(str(claims["sub"]))
    except AuthenticationError:
        raise
    except (jwt.PyJWTError, KeyError, TypeError, ValueError) as exc:
        raise AuthenticationError(
            "INVALID_TOKEN", "The access token is invalid."
        ) from exc


def authenticate_request(request: HttpRequest) -> RequestAuthContext:
    token = _bearer_token(request)
    user_id = _verified_subject(token)
    try:
        workspace_id = UUID(request.headers.get("X-Workspace-ID", ""))
    except (TypeError, ValueError) as exc:
        raise WorkspaceAuthorizationError(
            "WORKSPACE_REQUIRED", "Select an active workspace before continuing."
        ) from exc
    try:
        membership = user_client(token).workspace_membership(user_id, workspace_id)
    except MembershipNotFound as exc:
        raise WorkspaceAuthorizationError(
            "WORKSPACE_REQUIRED", "Complete workspace onboarding before continuing."
        ) from exc
    except SupabaseAPIError as exc:
        raise AuthenticationError(
            "AUTH_UNAVAILABLE", "Authentication could not be completed."
        ) from exc
    return RequestAuthContext(
        user_id=user_id,
        workspace_id=membership.workspace_id,
        role=membership.role,
        access_token=token,
    )
