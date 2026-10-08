"""Small Supabase Data API clients with explicit user/service credential boundaries."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from uuid import UUID

import httpx
from django.conf import settings


class SupabaseAPIError(RuntimeError):
    """A sanitized Data API failure safe to expose to application code."""


class MembershipNotFound(SupabaseAPIError):
    pass


class MembershipAmbiguous(SupabaseAPIError):
    pass


@dataclass(frozen=True)
class WorkspaceMembership:
    workspace_id: UUID
    role: str


class SupabaseDataClient:
    def __init__(self, access_token: str, *, api_key: str) -> None:
        if not settings.SUPABASE_URL or not api_key or not access_token:
            raise SupabaseAPIError("Supabase client configuration is incomplete.")
        self._base_url = settings.SUPABASE_URL.rstrip("/")
        self._headers = {
            "apikey": api_key,
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def request(
        self,
        method: str,
        resource: str,
        *,
        params: dict[str, str] | None = None,
        json: Any = None,
        prefer: str | None = None,
    ) -> Any:
        headers = dict(self._headers)
        if prefer:
            headers["Prefer"] = prefer
        try:
            response = httpx.request(
                method,
                f"{self._base_url}/rest/v1/{resource.lstrip('/')}",
                headers=headers,
                params=params,
                json=json,
                timeout=settings.SUPABASE_HTTP_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
            return response.json() if response.content else None
        except (httpx.HTTPError, ValueError) as exc:
            raise SupabaseAPIError("Supabase Data API request failed.") from exc

    def single_workspace_membership(self, user_id: UUID) -> WorkspaceMembership:
        rows = self.request(
            "GET",
            "workspace_members",
            params={
                "select": "workspace_id,role",
                "user_id": f"eq.{user_id}",
                "limit": "2",
            },
        )
        if not isinstance(rows, list) or not rows:
            raise MembershipNotFound("No workspace membership exists for this user.")
        if len(rows) != 1:
            raise MembershipAmbiguous("Sprint 1 requires exactly one workspace membership.")
        row = rows[0]
        try:
            workspace_id = UUID(str(row["workspace_id"]))
            role = str(row["role"])
        except (KeyError, TypeError, ValueError) as exc:
            raise SupabaseAPIError("Workspace membership response is invalid.") from exc
        if role not in {"admin", "manager", "member"}:
            raise SupabaseAPIError("Workspace membership role is invalid.")
        return WorkspaceMembership(workspace_id=workspace_id, role=role)


def user_client(access_token: str) -> SupabaseDataClient:
    return SupabaseDataClient(
        access_token,
        api_key=settings.SUPABASE_PUBLISHABLE_KEY,
    )


def service_client() -> SupabaseDataClient:
    """Return a backend-only client. Never import this helper in browser code."""

    return SupabaseDataClient(
        settings.SUPABASE_SERVICE_ROLE_KEY,
        api_key=settings.SUPABASE_SERVICE_ROLE_KEY,
    )
