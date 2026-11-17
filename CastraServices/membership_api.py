"""Bearer-only onboarding and Workspace personnel endpoints."""

from functools import wraps

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .authentication import AuthenticationError, WorkspaceAuthorizationError, authenticate_request
from .identity import platform_role, verified_identity
from .membership_contract import (
    MembershipInputError,
    body,
    boolean,
    email,
    identifier,
    member_role,
    paging,
    text,
)
from .membership_delivery import send_invitation_email
from .supabase_client import SupabaseAPIError, user_client

MESSAGES = {
    "AUTH_REQUIRED": "Vui lòng đăng nhập lại.",
    "PERMISSION_DENIED": "Bạn không có quyền thực hiện thao tác này.",
    "PASSWORD_SETUP_REQUIRED": "Vui lòng đặt mật khẩu trước khi tiếp tục.",
    "VALIDATION_ERROR": "Thông tin chưa hợp lệ.",
    "REQUEST_CLOSED": "Yêu cầu đã được xử lý. Hãy tải lại danh sách.",
    "ALREADY_MEMBER": "Tài khoản đã thuộc Workspace này.",
    "INVITATION_CONFLICT": (
        "Đã có lời mời khác hoặc nhóm trùng tên. Kiểm tra danh sách trước khi tạo mới."
    ),
    "INVITATION_EXPIRED": "Lời mời đã hết hạn. Liên hệ quản lý để nhận lời mời mới.",
    "INVITATION_REVOKED": "Lời mời không còn hiệu lực.",
    "RATE_LIMITED": "Thao tác quá nhanh hoặc đã đạt giới hạn. Vui lòng đợi rồi thử lại.",
}


def failure(code, status, message=None):
    return JsonResponse(
        {
            "error": {
                "code": code,
                "message": message
                or MESSAGES.get(code, "Dịch vụ nhân sự chưa khả dụng. Vui lòng thử lại."),
                "details": [],
            }
        },
        status=status,
    )


def endpoint(*methods, admin=False):
    def decorate(view):
        @csrf_exempt
        @require_http_methods(methods)
        @wraps(view)
        def wrapped(request, *args, **kwargs):
            try:
                if admin:
                    context = authenticate_request(request)
                    if context.role != "admin":
                        return failure("PERMISSION_DENIED", 403)
                    request.membership_workspace = str(context.workspace_id)
                    request.membership_token = context.access_token
                else:
                    token, user = verified_identity(request)
                    if platform_role(user):
                        return failure("PERMISSION_DENIED", 403)
                    request.membership_token = token
                request.membership_client = user_client(request.membership_token)
                return view(request, *args, **kwargs)
            except AuthenticationError as exc:
                return failure(exc.code, 503 if exc.code == "AUTH_UNAVAILABLE" else 401)
            except WorkspaceAuthorizationError as exc:
                return failure(exc.code, 403)
            except MembershipInputError as exc:
                return failure("VALIDATION_ERROR", 400, str(exc))
            except SupabaseAPIError as exc:
                return failure(exc.code, exc.status)

        return wrapped

    return decorate


def rpc(request, name, params=None, status=200):
    return JsonResponse(
        request.membership_client.rpc("membership_" + name, params or {}), status=status
    )


@endpoint("GET")
def onboarding_state(request):
    return rpc(request, "onboarding_state")


@endpoint("GET")
def companies(request):
    return rpc(
        request,
        "company_directory",
        {"p_search": text(request.GET.get("search", ""), 120), **paging(request.GET)},
    )


@endpoint("GET", "POST")
def requests(request):
    if request.method == "GET":
        return rpc(request, "my_requests", paging(request.GET))
    data = body(request, ("workspaceId", "message"))
    return rpc(
        request,
        "request_join",
        {
            "p_workspace_id": identifier(data.get("workspaceId")),
            "p_message": text(data.get("message", ""), 1000),
        },
        status=201,
    )


@endpoint("POST")
def cancel_request(request, id):
    body(request, ())
    return rpc(request, "cancel_request", {"p_request_id": str(id)})


