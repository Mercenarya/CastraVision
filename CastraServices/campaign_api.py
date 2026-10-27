"""Validated campaign imports persisted through Supabase RLS."""

from __future__ import annotations

import csv
import io
import math
from datetime import date, datetime
from itertools import islice
from uuid import uuid4
from zipfile import BadZipFile

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from openpyxl import load_workbook

from .permissions import request_auth, require_workspace_member
from .supabase_client import SupabaseAPIError, user_client
from .views import error_response

MAX_FILE_BYTES = 5_000_000
MAX_ROWS = 2_000
CHANNELS = {
    "meta": ("facebook", "Meta"),
    "facebook": ("facebook", "Meta"),
    "facebook ads": ("facebook", "Meta"),
    "google": ("google", "Google Ads"),
    "google ads": ("google", "Google Ads"),
    "google search": ("google", "Google Ads"),
    "tiktok": ("tiktok", "TikTok"),
    "tiktok ads": ("tiktok", "TikTok"),
}
ALIASES = {
    "channel": {"channel", "platform", "source", "kenh"},
    "period": {"period", "date", "month", "ngay"},
    "spend": {"spend", "cost", "amount_spent", "chi_phi"},
    "clicks": {"clicks", "link_clicks", "luot_nhap"},
    "impressions": {"impressions", "views", "hien_thi"},
    "conversions": {"conversions", "purchases", "leads", "chuyen_doi"},
    "revenue": {"revenue", "conversion_value", "sales", "doanh_thu"},
}
SANDBOX_ROWS = [
    {
        "channel": "Meta",
        "period": "2026-10-01",
        "spend": 1_850_000,
        "clicks": 438,
        "impressions": 28_400,
        "conversions": 31,
        "revenue": 5_420_000,
    },
    {
        "channel": "Meta",
        "period": "2026-10-08",
        "spend": 1_720_000,
        "clicks": 412,
        "impressions": 26_900,
        "conversions": 29,
        "revenue": 5_080_000,
    },
    {
        "channel": "Meta",
        "period": "2026-10-15",
        "spend": 1_960_000,
        "clicks": 471,
        "impressions": 30_600,
        "conversions": 34,
        "revenue": 5_940_000,
    },
    {
        "channel": "Google Ads",
        "period": "2026-10-02",
        "spend": 1_540_000,
        "clicks": 356,
        "impressions": 15_800,
        "conversions": 27,
        "revenue": 5_180_000,
    },
    {
        "channel": "Google Ads",
        "period": "2026-10-09",
        "spend": 1_610_000,
        "clicks": 372,
        "impressions": 16_400,
        "conversions": 28,
        "revenue": 5_390_000,
    },
    {
        "channel": "Google Ads",
        "period": "2026-10-16",
        "spend": 1_680_000,
        "clicks": 391,
        "impressions": 17_100,
        "conversions": 30,
        "revenue": 5_760_000,
    },
    {
        "channel": "TikTok",
        "period": "2026-10-03",
        "spend": 1_320_000,
        "clicks": 681,
        "impressions": 64_500,
        "conversions": 18,
        "revenue": 2_750_000,
    },
    {
        "channel": "TikTok",
        "period": "2026-10-10",
        "spend": 1_410_000,
        "clicks": 724,
        "impressions": 68_900,
        "conversions": 20,
        "revenue": 3_080_000,
    },
    {
        "channel": "TikTok",
        "period": "2026-10-17",
        "spend": 1_460_000,
        "clicks": 746,
        "impressions": 71_200,
        "conversions": 21,
        "revenue": 3_220_000,
    },
]


def _read_rows(upload):
    filename = upload.name.lower()
    if filename.endswith(".csv"):
        content = upload.read().decode("utf-8-sig")
        return list(islice(csv.DictReader(io.StringIO(content)), MAX_ROWS + 1))
    if filename.endswith(".xlsx"):
        workbook = load_workbook(upload, read_only=True, data_only=True)
        try:
            iterator = workbook.active.values
            headers = [str(cell or "").strip() for cell in next(iterator)]
            return [
                dict(zip(headers, row, strict=False))
                for row in islice(iterator, MAX_ROWS + 1)
                if any(cell is not None for cell in row)
            ]
        finally:
            workbook.close()
    raise ValueError("Chỉ hỗ trợ tệp CSV hoặc XLSX.")


def _number(value, field: str) -> float:
    try:
        result = float(str(value or 0).replace(",", "").strip())
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{field} không phải là số") from exc
    if not math.isfinite(result):
        raise ValueError(f"{field} must be a finite number")
    if result < 0:
        raise ValueError(f"{field} không được âm")
    return result


def _integer(value, field: str) -> int:
    result = _number(value, field)
    if not result.is_integer():
        raise ValueError(f"{field} must be a whole number")
    return int(result)


def _record_date(value) -> str:
    if isinstance(value, datetime):
        return value.date().isoformat()
    if isinstance(value, date):
        return value.isoformat()
    text = str(value or "").strip()
    if len(text) == 7:
        text += "-01"
    try:
        return date.fromisoformat(text).isoformat()
    except ValueError as exc:
        raise ValueError("period phải có định dạng YYYY-MM hoặc YYYY-MM-DD") from exc


