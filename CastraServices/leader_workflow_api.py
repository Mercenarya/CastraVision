"""JWT-forwarded Leader workflows; PostgreSQL owns Team and transition checks."""

import json
from uuid import UUID

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .permissions import request_auth, require_workspace_member
from .schemas import BusinessProfile
from .strategy import generate_strategy
from .supabase_client import SupabaseAPIError, user_client
from .views import error_response
from .workspace_api import _read_profile

FIELDS = {
    "context": (),
    "profile": (),
    "campaigns": ("search", "status", "limit", "offset"),
    "campaign": ("id",),
    "imports": ("campaignId", "limit", "offset"),
    "create_campaign": ("teamId", "name", "budget", "currency", "channels", "requestId"),
    "proposals": ("search", "status", "kind", "mine", "limit", "offset"),
    "proposal": ("id",),
    "submit": ("campaignId", "kind", "title", "payload", "requestId", "submit"),
    "revise": ("id", "payload", "expectedVersion", "note"),
    "decide": ("id", "decision", "expectedVersion", "note", "requestId"),
    "analytics": ("campaignId", "from", "to"),
    "notifications": ("limit", "offset"),
    "read_notification": ("id",),
    "save_profile": ("fullName", "avatarUrl"),
    "generate": ("campaignId", "objective", "audience", "requestId"),
}
READS = {
    "imports",
    "context",
    "profile",
    "campaigns",
    "campaign",
    "proposals",
    "proposal",
    "analytics",
    "notifications",
}


@csrf_exempt
@require_http_methods(["GET", "POST"])
@require_workspace_member
def workflow(request, command):
    if command not in FIELDS:
        return error_response("NOT_FOUND", "Chức năng không tồn tại.", 404)
    if request.method == "GET" and command not in READS:
        return error_response("METHOD_NOT_ALLOWED", "Thao tác này yêu cầu POST.", 405)
    try:
        if len(request.body) > 1_000_000:
            return error_response("PAYLOAD_TOO_LARGE", "Dữ liệu vượt quá 1 MB.", 413)
        data = request.GET.dict() if request.method == "GET" else json.loads(request.body or b"{}")
        if not isinstance(data, dict) or set(data) - set(FIELDS[command]):
            return error_response("VALIDATION_ERROR", "Trường dữ liệu không hợp lệ.", 400)
        context = request_auth(request)
        client = user_client(context.access_token)

        def rpc(operation, payload):
            return client.rpc(
                "leader_workflow",
                {
                    "p_workspace_id": str(context.workspace_id),
                    "p_command": operation,
                    "p_data": payload,
                },
            )

        if command == "generate":
            campaign = rpc("campaign", {"id": data.get("campaignId")})
            request_id = str(UUID(data.get("requestId", "")))
            generation_input = {key: data.get(key) or "" for key in ("objective", "audience")}
            previous = client.request(
                "GET",
                "approvals",
                params={
                    "workspace_id": f"eq.{context.workspace_id}",
                    "created_by": f"eq.{context.user_id}",
                    "request_id": f"eq.{request_id}",
                    "select": "*",
                    "limit": "1",
                },
            )
            if previous:
                saved = previous[0]
                if (
                    saved.get("target_type") != "strategy"
                    or saved.get("campaign_id") != campaign["id"]
                    or saved.get("payload", {}).get("requestInput") != generation_input
                ):
                    return error_response("REQUEST_CONFLICT", "Mã yêu cầu đã dùng.", 409)
                return JsonResponse(saved)
            business = _read_profile(context)
            if not business:
                return error_response("VALIDATION_ERROR", "Doanh nghiệp chưa có hồ sơ.", 400)
            profile = BusinessProfile.model_validate(
                {
                    "business_name": business["business_name"],
                    "industry": business["industry"],
                    "business_size": business["business_size"],
                    "product_service": business["product_service"] or business["business_name"],
                    "target_audience": data.get("audience") or business["target_customers"],
                    "campaign_goal": data.get("objective") or business["primary_goal"],
                    "budget": campaign["budget"],
                    "currency": campaign["currency"],
                    "preferred_channels": campaign["channels"],
                    "historical_data": [],
                }
            )
            try:
                generation = generate_strategy(profile).model_dump(mode="json")
                generation["requestInput"] = generation_input
            except Exception:
                return error_response(
                    "STRATEGY_GENERATION_FAILED", "Chưa thể tạo chiến lược. Hãy thử lại.", 503
                )
            result = rpc(
                "submit",
                {
                    "campaignId": campaign["id"],
                    "kind": "strategy",
                    "title": data.get("objective") or business["primary_goal"],
                    "payload": generation,
                    "requestId": data.get("requestId"),
                    "submit": False,
                },
            )
        else:
            result = rpc(command, data)
        return JsonResponse(result, safe=isinstance(result, dict))
    except (ValueError, TypeError, UnicodeDecodeError):
        return error_response("VALIDATION_ERROR", "Thông tin chưa hợp lệ.", 400)
    except SupabaseAPIError as exc:
        return error_response(exc.code, str(exc), exc.status)