@endpoint("GET")
def my_invitations(request):
    return rpc(request, "my_invitations", paging(request.GET))


@endpoint("POST")
def accept_invitation(request, id):
    body(request, ())
    return rpc(request, "accept_invitation", {"p_invitation_id": str(id)})


@endpoint("GET", admin=True)
def personnel(request):
    query = request.GET
    return rpc(
        request,
        "personnel",
        {
            "p_workspace_id": request.membership_workspace,
            "p_tab": text(query.get("tab", "members"), 20),
            "p_search": text(query.get("search", ""), 254),
            "p_role": text(query.get("role", ""), 20),
            "p_status": text(query.get("status", ""), 20),
            "p_team_id": identifier(query.get("teamId") or None, nullable=True),
            "p_sort": text(query.get("sort", "newest"), 20),
            **paging(query),
        },
    )


@endpoint("GET", "PUT", admin=True)
def recruitment(request):
    params = {"p_workspace_id": request.membership_workspace}
    if request.method == "GET":
        return rpc(request, "get_recruitment", params)
    data = body(request, ("acceptingJoinRequests", "publicDescription"))
    params.update(
        p_accepting=boolean(data.get("acceptingJoinRequests")),
        p_description=text(data.get("publicDescription", ""), 300),
    )
    return rpc(request, "set_recruitment", params)


@endpoint("GET", "POST", admin=True)
def teams(request):
    params = {"p_workspace_id": request.membership_workspace}
    if request.method == "GET":
        return rpc(request, "teams", params)
    data = body(request, ("name",))
    params["p_name"] = text(data.get("name"), 80, required=True)
    return rpc(request, "create_team", params, status=201)


@endpoint("POST", admin=True)
def review_request(request, id):
    data = body(request, ("decision", "teamId", "reason"))
    if data.get("decision") not in ("approve", "reject"):
        raise MembershipInputError("Quyết định không hợp lệ.")
    return rpc(
        request,
        "review_request",
        {
            "p_workspace_id": request.membership_workspace,
            "p_request_id": str(id),
            "p_decision": data["decision"],
            "p_team_id": identifier(data.get("teamId"), nullable=True),
            "p_reason": text(data.get("reason", ""), 500, required=data["decision"] == "reject"),
        },
    )


@endpoint("POST", admin=True)
def invite(request):
    data = body(request, ("email", "role", "teamId"))
    invitation = request.membership_client.rpc(
        "membership_invite",
        {
            "p_workspace_id": request.membership_workspace,
            "p_email": email(data.get("email")),
            "p_role": member_role(data.get("role", "member")),
            "p_team_id": identifier(data.get("teamId"), nullable=True),
        },
    )
    result = send_invitation_email(
        access_token=request.membership_token,
        workspace_id=request.membership_workspace,
        invitation=invitation,
        origin=request.headers.get("Origin"),
    )
    return JsonResponse(result, status=201)


@endpoint("POST", admin=True)
def resend_invitation(request, id):
    body(request, ())
    result = send_invitation_email(
        access_token=request.membership_token,
        workspace_id=request.membership_workspace,
        invitation={"id": str(id)},
        origin=request.headers.get("Origin"),
    )
    return JsonResponse(result)


@endpoint("POST", admin=True)
def revoke_invitation(request, id):
    body(request, ())
    return rpc(
        request,
        "revoke_invitation",
        {"p_workspace_id": request.membership_workspace, "p_invitation_id": str(id)},
    )


@endpoint("PATCH", "DELETE", admin=True)
def member(request, user_id):
    params = {"p_workspace_id": request.membership_workspace, "p_user_id": str(user_id)}
    if request.method == "DELETE":
        body(request, ())
        return rpc(request, "remove_member", params)
    data = body(request, ("role", "teamIds"))
    ids = data.get("teamIds", [])
    if not isinstance(ids, list) or len(ids) > 20:
        raise MembershipInputError("Danh sách nhóm không hợp lệ.")
    params.update(p_role=member_role(data.get("role")), p_team_ids=[identifier(x) for x in ids])
    return rpc(request, "update_member", params)
