import json

from django.db import connection
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST
from pydantic import ValidationError

from .schemas import BusinessProfile
from .strategy import generate_strategy


def error_response(code: str, message: str, status: int, details=None) -> JsonResponse:
    return JsonResponse(
        {"error": {"code": code, "message": message, "details": details or []}},
        status=status,
    )


@require_GET
def health(request):
    return JsonResponse({"status": "ok", "database": connection.vendor})


@csrf_exempt
@require_POST
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
