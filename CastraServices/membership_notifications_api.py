from .membership_api import endpoint, rpc
from .membership_contract import MembershipInputError, body, paging


@endpoint("GET")
def notifications(request):
    value = request.GET.get("unreadOnly", "false")
    if value not in ("true", "false"):
        raise MembershipInputError("Bộ lọc chưa đọc không hợp lệ.")
    return rpc(
        request, "list_notifications", {"p_unread_only": value == "true", **paging(request.GET)}
    )


@endpoint("POST")
def read_notification(request, id):
    body(request, ())
    return rpc(request, "read_notification", {"p_notification_id": str(id)})
