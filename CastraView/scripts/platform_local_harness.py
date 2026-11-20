"""Real Auth/REST/Django checks on the dedicated local platform project only.

Credentials are random, memory-only and never printed. --serve keeps a local
browser test bridge alive; it never contacts a hosted Supabase project.
"""

import json
import os
import secrets
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4

import httpx
from run_platform_local import ROOT, STACK, checked_container

checked_container()
metadata = subprocess.run(
    ["npx.cmd", "--yes", "supabase@2.121.0", "--workdir", str(STACK), "status", "-o", "json"],
    capture_output=True,
    text=True,
    encoding="utf-8",
    check=True,
)
keys = json.loads(metadata.stdout)
URL = "http://127.0.0.1:61321"
if keys.get("API_URL") != URL:
    raise SystemExit("Local API identity guard failed; no requests sent.")
PUBLIC = keys["ANON_KEY"]
SERVICE = keys["SERVICE_ROLE_KEY"]
os.environ.update(
    PYTHON_DOTENV_DISABLED="1",
    DJANGO_SETTINGS_MODULE="CastraVision.settings",
    SUPABASE_URL=URL,
    SUPABASE_PUBLISHABLE_KEY=PUBLIC,
    SUPABASE_ANON_KEY=PUBLIC,
    SUPABASE_SERVICE_ROLE_KEY=SERVICE,
    SUPABASE_SECRET_KEY="",
    DATABASE_URL="sqlite:///:memory:",
    ALLOWED_HOSTS="testserver,localhost,127.0.0.1",
    BACKEND_CORS_ORIGINS="http://127.0.0.1:61300",
    OPENAI_API_KEY="",
)
sys.path.insert(0, str(ROOT))
import django  # noqa: E402 - configure the isolated environment before loading Django

django.setup()
from django.test import Client  # noqa: E402

http = httpx.Client(timeout=25, transport=httpx.HTTPTransport(retries=2))
checks = []
users = {}
stamp = uuid4().hex[:10]


def check(label, condition):
    checks.append({"case": label, "pass": bool(condition)})
    if not condition:
        raise AssertionError(label)


def headers(token, workspace=None):
    return {
        "HTTP_AUTHORIZATION": "Bearer " + token,
        **({"HTTP_X_WORKSPACE_ID": workspace} if workspace else {}),
    }


def call(token, path, method="get", data=None, workspace=None):
    client = Client()
    kwargs = headers(token, workspace) if token else {}
    if method in ("post", "patch", "put"):
        return getattr(client, method)(
            "/api/" + path, data=json.dumps(data or {}), content_type="application/json", **kwargs
        )
    return getattr(client, method)("/api/" + path, **kwargs)


def rpc(token, name, data):
    result = http.post(
        URL + "/rest/v1/rpc/" + name,
        headers={"apikey": PUBLIC, "Authorization": "Bearer " + token},
        json=data,
    )
    check("RPC " + name, result.is_success)
    return result.json()


def make_user(label, platform=False):
    email = f"platform-audit-{stamp}-{label}@example.test"
    password = secrets.token_urlsafe(30) + "aA1!"
    result = http.post(
        URL + "/auth/v1/admin/users",
        headers={"apikey": SERVICE, "Authorization": "Bearer " + SERVICE},
        json={
            "email": email,
            "password": password,
            "email_confirm": True,
            "app_metadata": {"platform_role": "system_admin"} if platform else {},
        },
    )
    check("Create disposable " + label, result.is_success)
    login = http.post(
        URL + "/auth/v1/token?grant_type=password",
        headers={"apikey": PUBLIC},
        json={"email": email, "password": password},
    )
    check("Real password login " + label, login.status_code == 200)
    value = login.json()
    # A genuine subsequent password operation completes the onboarding marker.
    password = secrets.token_urlsafe(30) + "aA1!"
    updated = http.put(
        URL + "/auth/v1/user",
        headers={"apikey": PUBLIC, "Authorization": "Bearer " + value["access_token"]},
        json={"password": password},
    )
    check("Password setup " + label, updated.is_success)
    users[label] = {
        "email": email,
        "password": password,
        "session": value,
        "id": result.json()["id"],
    }
    return value["access_token"]


