"""Sprint 1 account, business profile and campaign import endpoints."""

import csv
import io
import json
from itertools import islice
from zipfile import BadZipFile

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_http_methods, require_POST
from openpyxl import load_workbook

from .models import BusinessAccount, CampaignImport
from .views import error_response

CHANNELS = {"Meta", "Google Ads", "TikTok"}
SIZES = {"Micro", "Small", "Medium", "Large"}
ALIASES = {
    "channel": {"channel", "platform", "source", "kenh"},
    "period": {"period", "date", "month", "ngay"},
    "spend": {"spend", "cost", "amount_spent", "chi_phi"},
    "clicks": {"clicks", "link_clicks", "luot_nhap"},
    "impressions": {"impressions", "views", "hien_thi"},
    "conversions": {"conversions", "purchases", "leads", "chuyen_doi"},
    "revenue": {"revenue", "conversion_value", "sales", "doanh_thu"},
}


def _json_body(request):
    try:
        if len(request.body) > 1_000_000:
            return None, error_response(
                "PAYLOAD_TOO_LARGE", "Dữ liệu vượt quá 1 MB.", 413
            )
        value = json.loads(request.body or b"{}")
        if not isinstance(value, dict):
            raise ValueError
        return value, None
    except (ValueError, UnicodeDecodeError):
        return None, error_response("INVALID_JSON", "JSON không hợp lệ.", 400)


def _user_payload(user):
    return {"id": user.pk, "email": user.email}


@ensure_csrf_cookie
@require_GET
def csrf(request):
    return JsonResponse({"ok": True})


@require_GET
def session(request):
    return JsonResponse(
        {"user": _user_payload(request.user) if request.user.is_authenticated else None}
    )


@require_POST
def register(request):
    payload, error = _json_body(request)
    if error:
        return error
    email = str(payload.get("email", "")).strip().casefold()
    password = str(payload.get("password", ""))
    if not email or "@" not in email or len(email) > 150:
        return error_response("INVALID_EMAIL", "Vui lòng nhập email hợp lệ.", 400)
    User = get_user_model()
    if User.objects.filter(email__iexact=email).exists():
        return error_response("EMAIL_EXISTS", "Email này đã được đăng ký.", 409)
    try:
        validate_password(password)
    except ValidationError as exc:
        return error_response("WEAK_PASSWORD", " ".join(exc.messages), 400)
    user = User.objects.create_user(username=email, email=email, password=password)
    login(request, user)
    return JsonResponse({"user": _user_payload(user)}, status=201)


@require_POST
def sign_in(request):
    payload, error = _json_body(request)
    if error:
        return error
    email = str(payload.get("email", "")).strip().casefold()
    user = authenticate(
        request, username=email, password=str(payload.get("password", ""))
    )
    if user is None:
        return error_response(
            "INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng.", 401
        )
    login(request, user)
    return JsonResponse({"user": _user_payload(user)})


@require_POST
def sign_out(request):
    logout(request)
    return JsonResponse({"ok": True})


def _profile_payload(profile):
    return {
        "business_name": profile.business_name,
        "industry": profile.industry,
        "business_size": profile.business_size,
        "target_customers": profile.target_customers,
        "primary_goal": profile.primary_goal,
        "product_service": profile.product_service,
        "preferred_channels": profile.preferred_channels,
        "monthly_budget": profile.monthly_budget,
        "currency": profile.currency,
    }


@require_http_methods(["GET", "PUT"])
def profile(request):
    if not request.user.is_authenticated:
        return error_response("AUTH_REQUIRED", "Vui lòng đăng nhập.", 401)
    if request.method == "GET":
        existing = BusinessAccount.objects.filter(user=request.user).first()
        return JsonResponse(
            {"profile": _profile_payload(existing) if existing else None}
        )

    payload, error = _json_body(request)
    if error:
        return error
    fields = (
        "business_name",
        "industry",
        "business_size",
        "target_customers",
        "primary_goal",
        "product_service",
    )
    values = {name: str(payload.get(name, "")).strip() for name in fields}
    if any(
        not values[name]
        for name in ("business_name", "industry", "business_size", "target_customers")
    ):
        return error_response(
            "VALIDATION_ERROR",
            "Tên, ngành, quy mô và khách hàng mục tiêu là bắt buộc.",
            400,
        )
    if values["business_size"] not in SIZES:
        return error_response(
            "VALIDATION_ERROR", "Quy mô doanh nghiệp không hợp lệ.", 400
        )
    limits = {
        "business_name": 120,
        "industry": 120,
        "target_customers": 500,
        "primary_goal": 300,
        "product_service": 500,
    }
    if any(len(values[name]) > limit for name, limit in limits.items()):
        return error_response("VALIDATION_ERROR", "Một hoặc nhiều trường quá dài.", 400)
    channels = payload.get("preferred_channels", [])
    if (
        not isinstance(channels, list)
        or len(channels) > 3
        or any(item not in CHANNELS for item in channels)
    ):
        return error_response("VALIDATION_ERROR", "Kênh ưu tiên không hợp lệ.", 400)
    try:
        budget = int(payload.get("monthly_budget", 0))
    except (TypeError, ValueError):
        budget = -1
    if budget < 0 or budget > 1_000_000_000:
        return error_response("VALIDATION_ERROR", "Ngân sách không hợp lệ.", 400)
    currency = payload.get("currency", "VND")
    if currency not in ("VND", "USD"):
        return error_response("VALIDATION_ERROR", "Đơn vị tiền không hợp lệ.", 400)
    saved, _ = BusinessAccount.objects.update_or_create(
        user=request.user,
        defaults={
            **values,
            "preferred_channels": channels,
            "monthly_budget": budget,
            "currency": currency,
        },
    )
    return JsonResponse({"profile": _profile_payload(saved)})


