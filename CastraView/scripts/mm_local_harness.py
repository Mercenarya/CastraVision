"""Local-only real Auth/API fixture harness and loopback browser handoff.

Passwords and JWTs exist only in memory. Never run against a hosted project.
"""

import base64
import json
import os
import secrets
import subprocess
import sys
import time
import uuid
from datetime import date
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

import httpx

REPO = Path(__file__).resolve().parents[2]
STACK = REPO / ".tmp" / "mm-functional-test"
RAW = subprocess.run(
    ["npx.cmd", "--yes", "supabase@2.121.0", "--workdir", str(STACK), "status", "-o", "json"],
    capture_output=True,
    text=True,
    encoding="utf-8",
    check=True,
)
CONFIG = json.loads(RAW.stdout)
URL = CONFIG["API_URL"]
if urlparse(URL).hostname not in ("127.0.0.1", "localhost") or urlparse(URL).port != 60321:
    raise SystemExit("Refusing non-local or unexpected stack")
KEY = CONFIG["ANON_KEY"]
SERVICE = CONFIG["SERVICE_ROLE_KEY"]
HTTP = httpx.Client(timeout=35)
USERS = {}
CHECKS = []


def check(name, passed):
    CHECKS.append({"name": name, "pass": bool(passed)})
    print(("PASS " if passed else "FAIL ") + name, flush=True)
    if not passed:
        raise RuntimeError("Verification failed: " + name)


def auth_request(method, path, payload=None, token=None, admin=False):
    return HTTP.request(
        method,
        URL + "/auth/v1/" + path,
        json=payload,
        headers={
            "apikey": SERVICE if admin else KEY,
            "Authorization": "Bearer " + (SERVICE if admin else token or KEY),
        },
    )


def make_user(label):
    email = f"mm-audit-{label}-{secrets.token_hex(3)}@example.test"
    first = secrets.token_urlsafe(24) + "Aa1!"
    password = secrets.token_urlsafe(24) + "Aa1!"
    response = auth_request(
        "POST",
        "admin/users",
        {
            "email": email,
            "password": first,
            "email_confirm": True,
            "user_metadata": {"full_name": "Kiểm thử " + label},
        },
        admin=True,
    )
    response.raise_for_status()
    identity = response.json()
    # Auth password update fires the same setup trigger as the real set-password flow.
    response = auth_request(
        "PUT", "admin/users/" + identity["id"], {"password": password}, admin=True
    )
    response.raise_for_status()
    session = auth_request(
        "POST", "token?grant_type=password", {"email": email, "password": password}
    )
    session.raise_for_status()
    result = {"id": identity["id"], "email": email, "password": password, "session": session.json()}
    USERS[label] = result
    return result


def api(label, path, payload=None, method=None, workspace=None):
    headers = {
        "Authorization": "Bearer " + USERS[label]["session"]["access_token"],
        "X-Workspace-ID": workspace or WS,
        "Origin": "http://127.0.0.1:60300",
    }
    response = HTTP.request(
        method or ("POST" if payload is not None else "GET"),
        "http://127.0.0.1:60380/api/" + path,
        json=payload,
        headers=headers,
    )
    return response


for label in ("admin", "other", "leader", "employee", "candidate", "rejected", "invitee"):
    make_user(label)
