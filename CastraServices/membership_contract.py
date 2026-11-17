"""Small validated HTTP contract; no caller-controlled actor or platform role."""

import json
import re
from uuid import UUID


class MembershipInputError(ValueError):
    pass


def body(request, allowed):
    if len(request.body) > 8000:
        raise MembershipInputError("Dữ liệu vượt quá kích thước cho phép.")
    try:
        value = json.loads(request.body or "{}")
    except (ValueError, UnicodeError) as exc:
        raise MembershipInputError("JSON không hợp lệ.") from exc
    if not isinstance(value, dict) or set(value) - set(allowed):
        raise MembershipInputError("Dữ liệu có trường không được phép.")
    return value


def text(value, maximum, *, required=False):
    if not isinstance(value, str) or len(value) > maximum or (required and not value.strip()):
        raise MembershipInputError("Thông tin văn bản không hợp lệ.")
    return value.strip()


def identifier(value, *, nullable=False):
    if value is None and nullable:
        return None
    try:
        return str(UUID(str(value)))
    except (ValueError, TypeError) as exc:
        raise MembershipInputError("Mã định danh không hợp lệ.") from exc


def member_role(value):
    if value not in ("member", "manager"):
        raise MembershipInputError("Chỉ được cấp Employee hoặc Leader.")
    return value


def email(value):
    value = text(value, 254, required=True).lower()
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
        raise MembershipInputError("Email không hợp lệ.")
    return value


def paging(query):
    try:
        limit, offset = int(query.get("limit", 20)), int(query.get("offset", 0))
    except (ValueError, TypeError) as exc:
        raise MembershipInputError("Phân trang không hợp lệ.") from exc
    if not 1 <= limit <= 50 or offset < 0:
        raise MembershipInputError("Phân trang vượt giới hạn.")
    return {"p_limit": limit, "p_offset": offset}


def boolean(value):
    if type(value) is not bool:
        raise MembershipInputError("Giá trị bật/tắt không hợp lệ.")
    return value
