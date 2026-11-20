"""Versioned, bearer-only product identity context. No Django login mirror."""

from uuid import UUID

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET

from .authentication import AuthenticationError
from .identity import platform_role, verified_identity
from .supabase_client import SupabaseAPIError, user_client


@require_GET
def session(request):
    try:
        token, user = verified_identity(request)
        platform = platform_role(user)
        client = user_client(token)
        memberships = [] if platform else client.workspace_memberships(UUID(user["id"]))
        suspended = [] if platform else client.rpc("platform_my_workspace_states", {})
        if not isinstance(suspended, list):
            raise SupabaseAPIError("Workspace state response is invalid.")
        onboarding = (
            {"passwordSetupRequired": False}
            if platform
            else client.rpc("membership_onboarding_state", {})
        )
        if not isinstance(onboarding, dict) or not isinstance(
            onboarding.get("passwordSetupRequired"), bool
        ):
            raise SupabaseAPIError("Invalid onboarding state")
    except AuthenticationError as exc:
        return JsonResponse(
            {"error": {"code": exc.code, "message": exc.message}},
            status=503 if exc.code == "AUTH_UNAVAILABLE" else 401,
        )
    except SupabaseAPIError:
        return JsonResponse(
            {
                "error": {
                    "code": "AUTHORIZATION_UNAVAILABLE",
                    "message": "Không thể xác minh phân quyền Workspace.",
                }
            },
            status=503,
        )
    metadata = user.get("user_metadata")
    full_name = metadata.get("full_name", "") if isinstance(metadata, dict) else ""
    if not isinstance(full_name, str):
        full_name = ""
    job_title = metadata.get("job_title", "") if isinstance(metadata, dict) else ""
    if not isinstance(job_title, str):
        job_title = ""
    return JsonResponse(
        {
            "version": 1,
            "user": {
                "id": user["id"],
                "email": user.get("email", ""),
                "full_name": full_name[:120],
                "job_title": job_title[:120],
            },
            "platform_role": platform,
            "memberships": memberships,
            "suspended_workspaces": suspended,
            "onboarding": onboarding,
        }
    )


@csrf_exempt
def retired_password_endpoint(request):
    return JsonResponse(
        {
            "error": {
                "code": "SUPABASE_AUTH_REQUIRED",
                "message": "Webapp dùng Supabase Auth. Endpoint Django session đã ngừng sử dụng.",
            }
        },
        status=410,
    )