WS, OTHER_WS, TEAM = (str(uuid.uuid4()) for _ in range(3))
sql = f"""
begin;
insert into public.workspaces(id,name,owner_id) values
('{WS}','[MM-LOCAL] Công ty kiểm thử','{USERS["admin"]["id"]}'),
('{OTHER_WS}','[MM-LOCAL] Công ty khác','{USERS["other"]["id"]}');
insert into public.workspace_members(workspace_id,user_id,role) values
('{WS}','{USERS["admin"]["id"]}','admin'),('{OTHER_WS}','{USERS["other"]["id"]}','admin'),
('{WS}','{USERS["leader"]["id"]}','manager'),
('{WS}','{USERS["employee"]["id"]}','member') on conflict do nothing;
insert into public.workspace_teams(id,workspace_id,name) values
('{TEAM}','{WS}','Nội dung kiểm thử');
insert into public.workspace_team_members(workspace_id,user_id,team_id) values
('{WS}','{USERS["leader"]["id"]}','{TEAM}'),('{WS}','{USERS["employee"]["id"]}','{TEAM}');
insert into public.business_profiles(workspace_id,industry,company_size,target_customer,
product_service,primary_goal,monthly_budget,currency) values
('{WS}','Bán lẻ','sme','Khách hàng thử','Sản phẩm thử','Kiểm chứng dữ liệu',300000,'VND');
commit;
"""
subprocess.run(
    [
        "docker",
        "exec",
        "-i",
        "supabase_db_CastraVision-mm-functional-test",
        "psql",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-v",
        "ON_ERROR_STOP=1",
    ],
    input=sql,
    text=True,
    encoding="utf-8",
    capture_output=True,
    check=True,
)
env = os.environ.copy()
env.update(
    {
        "SUPABASE_URL": URL,
        "SUPABASE_PUBLISHABLE_KEY": KEY,
        "SUPABASE_ANON_KEY": KEY,
        "SUPABASE_SERVICE_ROLE_KEY": SERVICE,
        "SUPABASE_SECRET_KEY": "",
        "DATABASE_URL": "sqlite:///:memory:",
        "OPENAI_API_KEY": "",
        "DEBUG": "True",
        "BACKEND_CORS_ORIGINS": "http://127.0.0.1:60300",
        "VITE_SUPABASE_URL": URL,
        "VITE_SUPABASE_PUBLISHABLE_KEY": KEY,
        "VITE_API_BASE_URL": "http://127.0.0.1:60380",
        "VITE_API_PROXY_TARGET": "http://127.0.0.1:60380",
    }
)
backend_log = (STACK / "django.log").open("w", encoding="utf-8")
frontend_log = (STACK / "vite.log").open("w", encoding="utf-8")
backend = subprocess.Popen(
    [sys.executable, "manage.py", "runserver", "127.0.0.1:60380", "--noreload"],
    cwd=REPO,
    env=env,
    stdout=backend_log,
    stderr=subprocess.STDOUT,
)
frontend = subprocess.Popen(
    ["npm.cmd", "run", "dev", "--", "--host", "127.0.0.1", "--port", "60300", "--strictPort"],
    cwd=REPO / "CastraView",
    env=env,
    stdout=frontend_log,
    stderr=subprocess.STDOUT,
)
try:
    for _attempt in range(60):
        try:
            if HTTP.get("http://127.0.0.1:60380/api/health/").status_code == 200:
                break
        except httpx.RequestError:
            pass
        time.sleep(0.5)
    else:
        raise RuntimeError("Local backend not ready")
    for _ in range(60):
        try:
            if HTTP.get("http://127.0.0.1:60380/api/health/").status_code == 200:
                break
        except httpx.RequestError:
            pass
        time.sleep(0.5)
    context = api("admin", "leader/context/")
    check("local MM JWT and Django context", context.status_code == 200)
    result = api(
        "admin",
        "leader/create_campaign/",
        {
            "teamId": TEAM,
            "name": "[MM-LOCAL] Chiến dịch tiếng Việt",
            "budget": 300000,
            "currency": "VND",
            "channels": ["Meta", "Google Ads", "TikTok"],
            "requestId": str(uuid.uuid4()),
        },
    )
    check("campaign saved through user JWT", result.status_code == 200)
    CAMPAIGN = result.json()["id"]
    headers = {
        "Authorization": "Bearer " + USERS["admin"]["session"]["access_token"],
        "X-Workspace-ID": WS,
    }
    csv = (
        "date,channel,spend,impressions,clicks,conversions,revenue\n"
        f"{date.today()},facebook,100,1000,50,5,600\n"
        f"{date.today()},google,200,2000,80,8,1000\n"
    )
    response = HTTP.post(
        "http://127.0.0.1:60380/api/campaign-imports/upload/",
        headers=headers,
        data={"campaign_id": CAMPAIGN, "mode": "commit"},
        files={"file": ("MM_LOCAL.csv", csv, "text/csv")},
    )
    check(
        "observed CSV import persisted",
        response.status_code == 201 and response.json()["row_count"] == 2,
    )
    for kind in ("csv", "pdf"):
        payload = {
            "from": str(date.today()),
            "to": str(date.today()),
            "campaignIds": [CAMPAIGN],
            "metrics": ["spend", "revenue", "roas", "ctr"],
            "format": kind,
            "requestId": str(uuid.uuid4()),
        }
        response = api("admin", "manager/reports/", payload)
        check(kind + " report creates actual persisted artifact", response.status_code == 200)
        artifact = response.json()
        content = base64.b64decode(artifact["contentBase64"])
        check(
            kind + " file format valid",
            content.startswith(b"%PDF-")
            if kind == "pdf"
            else b"600" in content and b"1000" in content,
        )
        (STACK / ("report." + kind)).write_bytes(content)
        downloaded = api("admin", f"manager/reports/{artifact['id']}/")
        check(
            kind + " history download is same stored bytes",
            downloaded.status_code == 200
            and downloaded.json()["contentBase64"] == artifact["contentBase64"],
        )
        retry = api("admin", "manager/reports/", payload)
        check(
            kind + " retry is idempotent",
            retry.status_code == 200 and retry.json()["id"] == artifact["id"],
        )
        for label in ("leader", "employee", "other"):
            denied = api(
                label,
                f"manager/reports/{artifact['id']}/",
                workspace=OTHER_WS if label == "other" else WS,
            )
            check(kind + " download denied to " + label, denied.status_code in (403, 404))
        direct = HTTP.get(
            URL + "/rest/v1/reports",
            params={"id": "eq." + artifact["id"], "select": "id,params"},
            headers={
                "apikey": KEY,
                "Authorization": "Bearer " + USERS["employee"]["session"]["access_token"],
            },
        )
        check(
            kind + " direct RLS hides artifact from Employee",
            direct.status_code == 200 and direct.json() == [],
        )
    created = api("admin", "manager/competitors/", {"keyword": "Thương hiệu kiểm thử"})
    check(
        "competitor persists without fake analysis",
        created.status_code == 200 and created.json()["analysisAvailable"] is False,
    )
    duplicate = api("admin", "manager/competitors/", {"keyword": "THƯƠNG HIỆU KIỂM THỬ"})
    check("duplicate competitor rejected", duplicate.status_code == 409)
    check(
        "competitor reload reads saved registry",
        any(
            item["keyword"] == "Thương hiệu kiểm thử"
            for item in api("admin", "manager/competitors/").json()["items"]
        ),
    )
    # Join workflow exercises password-setup, notification, isolation and duplicate decisions.
    check(
        "enable local recruitment",
        api(
            "admin",
            "workspace/recruitment/",
            {"acceptingJoinRequests": True, "publicDescription": "Chỉ dữ liệu thử local"},
            method="PUT",
        ).status_code
        == 200,
    )
    for label, decision in (("candidate", "approve"), ("rejected", "reject")):
        request = api(
            label, "onboarding/requests/", {"workspaceId": WS, "message": "Yêu cầu kiểm thử local"}
        )
        check(label + " sends real join request", request.status_code == 201)
        request_id = request.json()["id"]
        denied = api(
            "other",
            f"workspace/requests/{request_id}/review/",
            {"decision": decision, "teamId": TEAM, "reason": "Kiểm thử từ chối"},
            workspace=OTHER_WS,
        )
        check(label + " cross-workspace review denied", denied.status_code == 403)
        review = api(
            "admin",
            f"workspace/requests/{request_id}/review/",
            {
                "decision": decision,
                "teamId": TEAM if decision == "approve" else None,
                "reason": "Kiểm thử từ chối",
            },
        )
        check(label + " review saved", review.status_code == 200)
        member_context = api(label, "leader/context/")
        check(
            label + " membership matches decision",
            member_context.status_code == (200 if decision == "approve" else 403),
        )
    check(
        "protect last MM",
        api("admin", f"workspace/members/{USERS['admin']['id']}/", {}, method="DELETE").status_code
        == 403,
    )
    # Leave approved candidate for the browser remove-member test, separate from demo users.
    (STACK / "api-evidence.json").write_text(
        json.dumps(
            {"checks": CHECKS, "workspace": WS, "team": TEAM, "campaign": CAMPAIGN},
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print("Local browser ready at http://127.0.0.1:60300 (no credentials printed).", flush=True)

    class Bridge(BaseHTTPRequestHandler):
        def log_message(self, *_args):
            pass

        def do_OPTIONS(self):
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", "http://127.0.0.1:60300")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
            self.end_headers()

        def do_POST(self):
            if self.headers.get("Origin") != "http://127.0.0.1:60300":
                self.send_error(403)
                return
            payload = json.loads(self.rfile.read(int(self.headers.get("Content-Length", "0"))))
            label = payload.get("role", "admin")
            if label not in USERS:
                self.send_error(400)
                return
            user = USERS[label]
            if self.path == "/session":
                response = auth_request(
                    "POST",
                    "token?grant_type=password",
                    {"email": user["email"], "password": user["password"]},
                )
                result = response.json()
                output = {
                    "access_token": result["access_token"],
                    "refresh_token": result["refresh_token"],
                }
            elif self.path == "/password":
                output = {"current": user["password"], "new": secrets.token_urlsafe(24) + "Aa1!"}
                user["nextPassword"] = output["new"]
            elif self.path == "/verify-password":
                old = auth_request(
                    "POST",
                    "token?grant_type=password",
                    {"email": user["email"], "password": user["password"]},
                )
                new = auth_request(
                    "POST",
                    "token?grant_type=password",
                    {"email": user["email"], "password": user["nextPassword"]},
                )
                output = {
                    "oldRejected": old.status_code == 400,
                    "newAccepted": new.status_code == 200,
                }
                if output["newAccepted"]:
                    user["password"] = user["nextPassword"]
            else:
                output = {
                    "workspaceId": WS,
                    "teamId": TEAM,
                    "campaignId": CAMPAIGN,
                    "candidateId": USERS["candidate"]["id"],
                    "candidateEmail": USERS["candidate"]["email"],
                    "inviteeEmail": USERS["invitee"]["email"],
                }
            self.send_response(200)
            self.send_header("Access-Control-Allow-Origin", "http://127.0.0.1:60300")
            self.send_header("Content-Type", "application/json")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(json.dumps(output).encode())

    ThreadingHTTPServer(("127.0.0.1", 60341), Bridge).serve_forever()
finally:
    for process in (backend, frontend):
        if os.name == "nt":
            subprocess.run(["taskkill", "/PID", str(process.pid), "/T", "/F"], capture_output=True)
        else:
            process.terminate()