def run():
    admin = make_user("system", True)
    manager = make_user("manager")
    leader = make_user("leader")
    employee = make_user("employee")
    check("Anonymous platform API denied", call(None, "platform/companies/").status_code == 401)
    for label, token in [("manager", manager), ("leader", leader), ("employee", employee)]:
        check(label + " platform API denied", call(token, "platform/companies/").status_code == 403)
    request = {
        "requestId": str(uuid4()),
        "name": "Local Platform Audit " + stamp,
        "slug": "platform-audit-" + stamp,
        "accountEmail": users["manager"]["email"],
        "domain": "shared.example.test",
        "status": "Active",
    }
    with ThreadPoolExecutor(max_workers=2) as pool:
        responses = list(
            pool.map(lambda _: call(admin, "platform/companies/", "post", request), range(2))
        )
    check(
        "Concurrent idempotent create",
        all(r.status_code == 201 for r in responses)
        and responses[0].json()["id"] == responses[1].json()["id"],
    )
    company = responses[0].json()
    workspace = company["id"]
    invitation = company["invitation"]["id"]
    check(
        "Invitation send to local mailbox",
        call(admin, f"platform/invitations/{invitation}/send/", "post").json().get("deliveryStatus")
        == "sent",
    )
    check(
        "Wrong recipient cannot accept",
        call(employee, f"onboarding/manager-invitations/{invitation}/accept/", "post").status_code
        == 403,
    )
    check(
        "MM invitation accept",
        call(manager, f"onboarding/manager-invitations/{invitation}/accept/", "post").status_code
        == 200,
    )
    check(
        "MM accept retry",
        call(manager, f"onboarding/manager-invitations/{invitation}/accept/", "post").status_code
        == 200,
    )
    context = call(manager, "auth/session/").json()
    check(
        "MM membership persisted",
        any(
            m["workspace_id"] == workspace and m["role"] == "admin" for m in context["memberships"]
        ),
    )
    for label, token, role in [("leader", leader, "manager"), ("employee", employee, "member")]:
        invitation_row = rpc(
            manager,
            "membership_invite",
            {"p_workspace_id": workspace, "p_email": users[label]["email"], "p_role": role},
        )
        rpc(token, "membership_accept_invitation", {"p_invitation_id": invitation_row["id"]})
        check(
            label + " role still cannot use platform",
            call(token, "platform/companies/").status_code == 403,
        )
    restheaders = {"apikey": PUBLIC, "Authorization": "Bearer " + manager}
    inserted = http.post(
        URL + "/rest/v1/business_profiles",
        headers=restheaders,
        json={"workspace_id": workspace, "industry": "Retail"},
    )
    check("Create real internal business fixture", inserted.is_success)
    for label, token in [
        ("system", admin),
        ("manager", manager),
        ("leader", leader),
        ("employee", employee),
    ]:
        result = http.get(
            URL + "/rest/v1/business_profiles",
            headers={"apikey": PUBLIC, "Authorization": "Bearer " + token},
            params={"select": "workspace_id", "workspace_id": "eq." + workspace},
        )
        check(
            label + " active REST scope",
            result.is_success and bool(result.json()) == (label != "system"),
        )
    before = call(admin, f"platform/companies/{workspace}/").json()
    update = call(
        admin,
        f"platform/companies/{workspace}/",
        "patch",
        {"version": before["version"], "name": "Updated " + stamp, "status": "Inactive"},
    )
    check(
        "Update and suspend persisted",
        update.status_code == 200
        and call(admin, f"platform/companies/{workspace}/").json()["status"] == "Inactive",
    )
    check(
        "Stale update rejected",
        call(
            admin,
            f"platform/companies/{workspace}/",
            "patch",
            {"version": before["version"], "status": "Active"},
        ).status_code
        == 409,
    )
    for label, token in [("manager", manager), ("leader", leader), ("employee", employee)]:
        result = http.get(
            URL + "/rest/v1/business_profiles",
            headers={"apikey": PUBLIC, "Authorization": "Bearer " + token},
            params={"select": "workspace_id", "workspace_id": "eq." + workspace},
        )
        check(label + " pre-issued JWT REST suspension", result.is_success and result.json() == [])
        blocked = call(token, "business-profile/", workspace=workspace)
        check(
            label + " pre-issued JWT Django suspension",
            blocked.status_code == 403 and blocked.json()["error"]["code"] == "WORKSPACE_INACTIVE",
        )
        blocked = http.post(
            URL + "/rest/v1/rpc/leader_workflow",
            headers={"apikey": PUBLIC, "Authorization": "Bearer " + token},
            json={"p_workspace_id": workspace, "p_command": "dashboard", "p_data": {}},
        )
        check(
            label + " pre-issued JWT RPC suspension",
            blocked.is_error and blocked.json().get("message") == "WORKSPACE_INACTIVE",
        )
    resumed = call(
        admin,
        f"platform/companies/{workspace}/",
        "patch",
        {"version": update.json()["version"], "status": "Active"},
    )
    check("Reactivate", resumed.status_code == 200)
    check(
        "Business API access restored",
        call(manager, "business-profile/", workspace=workspace).status_code == 200,
    )
    events = call(admin, "platform/notifications/").json()["items"]
    check(
        "Safe platform events",
        bool(events) and all("changes" not in item and "email" not in item for item in events),
    )
    marked = call(admin, "platform/notifications/", "post", {"id": events[0]["id"]})
    check(
        "Read receipt persists",
        marked.status_code == 200
        and any(
            item["id"] == events[0]["id"] and item["isRead"]
            for item in call(admin, "platform/notifications/").json()["items"]
        ),
    )
    return {"workspace": workspace, "checks": checks}


