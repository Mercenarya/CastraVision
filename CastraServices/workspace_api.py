"""Workspace data uses the caller's Supabase token, never Django's user cookie."""

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods

from .account_api import CHANNELS, SIZES, _json_body
from .permissions import request_auth, require_workspace_member
from .supabase_client import SupabaseAPIError, user_client
from .views import error_response

SIZES_TO_DB = {"Micro": "micro", "Small": "sme", "Medium": "sme", "Large": "enterprise"}
SIZES_FROM_DB = {"micro": "Micro", "sme": "Small", "enterprise": "Large"}
CHANNEL_FROM_DB = {"facebook": "Meta", "google": "Google Ads", "tiktok": "TikTok"}


def _read_profile(context):
    client = user_client(context.access_token)
    params = {"id": f"eq.{context.workspace_id}", "select": "id,name"}
    workspaces = client.request("GET", "workspaces", params=params)
    rows = client.request(
        "GET",
        "business_profiles",
        params={
            "workspace_id": f"eq.{context.workspace_id}",
            "select": "*",
            "limit": "1",
        },
    )
    if not workspaces:
        raise SupabaseAPIError("Workspace is unavailable.")
    if not rows:
        return None
    row = rows[0]
    return {
        "business_name": workspaces[0]["name"],
        "industry": row.get("industry") or "",
        "business_size": SIZES_FROM_DB.get(row.get("company_size"), ""),
        "target_customers": row.get("target_customer") or "",
        "primary_goal": row.get("primary_goal") or "",
        "product_service": row.get("product_service") or "",
        "preferred_channels": row.get("preferred_channels") or [],
        "monthly_budget": float(row.get("monthly_budget") or 0),
        "currency": row.get("currency") or "VND",
    }


@csrf_exempt
@require_http_methods(["GET", "PUT"])
@require_workspace_member
def profile(request):
    context = request_auth(request)
    try:
        if request.method == "PUT":
            if context.role != "admin":
                return error_response(
                    "PERMISSION_DENIED", "Chỉ Marketing Manager được sửa hồ sơ doanh nghiệp.", 403
                )
            data, failure = _json_body(request)
            if failure:
                return failure
            required = {"business_name": 120, "industry": 120, "target_customers": 500}
            optional = {"primary_goal": 300, "product_service": 500}
            if any(
                not isinstance(data.get(k), str) or not 1 <= len(data[k].strip()) <= n
                for k, n in required.items()
            ):
                return error_response(
                    "VALIDATION_ERROR", "Thông tin doanh nghiệp không hợp lệ.", 400
                )
            if any(
                not isinstance(data.get(k, ""), str) or len(data.get(k, "").strip()) > n
                for k, n in optional.items()
            ):
                return error_response("VALIDATION_ERROR", "Thông tin doanh nghiệp quá dài.", 400)
            channels = data.get("preferred_channels", [])
            if data.get("business_size") not in SIZES or data.get("currency", "VND") not in (
                "USD",
                "VND",
            ):
                return error_response(
                    "VALIDATION_ERROR", "Quy mô hoặc đơn vị tiền không hợp lệ.", 400
                )
            if (
                not isinstance(channels, list)
                or len(channels) > 3
                or any(x not in CHANNELS for x in channels)
            ):
                return error_response("VALIDATION_ERROR", "Kênh không hợp lệ.", 400)
            try:
                budget = int(data.get("monthly_budget", 0))
            except (TypeError, ValueError, OverflowError):
                budget = -1
            if not 0 <= budget <= 1_000_000_000:
                return error_response("VALIDATION_ERROR", "Ngân sách không hợp lệ.", 400)
            client = user_client(context.access_token)
            client.request(
                "PATCH",
                "workspaces",
                params={"id": f"eq.{context.workspace_id}"},
                json={"name": data["business_name"].strip()},
                prefer="return=minimal",
            )
            client.request(
                "POST",
                "business_profiles",
                params={"on_conflict": "workspace_id"},
                json={
                    "workspace_id": str(context.workspace_id),
                    "industry": data["industry"].strip(),
                    "company_size": SIZES_TO_DB[data["business_size"]],
                    "target_customer": data["target_customers"].strip(),
                    "product_service": data.get("product_service", "").strip(),
                    "primary_goal": data.get("primary_goal", "").strip(),
                    "preferred_channels": channels,
                    "monthly_budget": budget,
                    "currency": data.get("currency", "VND"),
                },
                prefer="resolution=merge-duplicates,return=minimal",
            )
        return JsonResponse({"profile": _read_profile(context)})
    except SupabaseAPIError:
        return error_response(
            "WORKSPACE_DATA_UNAVAILABLE", "Không thể đọc/lưu hồ sơ Supabase.", 502
        )


@require_GET
@require_workspace_member
def import_history(request):
    context = request_auth(request)
    try:
        rows = user_client(context.access_token).request(
            "GET",
            "campaign_performance",
            params={
                "workspace_id": f"eq.{context.workspace_id}",
                "select": "*",
                "order": "created_at.desc,record_date.desc",
                "limit": "2000",
            },
        )
    except SupabaseAPIError:
        return error_response(
            "WORKSPACE_DATA_UNAVAILABLE", "Không thể đọc dữ liệu chiến dịch Supabase.", 502
        )
    imports = {}
    latest = []
    for row in rows:
        batch = row.get("import_batch_id") or "legacy-campaign-data"
        if batch not in imports:
            imports[batch] = {
                "id": batch,
                "filename": row.get("source_filename") or "Dữ liệu Supabase",
                "row_count": 0,
                "created_at": row.get("created_at"),
            }
        imports[batch]["row_count"] += 1
        if len(latest) < 30:
            latest.append(
                {
                    **row,
                    "channel": CHANNEL_FROM_DB.get(row.get("channel"), "Other"),
                    "period": row.get("record_date"),
                }
            )
    return JsonResponse({"imports": list(imports.values()), "latest_rows": latest})
