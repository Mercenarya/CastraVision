"""Marketing Manager reporting and competitor registry using the caller JWT."""

import base64
import hashlib
import json
from datetime import date
from uuid import UUID

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .manager_reporting import METRICS, render_report
from .permissions import request_auth, require_workspace_admin
from .supabase_client import SupabaseAPIError, user_client
from .views import error_response

SOURCE = "marketing_manager_v1"


def require_tools_ready(client, workspace_id):
    try:
        ready = client.rpc("membership_manager_tools_ready", {"p_workspace_id": workspace_id})
    except SupabaseAPIError as exc:
        raise SupabaseAPIError(
            "Chức năng chưa triển khai đủ schema bảo vệ. "
            "Chỉ kiểm thử trên stack local đã cập nhật.",
            code="SCHEMA_NOT_READY",
            status=503,
        ) from exc
    if not ready:
        raise SupabaseAPIError(
            "Bạn không có quyền quản trị doanh nghiệp.", code="PERMISSION_DENIED", status=403
        )


def body(request, allowed):
    if len(request.body) > 16000:
        raise ValueError("Payload too large")
    data = json.loads(request.body or b"{}")
    if not isinstance(data, dict) or set(data) - set(allowed):
        raise ValueError("Invalid fields")
    return data


def saved_report(client, workspace_id, report_id):
    rows = client.request(
        "GET",
        "reports",
        params={
            "workspace_id": f"eq.{workspace_id}",
            "id": f"eq.{report_id}",
            "select": "id,format,status,params",
            "limit": "1",
        },
    )
    if not rows or rows[0].get("params", {}).get("source") != SOURCE:
        raise SupabaseAPIError("Không tìm thấy báo cáo.", code="NOT_FOUND", status=404)
    return rows[0]


def artifact(row):
    params = row.get("params") or {}
    if row["status"] != "ready" or not params.get("artifact"):
        raise SupabaseAPIError("Báo cáo chưa có file hợp lệ.", code="REPORT_NOT_READY", status=409)
    return {
        "id": row["id"],
        "format": row["format"],
        "contentBase64": params["artifact"],
        "filename": f"castravision-{row['id']}.{row['format']}",
    }


@csrf_exempt
@require_http_methods(["GET", "POST"])
@require_workspace_admin
def reports(request, report_id=None):
    context = request_auth(request)
    workspace_id = str(context.workspace_id)
    client = user_client(context.access_token)
    try:
        require_tools_ready(client, workspace_id)
        if request.method == "GET":
            if report_id:
                return JsonResponse(artifact(saved_report(client, workspace_id, report_id)))
            offset = max(0, int(request.GET.get("offset", 0)))
            rows = client.request(
                "GET",
                "reports",
                params={
                    "workspace_id": f"eq.{workspace_id}",
                    "params->>source": f"eq.{SOURCE}",
                    "select": (
                        "id,format,status,created_at,requested_by,from:params->>from,"
                        "to:params->>to,currency:params->>currency"
                    ),
                    "order": "created_at.desc,id",
                    "limit": "21",
                    "offset": str(offset),
                },
            )
            return JsonResponse({"items": rows[:20], "hasMore": len(rows) > 20})
        if report_id:
            return error_response("METHOD_NOT_ALLOWED", "Chỉ tải báo cáo bằng GET.", 405)
        data = body(request, ("from", "to", "campaignIds", "metrics", "format", "requestId"))
        start, end = date.fromisoformat(data["from"]), date.fromisoformat(data["to"])
        if not 0 <= (end - start).days <= 366 or data["format"] not in ("csv", "pdf"):
            raise ValueError("Invalid range")
        campaign_ids = data["campaignIds"]
        metrics = data["metrics"]
        if (
            not isinstance(campaign_ids, list)
            or not 1 <= len(campaign_ids) <= 30
            or len(set(campaign_ids)) != len(campaign_ids)
        ):
            raise ValueError("Invalid campaigns")
        campaign_ids = [str(UUID(item)) for item in campaign_ids]
        if (
            not isinstance(metrics, list)
            or not metrics
            or any(key not in METRICS for key in metrics)
            or len(set(metrics)) != len(metrics)
        ):
            raise ValueError("Invalid metrics")
        request_id = str(UUID(data["requestId"]))
        normalized = {
            "from": start.isoformat(),
            "to": end.isoformat(),
            "campaignIds": sorted(campaign_ids),
            "metrics": metrics,
            "format": data["format"],
        }
        fingerprint = hashlib.sha256(json.dumps(normalized, sort_keys=True).encode()).hexdigest()
        existing = client.request(
            "GET",
            "reports",
            params={
                "workspace_id": f"eq.{workspace_id}",
                "id": f"eq.{request_id}",
                "select": "id,format,status,params",
                "limit": "1",
            },
        )
        if existing:
            if existing[0].get("params", {}).get("fingerprint") != fingerprint:
                return error_response(
                    "REQUEST_CONFLICT", "Mã yêu cầu đã dùng cho báo cáo khác.", 409
                )
            return JsonResponse(artifact(existing[0]))
        snapshot = {**normalized, "source": SOURCE, "rows": [], "currency": None}
        for campaign_id in campaign_ids:
            common = {"p_workspace_id": workspace_id}
            campaign = client.rpc(
                "leader_workflow",
                {**common, "p_command": "campaign", "p_data": {"id": campaign_id}},
            )
            if snapshot["currency"] and snapshot["currency"] != campaign["currency"]:
                return error_response(
                    "VALIDATION_ERROR", "Chỉ xuất các chiến dịch cùng đơn vị tiền tệ.", 400
                )
            snapshot["currency"] = campaign["currency"]
            analytics = client.rpc(
                "leader_workflow",
                {
                    **common,
                    "p_command": "analytics",
                    "p_data": {"campaignId": campaign_id, "from": str(start), "to": str(end)},
                },
            )
            for channel in analytics["channels"]:
                row = {key: channel.get(key) for key in METRICS}
                row.update(
                    {
                        "campaign": campaign["name"],
                        "channel": channel["channel"],
                        "ctr": channel["clicks"] / channel["impressions"] * 100
                        if channel["impressions"]
                        else None,
                    }
                )
                snapshot["rows"].append(row)
        content = render_report(snapshot, data["format"])
        if len(content) > 524288:
            return error_response(
                "REPORT_TOO_LARGE", "Báo cáo vượt 512 KB. Hãy giảm số chiến dịch.", 400
            )
        # One atomic row contains the artifact, snapshot and ready state; no public file URLs.
        params = {
            **snapshot,
            "artifact": base64.b64encode(content).decode(),
            "fingerprint": fingerprint,
        }
        client.request(
            "POST",
            "reports",
            json={
                "id": request_id,
                "workspace_id": workspace_id,
                "requested_by": str(context.user_id),
                "format": data["format"],
                "params": params,
                "status": "ready",
            },
            prefer="resolution=ignore-duplicates,return=minimal",
        )
        saved = saved_report(client, workspace_id, request_id)
        if saved["params"].get("fingerprint") != fingerprint:
            return error_response("REQUEST_CONFLICT", "Mã yêu cầu đã được dùng.", 409)
        return JsonResponse(artifact(saved))
    except (ValueError, KeyError, TypeError):
        return error_response("VALIDATION_ERROR", "Bộ lọc báo cáo chưa hợp lệ.", 400)
    except SupabaseAPIError as exc:
        return error_response(exc.code, str(exc), exc.status)
    except (OSError, ImportError):
        return error_response(
            "PDF_UNAVAILABLE", "Chưa thể tạo PDF. Kiểm tra font và thư viện máy chủ.", 503
        )