try:
    summary = run()
    out = ROOT / "docs" / "UI" / "audits" / "2026-11-20" / "system-admin-real-local.json"
    out.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(
        json.dumps(
            {
                "checks": len(checks),
                "passed": sum(c["pass"] for c in checks),
                "report": str(out.relative_to(ROOT)),
            }
        )
    )
    if "--serve" in sys.argv:
        from wsgiref.simple_server import WSGIRequestHandler, make_server

        from django.core.wsgi import get_wsgi_application

        app = get_wsgi_application()

        class Quiet(WSGIRequestHandler):
            def log_message(self, *args):
                pass

        def bridge(environ, start_response):
            if environ["PATH_INFO"] == "/_audit/credentials":
                if environ.get("HTTP_ORIGIN") != "http://127.0.0.1:61300":
                    start_response("403 Forbidden", [("Content-Type", "application/json")])
                    return [b"{}"]
                value = users["system"]
                start_response(
                    "200 OK",
                    [
                        ("Content-Type", "application/json"),
                        ("Access-Control-Allow-Origin", "http://127.0.0.1:61300"),
                        ("Cache-Control", "no-store"),
                    ],
                )
                return [
                    json.dumps({"email": value["email"], "password": value["password"]}).encode()
                ]
            return app(environ, start_response)

        server = make_server("127.0.0.1", 61380, bridge, handler_class=Quiet)
        print("Local browser test backend ready on 61380; no credentials printed.", flush=True)
        server.serve_forever()
except Exception as exc:
    print(
        json.dumps(
            {
                "checks": checks,
                "errorType": type(exc).__name__,
                "message": str(exc)
                if isinstance(exc, AssertionError)
                else "Local harness failed; no request secrets printed.",
            }
        )
    )
    raise SystemExit(1) from None
