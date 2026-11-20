"""Platform-only metadata APIs. Authority and mutations remain in guarded RPCs."""

from functools import wraps

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .authentication import AuthenticationError
from .identity import platform_role, verified_identity
from .membership_contract import MembershipInputError, body, identifier
from .supabase_client import SupabaseAPIError, user_client


def endpoint(*methods, platform=True):
    def decorate(view):
        @csrf_exempt
        @require_http_methods(methods)
        @wraps(view)
        def wrapped(request, *args, **kwargs):
            try:
                token, user = verified_identity(request)
                if bool(platform_role(user)) != platform:
                    return JsonResponse(
                        {
                            "error": {
                                "code": "PERMISSION_DENIED",
                                "message": "Bạn không có quyền thực hiện thao tác này.",
                            }
                        },
                        status=403,
                    )
                request.platform_token = token
                request.platform_client = user_client(token)
                return view(request, *args, **kwargs)
            except AuthenticationError as exc:
                return JsonResponse(
                    {"error": {"code": exc.code, "message": exc.message}},
                    status=503 if exc.code == "AUTH_UNAVAILABLE" else 401,
                )
            except MembershipInputError as exc:
                return JsonResponse(
                    {"error": {"code": "VALIDATION_ERROR", "message": str(exc)}}, status=400
                )
            except SupabaseAPIError as exc:
                return JsonResponse(
                    {
                        "error": {
                            "code": exc.code,
                            "message": "Không thể hoàn tất thao tác. Tải lại dữ liệu hoặc thử lại.",
                        }
                    },
                    status=exc.status,
                )

        return wrapped

    return decorate


@endpoint("GET", "POST")
def companies(request):
    if request.method == "GET":
        return JsonResponse(request.platform_client.rpc("platform_directory", {}))
    data = body(
        request,
        ("requestId", "name", "slug", "accountEmail", "legalEntity", "domain", "notes", "status"),
    )
    data["requestId"] = identifier(data.get("requestId"))
    result = request.platform_client.rpc("platform_create", {"p_data": data})
    # Delivery is a separate, explicit retryable action; creation is never
    # described as email delivery or a completed account setup.
    return JsonResponse(result, status=201)


@endpoint("GET", "PATCH")
def company(request, id):
    if request.method == "GET":
        return JsonResponse(request.platform_client.rpc("platform_company", {"p_id": str(id)}))
    data = body(request, ("version", "name", "legalEntity", "domain", "notes", "status"))
    version = data.pop("version", None)
    if type(version) is not int or version < 1:
        raise MembershipInputError("Phiên bản doanh nghiệp không hợp lệ.")
    return JsonResponse(
        request.platform_client.rpc(
            "platform_update", {"p_id": str(id), "p_version": version, "p_data": data}
        )
    )


@endpoint("POST")
def invitation_action(request, id, action):
    body(request, ())
    if action == "revoke":
        return JsonResponse(
            request.platform_client.rpc(
                "platform_invitation_action", {"p_id": str(id), "p_action": "revoke"}
            )
        )
    if action != "send":
        raise MembershipInputError("Thao tác lời mời không hợp lệ.")
    from .platform_delivery import send_manager_invitation

    return JsonResponse(
        send_manager_invitation(request.platform_token, str(id), request.headers.get("Origin"))
    )


@endpoint("POST")
def issue_invitation(request, id):
    data = body(request, ("email",))
    from .membership_contract import email

    return JsonResponse(
        request.platform_client.rpc(
            "platform_issue_manager_invitation",
            {"p_workspace_id": str(id), "p_email": email(data.get("email"))},
        ),
        status=201,
    )


@endpoint("GET", "POST")
def notifications(request):
    params = {}
    if request.method == "POST":
        data = body(request, ("id",))
        params["p_read_id"] = identifier(data.get("id"))
    return JsonResponse(request.platform_client.rpc("platform_notifications", params))


@endpoint("GET", platform=False)
def my_invitations(request):
    return JsonResponse(request.platform_client.rpc("platform_my_manager_invitations", {}))


@endpoint("POST", platform=False)
def accept_invitation(request, id):
    body(request, ())
    return JsonResponse(
        request.platform_client.rpc("platform_accept_manager_invitation", {"p_id": str(id)})
    )
