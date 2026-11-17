import json

from django.db import connection
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST
from pydantic import ValidationError

from .permissions import request_auth, require_workspace_member
from .schemas import BusinessProfile
from .strategy import generate_strategy
from .supabase_client import SupabaseAPIError, user_client

# Supabase client integration
try:
    from Utils.supabase_client import get_supabase_client

    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False


def error_response(code: str, message: str, status: int, details=None) -> JsonResponse:
    return JsonResponse(
        {"error": {"code": code, "message": message, "details": details or []}},
        status=status,
    )


@require_GET
def health(request):
    health_status = {"status": "ok", "database": connection.vendor}

    # Check Supabase connection if available
    if SUPABASE_AVAILABLE:
        try:
            supabase_client = get_supabase_client()
            # Simple test query to verify connection
            supabase_client.table("test").select("*").limit(1).execute()
            health_status["supabase"] = "connected"
        except Exception as e:
            health_status["supabase"] = f"error: {str(e)}"
    else:
        health_status["supabase"] = "not configured"

    return JsonResponse(health_status)


@csrf_exempt
@require_POST
@require_workspace_member
def strategy_generate(request):
    if len(request.body) > 1_000_000:
        return error_response("PAYLOAD_TOO_LARGE", "Payload must be under 1 MB.", 413)
    try:
        payload = json.loads(request.body or b"{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return error_response("INVALID_JSON", "Request body must contain valid JSON.", 400)

    try:
        profile = BusinessProfile.model_validate(payload)
    except ValidationError as exc:
        return error_response(
            "VALIDATION_ERROR",
            "Business profile is invalid.",
            400,
            exc.errors(include_url=False),
        )

    try:
        response = generate_strategy(profile)
    except Exception:
        return error_response(
            "STRATEGY_GENERATION_FAILED",
            "Unable to generate a strategy at this time.",
            503,
        )
    return JsonResponse(response.model_dump(mode="json"), status=200)


@csrf_exempt
@require_GET
@require_workspace_member
def supabase_test(request):
    """Probe only the caller's Workspace through the same RLS boundary."""
    context = request_auth(request)
    try:
        user_client(context.access_token).request(
            "GET",
            "business_profiles",
            params={
                "workspace_id": f"eq.{context.workspace_id}",
                "select": "workspace_id",
                "limit": "1",
            },
        )
    except SupabaseAPIError:
        return error_response("WORKSPACE_DATA_UNAVAILABLE", "Supabase unavailable.", 502)
    return JsonResponse({"status": "success", "supabase_connected": True})
