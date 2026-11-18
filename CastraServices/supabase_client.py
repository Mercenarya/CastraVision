"""Small Supabase Data API clients with explicit user/service credential boundaries."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from uuid import UUID

import httpx
from django.conf import settings


class SupabaseAPIError(RuntimeError):
    """A sanitized Data API failure safe to expose to application code."""

    def __init__(self, message, *, code="SUPABASE_UNAVAILABLE", status=502):
        super().__init__(message)
        self.code = code
        self.status = status


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
            if response.is_error:
                safe_codes = {
                    "AUTH_REQUIRED": 401,
                    "PERMISSION_DENIED": 403,
                    "PASSWORD_SETUP_REQUIRED": 403,
                    "VALIDATION_ERROR": 400,
                    "REQUEST_CLOSED": 409,
                    "ALREADY_MEMBER": 409,
                    "INVITATION_CONFLICT": 409,
                    "INVITATION_EXPIRED": 410,
                    "INVITATION_REVOKED": 410,
                    "RATE_LIMITED": 429,
                    "NOT_FOUND": 404,
                    "REQUEST_CONFLICT": 409,
                    "STALE_VERSION": 409,
                    "INVALID_TRANSITION": 409,
                    "SELF_APPROVAL_FORBIDDEN": 403,
                    "BUDGET_ESCALATION_REQUIRED": 403,
                    "BUDGET_ENVELOPE_MISMATCH": 400,
                    "REASON_REQUIRED": 400,
                    "STALE_BASELINE": 409,
                }
                try:
                    safe_code = response.json().get("message")
                except (ValueError, AttributeError):
                    safe_code = None
                if safe_code in safe_codes:
                    raise SupabaseAPIError(
                        "Membership request rejected.", code=safe_code, status=safe_codes[safe_code]
                    )
            response.raise_for_status()
            return response.json() if response.content else None
        except (httpx.HTTPError, ValueError) as exc:
            raise SupabaseAPIError("Supabase Data API request failed.") from exc

    def rpc(self, name, params=None):
        if name != "leader_workflow" and (
            not name.startswith("membership_") or not name.replace("_", "").isalnum()
        ):
            raise SupabaseAPIError("Unsupported product RPC.")
        return self.request("POST", "rpc/" + name, json=params or {})

    def single_workspace_membership(self, user_id: UUID) -> WorkspaceMembership:
        rows = self.workspace_memberships(user_id)
        if not rows:
            raise MembershipNotFound("No workspace membership exists for this user.")
        if len(rows) != 1:
            raise MembershipAmbiguous("Select an active workspace.")
        return WorkspaceMembership(UUID(rows[0]["workspace_id"]), rows[0]["role"])

    def workspace_memberships(self, user_id: UUID) -> list[dict]:
        rows = self.request(
            "GET",
            "workspace_members",
            params={
                "select": "workspace_id,role,workspaces(id,name)",
                "user_id": f"eq.{user_id}",
            },
        )
        if not isinstance(rows, list):
            raise SupabaseAPIError("Workspace membership response is invalid.")
        result = []
        for row in rows:
            try:
                workspace_id = UUID(str(row["workspace_id"]))
                role = str(row["role"])
            except (KeyError, TypeError, ValueError) as exc:
                raise SupabaseAPIError("Workspace membership response is invalid.") from exc
            if role not in {"admin", "manager", "member"}:
                raise SupabaseAPIError("Workspace membership role is invalid.")
            result.append(
                {
                    "workspace_id": str(workspace_id),
                    "role": role,
                    "workspace_name": (row.get("workspaces") or {}).get("name", "Workspace"),
                }
            )
        return result

    def workspace_membership(self, user_id: UUID, workspace_id: UUID) -> WorkspaceMembership:
        rows = self.workspace_memberships(user_id)
        for row in rows:
            if UUID(row["workspace_id"]) == workspace_id:
                return WorkspaceMembership(workspace_id, row["role"])
        raise MembershipNotFound("This identity has no membership in the selected Workspace.")


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
