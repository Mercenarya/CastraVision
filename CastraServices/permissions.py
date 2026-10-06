"""Deny-by-default workspace permission decorators."""

from __future__ import annotations

from collections.abc import Callable
from functools import wraps

from django.http import HttpRequest, HttpResponse, JsonResponse

from .authentication import (
    AuthenticationError,
    RequestAuthContext,
    WorkspaceAuthorizationError,
    authenticate_request,
)

ALL_ROLES = frozenset({"admin", "manager", "member"})
OPERATOR_ROLES = frozenset({"admin", "manager"})
ADMIN_ROLES = frozenset({"admin"})


def _error(code: str, message: str, status: int) -> JsonResponse:
    return JsonResponse(
        {"error": {"code": code, "message": message, "details": []}},
        status=status,
    )


def require_workspace_roles(*allowed_roles: str):
    allowed = frozenset(allowed_roles)
    if not allowed or not allowed.issubset(ALL_ROLES):
        raise ValueError("A non-empty set of valid workspace roles is required.")

    def decorator(
        view: Callable[..., HttpResponse],
    ) -> Callable[..., HttpResponse]:
        @wraps(view)
        def wrapped(request: HttpRequest, *args, **kwargs) -> HttpResponse:
            try:
                context = authenticate_request(request)
            except AuthenticationError as exc:
                return _error(exc.code, exc.message, 401)
            except WorkspaceAuthorizationError as exc:
                return _error(exc.code, exc.message, 403)
            if context.role not in allowed:
                return _error(
                    "PERMISSION_DENIED",
                    "Your workspace role cannot perform this action.",
                    403,
                )
            request.castra_auth = context
            return view(request, *args, **kwargs)

        return wrapped

    return decorator


def request_auth(request: HttpRequest) -> RequestAuthContext:
    context = getattr(request, "castra_auth", None)
    if not isinstance(context, RequestAuthContext):
        raise RuntimeError("The view is missing a workspace permission decorator.")
    return context


require_workspace_member = require_workspace_roles(*ALL_ROLES)
require_workspace_operator = require_workspace_roles(*OPERATOR_ROLES)
require_workspace_admin = require_workspace_roles(*ADMIN_ROLES)