@csrf_exempt
@require_http_methods(["GET", "POST"])
@require_workspace_admin
def competitors(request):
    context = request_auth(request)
    client = user_client(context.access_token)
    try:
        if request.method == "POST":
            require_tools_ready(client, str(context.workspace_id))
        if request.method == "POST":
            data = body(request, ("keyword",))
            keyword = data.get("keyword", "")
            if not isinstance(keyword, str) or not 2 <= len(keyword.strip()) <= 160:
                raise ValueError("Invalid competitor")
            keyword = " ".join(keyword.split())
            existing = client.request(
                "GET",
                "competitor_insights",
                params={
                    "workspace_id": f"eq.{context.workspace_id}",
                    "keyword": f"ilike.{keyword.replace('*', '').replace('%', '')}",
                    "select": "id",
                    "limit": "1",
                },
            )
            if existing:
                return error_response(
                    "COMPETITOR_EXISTS", "Đối thủ đã có trong danh sách theo dõi.", 409
                )
            client.request(
                "POST",
                "competitor_insights",
                json={
                    "workspace_id": str(context.workspace_id),
                    "created_by": str(context.user_id),
                    "keyword": keyword,
                },
                prefer="return=minimal",
            )
        offset = max(0, int(request.GET.get("offset", 0)))
        items = client.request(
            "GET",
            "competitor_insights",
            params={
                "workspace_id": f"eq.{context.workspace_id}",
                "select": "id,keyword,summary,created_at",
                "order": "created_at.desc,id",
                "limit": "21",
                "offset": str(offset),
            },
        )
        return JsonResponse(
            {
                "items": items[:20],
                "hasMore": len(items) > 20,
                "analysisAvailable": False,
                "analysisMessage": (
                    "Chưa cấu hình nguồn phân tích đối thủ. Dữ liệu đã lưu chỉ là danh sách "
                    "theo dõi; không có số liệu quảng cáo suy đoán."
                ),
            }
        )
    except (ValueError, TypeError):
        return error_response("VALIDATION_ERROR", "Tên đối thủ phải từ 2 đến 160 ký tự.", 400)
    except SupabaseAPIError as exc:
        return error_response(exc.code, str(exc), exc.status)