def _read_rows(upload):
    name = upload.name.lower()
    if name.endswith(".csv"):
        content = upload.read().decode("utf-8-sig")
        return list(islice(csv.DictReader(io.StringIO(content)), 2001))
    if name.endswith(".xlsx"):
        workbook = load_workbook(upload, read_only=True, data_only=True)
        sheet = workbook.active
        iterator = sheet.values
        headers = [str(cell or "").strip() for cell in next(iterator)]
        rows = [
            dict(zip(headers, row, strict=False))
            for row in islice(iterator, 2001)
            if any(cell is not None for cell in row)
        ]
        workbook.close()
        return rows
    raise ValueError("Chỉ hỗ trợ tệp CSV hoặc XLSX.")


def _normalise_rows(rows):
    if not rows:
        raise ValueError("Tệp không có dữ liệu.")
    if len(rows) > 2000:
        raise ValueError("Sprint 1 hỗ trợ tối đa 2.000 dòng mỗi lần nhập.")
    headers = {str(key).strip().lower().replace(" ", "_"): key for key in rows[0]}
    mapping = {}
    for field, aliases in ALIASES.items():
        mapping[field] = next(
            (headers[alias] for alias in aliases if alias in headers), None
        )
    required = ("channel", "period", "spend", "clicks", "impressions", "conversions")
    missing = [field for field in required if mapping[field] is None]
    if missing:
        raise ValueError("Thiếu cột bắt buộc: " + ", ".join(missing))
    normalized, errors = [], []
    for index, row in enumerate(rows, start=2):
        try:
            channel = str(row[mapping["channel"]] or "").strip()
            if not channel:
                raise ValueError("thiếu channel")
            period = str(row[mapping["period"]] or "").strip()
            if not period:
                raise ValueError("thiếu period")
            metrics = {}
            for field in ("spend", "clicks", "impressions", "conversions", "revenue"):
                key = mapping[field]
                value = row.get(key) if key else 0
                number = float(str(value or 0).replace(",", ""))
                if number < 0:
                    raise ValueError(f"{field} âm")
                metrics[field] = number
            normalized.append({"channel": channel, "period": period[:80], **metrics})
        except (TypeError, ValueError) as exc:
            errors.append({"row": index, "message": str(exc)})
    return normalized, errors


@require_GET
def import_history(request):
    if not request.user.is_authenticated:
        return error_response("AUTH_REQUIRED", "Vui lòng đăng nhập.", 401)
    items = CampaignImport.objects.filter(user=request.user).values(
        "id", "filename", "row_count", "created_at"
    )[:10]
    latest = CampaignImport.objects.filter(user=request.user).first()
    return JsonResponse(
        {
            "imports": list(items),
            "latest_rows": latest.normalized_rows[:30] if latest else [],
        }
    )


@require_POST
def import_file(request):
    if not request.user.is_authenticated:
        return error_response("AUTH_REQUIRED", "Vui lòng đăng nhập.", 401)
    upload = request.FILES.get("file")
    if not upload:
        return error_response("MISSING_FILE", "Vui lòng chọn tệp CSV hoặc XLSX.", 400)
    if upload.size > 5_000_000:
        return error_response("FILE_TOO_LARGE", "Tệp không được vượt quá 5 MB.", 413)
    try:
        rows, errors = _normalise_rows(_read_rows(upload))
    except (ValueError, UnicodeDecodeError, StopIteration, OSError, BadZipFile) as exc:
        return error_response("INVALID_FILE", str(exc), 400)
    result = {
        "row_count": len(rows),
        "preview": rows[:5],
        "errors": errors[:20],
        "error_count": len(errors),
    }
    if request.POST.get("mode") != "commit":
        return JsonResponse(result)
    if errors or not rows:
        return error_response(
            "VALIDATION_ERROR", "Hãy sửa các dòng lỗi trước khi nhập.", 400, errors[:20]
        )
    saved = CampaignImport.objects.create(
        user=request.user,
        filename=upload.name[:255],
        row_count=len(rows),
        normalized_rows=rows,
    )
    result["import_id"] = saved.pk
    return JsonResponse(result, status=201)
