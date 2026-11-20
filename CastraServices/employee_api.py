"""Assigned tasks: forward verified user JWT; PostgreSQL owns scope and lifecycle."""

import json
from datetime import datetime

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods, require_POST

from .brand_safety import ENGINE_VERSION, check_content, validate_rules
from .permissions import request_auth, require_workspace_member
from .supabase_client import SupabaseAPIError, user_client
from .views import error_response

FIELDS = {
    "list": {"search", "status", "campaignId", "limit", "offset"},
    "summary": set(),
    "task": {"id"},
    "candidates": {"campaignId"},
    "create": {"campaignId", "assigneeId", "title", "description", "dueAt", "requestId"},
    "update": {"id", "status", "expectedVersion", "proposalId"},
}


def _body(request, keys):
    if len(request.body) > 32768:
        raise ValueError("PAYLOAD_TOO_LARGE")
    data = json.loads(request.body or b"{}")
    if not isinstance(data, dict) or set(data) != keys:
        raise ValueError("VALIDATION_ERROR")
    return data


def _brand_profile(context):
    client = user_client(context.access_token)
    rows = client.request(
        "GET",
        "business_profiles",
        params={
            "workspace_id": f"eq.{context.workspace_id}",
            "select": "brand_safety_rules,updated_at",
            "limit": "2",
        },
    )
    if not isinstance(rows, list) or len(rows) != 1:
        raise SupabaseAPIError(
            "Business profile is unavailable.", code="BUSINESS_PROFILE_REQUIRED", status=404
        )
    validate_rules(rows[0]["brand_safety_rules"])
    return client, rows[0]


def _version(value):
    if not isinstance(value, str) or len(value) > 80:
        raise ValueError("VALIDATION_ERROR")
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is None:
        raise ValueError("VALIDATION_ERROR")


@csrf_exempt
@require_http_methods(["GET", "PATCH"])
@require_workspace_member
def brand_rules(request):
    context = request_auth(request)
    if request.method == "PATCH" and context.role != "admin":
        return error_response("PERMISSION_DENIED", "Only Marketing Managers can change rules.", 403)
    try:
        client, profile = _brand_profile(context)
        if request.method == "PATCH":
            data = _body(request, {"rules", "expectedVersion"})
            validate_rules(data["rules"])
            _version(data["expectedVersion"])
            saved = client.request(
                "PATCH",
                "business_profiles",
                params={
                    "workspace_id": f"eq.{context.workspace_id}",
                    "updated_at": "eq." + data["expectedVersion"],
                    "select": "brand_safety_rules,updated_at",
                },
                json={"brand_safety_rules": data["rules"]},
                prefer="return=representation",
            )
            if not isinstance(saved, list) or len(saved) != 1:
                return error_response("STALE_VERSION", "Rules changed; reload before saving.", 409)
            profile = saved[0]
        return JsonResponse(
            {
                "rules": profile["brand_safety_rules"],
                "version": profile["updated_at"],
                "provider": "internal_rules",
                "engineVersion": ENGINE_VERSION,
                "canEdit": context.role == "admin",
            }
        )
    except (ValueError, TypeError, KeyError, UnicodeDecodeError):
        return error_response("VALIDATION_ERROR", "Invalid rule configuration.", 400)
    except SupabaseAPIError as exc:
        return error_response(exc.code, str(exc), exc.status)


@csrf_exempt
@require_POST
@require_workspace_member
def brand_check(request):
    try:
        data = _body(request, {"fields", "expectedVersion"})
        _version(data["expectedVersion"])
        _, profile = _brand_profile(request_auth(request))
        if data["expectedVersion"] != profile["updated_at"]:
            return error_response("STALE_VERSION", "Rules changed; reload before checking.", 409)
        result = check_content(data["fields"], profile["brand_safety_rules"])
        result["rulesVersion"] = profile["updated_at"]
        return JsonResponse(result)
    except (ValueError, TypeError, KeyError, UnicodeDecodeError):
        return error_response("VALIDATION_ERROR", "Invalid content or rule configuration.", 400)
    except SupabaseAPIError as exc:
        return error_response(exc.code, str(exc), exc.status)


@csrf_exempt
@require_POST
@require_workspace_member
def tasks(request, command):
    if command not in FIELDS:
        return error_response("NOT_FOUND", "Chức năng không tồn tại.", 404)
    if len(request.body) > 32768:
        return error_response("PAYLOAD_TOO_LARGE", "Dữ liệu nhiệm vụ quá lớn.", 413)
    try:
        data = json.loads(request.body or b"{}")
        if not isinstance(data, dict) or set(data) - FIELDS[command]:
            return error_response("VALIDATION_ERROR", "Trường dữ liệu không hợp lệ.", 400)
        context = request_auth(request)
        result = user_client(context.access_token).rpc(
            "employee_tasks",
            {
                "p_workspace_id": str(context.workspace_id),
                "p_command": command,
                "p_data": data,
            },
        )
        return JsonResponse(result)
    except (ValueError, TypeError, UnicodeDecodeError):
        return error_response("VALIDATION_ERROR", "Thông tin nhiệm vụ chưa hợp lệ.", 400)
    except SupabaseAPIError as exc:
        return error_response(exc.code, str(exc), exc.status)