def _normalise_rows(rows):
    if not rows:
        raise ValueError("Tệp không có dữ liệu.")
    if len(rows) > MAX_ROWS:
        raise ValueError(f"Mỗi lần chỉ được nhập tối đa {MAX_ROWS:,} dòng.")

    headers = {str(key).strip().lower().replace(" ", "_"): key for key in rows[0]}
    mapping = {
        field: next((headers[alias] for alias in aliases if alias in headers), None)
        for field, aliases in ALIASES.items()
    }
    required = ("channel", "period", "spend", "clicks", "impressions", "conversions")
    missing = [field for field in required if mapping[field] is None]
    if missing:
        raise ValueError("Thiếu cột bắt buộc: " + ", ".join(missing))

    normalized, errors = [], []
    for index, row in enumerate(rows, start=2):
        try:
            raw_channel = str(row.get(mapping["channel"], "")).strip().casefold()
            if raw_channel not in CHANNELS:
                raise ValueError("channel chỉ nhận Meta, Google Ads hoặc TikTok")
            db_channel, display_channel = CHANNELS[raw_channel]
            impressions = _integer(row.get(mapping["impressions"]), "impressions")
            clicks = _integer(row.get(mapping["clicks"]), "clicks")
            conversions = _integer(row.get(mapping["conversions"]), "conversions")
            spend = _number(row.get(mapping["spend"]), "spend")
            revenue_key = mapping["revenue"]
            revenue = _number(row.get(revenue_key), "revenue") if revenue_key else 0
            if clicks > impressions:
                raise ValueError("clicks không được lớn hơn impressions")
            normalized.append(
                {
                    "channel": display_channel,
                    "db_channel": db_channel,
                    "period": _record_date(row.get(mapping["period"])),
                    "spend": spend,
                    "clicks": clicks,
                    "impressions": impressions,
                    "conversions": conversions,
                    "revenue": revenue,
                }
            )
        except (TypeError, ValueError) as exc:
            errors.append({"row": index, "message": str(exc)})
    return normalized, errors


def _database_rows(rows, *, workspace_id, user_id, batch_id, filename, source):
    result = []
    for row_number, row in enumerate(rows, start=2):
        impressions = row["impressions"]
        conversions = row["conversions"]
        spend = row["spend"]
        result.append(
            {
                "workspace_id": str(workspace_id),
                "channel": row["db_channel"],
                "campaign_name": filename[:255],
                "ctr": round(row["clicks"] / impressions * 100, 4) if impressions else 0,
                "cpa": round(spend / conversions, 4) if conversions else 0,
                "roas": round(row["revenue"] / spend, 4) if spend else 0,
                "impressions": impressions,
                "spend": spend,
                "record_date": row["period"],
                "source": source,
                "clicks": row["clicks"],
                "conversions": conversions,
                "revenue": row["revenue"],
                "import_batch_id": str(batch_id),
                "source_filename": filename[:255],
                "source_row": row_number,
                "created_by": str(user_id),
            }
        )
    return result


def _public_rows(rows):
    return [{key: value for key, value in row.items() if key != "db_channel"} for row in rows]


def _persist(request, rows, *, filename: str, source: str):
    context = request_auth(request)
    batch_id = uuid4()
    payload = _database_rows(
        rows,
        workspace_id=context.workspace_id,
        user_id=context.user_id,
        batch_id=batch_id,
        filename=filename,
        source=source,
    )
    try:
        user_client(context.access_token).request(
            "POST",
            "campaign_performance",
            json=payload,
            prefer="return=minimal",
        )
    except SupabaseAPIError:
        return None, error_response(
            "IMPORT_PERSIST_FAILED",
            "Dữ liệu hợp lệ nhưng không thể lưu vào Supabase.",
            502,
        )
    return str(batch_id), None


@csrf_exempt
@require_POST
@require_workspace_member
def import_file(request):
    upload = request.FILES.get("file")
    if not upload:
        return error_response("MISSING_FILE", "Vui lòng chọn tệp CSV hoặc XLSX.", 400)
    if upload.size > MAX_FILE_BYTES:
        return error_response("FILE_TOO_LARGE", "Tệp không được vượt quá 5 MB.", 413)
    try:
        rows, errors = _normalise_rows(_read_rows(upload))
    except (ValueError, UnicodeDecodeError, StopIteration, OSError, BadZipFile) as exc:
        return error_response("INVALID_FILE", str(exc), 400)

    result = {
        "filename": upload.name[:255],
        "row_count": len(rows),
        "success_count": len(rows),
        "failed_count": len(errors),
        "error_count": len(errors),
        "errors": errors[:20],
        "preview": _public_rows(rows[:5]),
    }
    if request.POST.get("mode") != "commit":
        return JsonResponse(result)
    if errors or not rows:
        return error_response(
            "VALIDATION_ERROR", "Hãy sửa các dòng lỗi trước khi nhập.", 400, errors[:20]
        )
    batch_id, failure = _persist(request, rows, filename=upload.name, source="csv_import")
    if failure:
        return failure
    result.update({"source": "file_upload", "import_id": batch_id})
    return JsonResponse(result, status=201)


@csrf_exempt
@require_POST
@require_workspace_member
def sandbox_import(request):
    rows, errors = _normalise_rows(SANDBOX_ROWS)
    batch_id, failure = _persist(
        request,
        rows,
        filename="sandbox_campaigns_2026-10.json",
        source="sandbox_api",
    )
    if failure:
        return failure
    return JsonResponse(
        {
            "source": "sandbox",
            "import_id": batch_id,
            "filename": "sandbox_campaigns_2026-10.json",
            "row_count": len(rows),
            "success_count": len(rows),
            "failed_count": len(errors),
            "errors": errors,
            "preview": _public_rows(rows[:5]),
        },
        status=201,
    )
