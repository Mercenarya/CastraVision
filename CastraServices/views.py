import json

import httpx
import redis
from django.conf import settings
from django.db import connection
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST
from pydantic import ValidationError

from .permissions import require_workspace_member
from .schemas import BusinessProfile
from .strategy import generate_strategy


def error_response(code: str, message: str, status: int, details=None) -> JsonResponse:
    return JsonResponse(
        {"error": {"code": code, "message": message, "details": details or []}},
        status=status,
    )


@require_GET
def health(request):
    """Process liveness only; use readiness for dependency availability."""
    return JsonResponse(
        {
            "status": "ok",
            "check": "liveness",
            "database_backend": connection.vendor,
        }
    )


def _database_ready() -> bool:
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            return cursor.fetchone() == (1,)
    except Exception:
        return False


def _supabase_ready() -> bool:
    api_key = settings.SUPABASE_PUBLISHABLE_KEY or settings.SUPABASE_SERVICE_ROLE_KEY
    if not settings.SUPABASE_URL or not api_key:
        return False
    try:
        response = httpx.get(
            f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/settings",
            headers={"apikey": api_key},
            timeout=min(settings.SUPABASE_HTTP_TIMEOUT_SECONDS, 3),
        )
        return response.status_code == 200
    except httpx.RequestError:
        return False


def _redis_ready() -> bool:
    if not settings.CELERY_BROKER_URL:
        return False
    client = redis.Redis.from_url(
        settings.CELERY_BROKER_URL,
        socket_connect_timeout=1,
        socket_timeout=1,
    )
    try:
        return bool(client.ping())
    except redis.RedisError:
        return False
    finally:
        client.close()


@require_GET
def readiness(request):
    """Dependency readiness without exposing endpoints, credentials, or errors."""
    dependencies = {
        "django_database": _database_ready(),
        "supabase": _supabase_ready(),
        "redis": _redis_ready(),
    }
    ready = all(dependencies.values())
    return JsonResponse(
        {
            "status": "ready" if ready else "degraded",
            "check": "readiness",
            "dependencies": dependencies,
        },
        status=200 if ready else 503,
    )


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
