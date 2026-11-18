"""Real JWT/HTTP checks on a disposable, guarded Leader stack only.

No .env is read. Credentials are generated in memory and never printed.
Run with the project venv: python scripts/leader/local_verify.py [serve|test].
Serve additionally starts a local-only credential bridge for filling the login form.
The bridge serves disposable fixtures, never hosted accounts or access tokens.
"""

import json
import os
import secrets
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from http.server import BaseHTTPRequestHandler, HTTPServer
from io import BytesIO
from pathlib import Path
from uuid import uuid4

import httpx
from local_stack import guard, sql
from local_stack import status as stack_status
from openpyxl import Workbook

ROOT = Path(__file__).resolve().parents[2]
guard()
status = stack_status()
API = "http://127.0.0.1:59321"
WEB = "http://127.0.0.1:59300"
BACKEND = "http://127.0.0.1:59800"
http = httpx.Client(timeout=30)
users = {}
workspace, other_workspace, team, other_team = [str(uuid4()) for _ in range(4)]
password = secrets.token_urlsafe(24)
for name, role in [
    ("mm", "admin"),
    ("leader", "manager"),
    ("employee", "member"),
    ("outsider", "manager"),
]:
    email = f"leader-check-{name}-{uuid4().hex[:8]}@example.test"
    result = http.post(
        API + "/auth/v1/admin/users",
        headers={
            "apikey": status["SERVICE_ROLE_KEY"],
            "Authorization": "Bearer " + status["SERVICE_ROLE_KEY"],
        },
        json={"email": email, "password": password, "email_confirm": True},
    )
    if result.status_code not in (200, 201):
        raise RuntimeError("Local fixture provisioning failed (response withheld).")
    users[name] = {"id": result.json()["id"], "email": email, "role": role}

sql(f"""
insert into public.workspaces(id,name,owner_id) values
('{workspace}','Leader QA Business','{users["mm"]["id"]}'),
('{other_workspace}','Other QA Business','{users["outsider"]["id"]}');
insert into public.workspace_teams(id,workspace_id,name) values
('{team}','{workspace}','QA Content Team'),('{other_team}','{other_workspace}','Other Team');
insert into public.business_profiles(workspace_id,industry,company_size,target_customer,
primary_goal,product_service,currency,monthly_budget)
values('{workspace}','Retail','sme','Young athletes',
'Increase qualified conversions','Running shoes','USD',1000);
""")
for name, user in users.items():
    ws = other_workspace if name == "outsider" else workspace
    tm = other_team if name == "outsider" else team
    sql(f"""
    insert into public.workspace_members(workspace_id,user_id,role)
    values('{ws}','{user["id"]}','{user["role"]}');
    insert into public.workspace_team_members(workspace_id,team_id,user_id)
    values('{ws}','{tm}','{user["id"]}');
    update auth.users set encrypted_password=encrypted_password where id='{user["id"]}';
    """)
    # The project's password-ready trigger requires a real credential update.
    result = http.put(
        API + "/auth/v1/admin/users/" + user["id"],
        headers={
            "apikey": status["SERVICE_ROLE_KEY"],
            "Authorization": "Bearer " + status["SERVICE_ROLE_KEY"],
        },
        json={"password": password},
    )
    if result.status_code != 200:
        raise RuntimeError("Local password readiness failed.")
    login = http.post(
        API + "/auth/v1/token?grant_type=password",
        headers={
            "apikey": status["ANON_KEY"],
        },
        json={"email": user["email"], "password": password},
    )
    if login.status_code != 200:
        raise RuntimeError("Local password login failed.")
    user["token"] = login.json()["access_token"]

env = os.environ.copy()
for key in list(env):
    if key.startswith(("SUPABASE_", "VITE_SUPABASE_", "OPENAI_")):
        env.pop(key)
env.update(
    {
        "PYTHON_DOTENV_DISABLED": "1",
        "SUPABASE_URL": API,
        "SUPABASE_PUBLISHABLE_KEY": status["ANON_KEY"],
        "VITE_SUPABASE_URL": API,
        "VITE_SUPABASE_PUBLISHABLE_KEY": status["ANON_KEY"],
        "VITE_API_PROXY_TARGET": BACKEND,
        "VITE_API_BASE_URL": "",
        "DATABASE_URL": "sqlite:///" + (ROOT / ".tmp/leader-qa.sqlite3").as_posix(),
        "DJANGO_SETTINGS_MODULE": "CastraVision.settings",
    }
)
runtime = ROOT / ".tmp/leader-runtime"
runtime.mkdir(parents=True, exist_ok=True)
subprocess.run(
    [sys.executable, "manage.py", "migrate", "--noinput"],
    cwd=ROOT,
    env=env,
    stdout=subprocess.DEVNULL,
    check=True,
)
processes = []
for command, cwd, name in [
    ([sys.executable, "manage.py", "runserver", "127.0.0.1:59800", "--noreload"], ROOT, "backend"),
    (
        [
            "node",
            "node_modules/vite/bin/vite.js",
            "--host",
            "127.0.0.1",
            "--port",
            "59300",
            "--strictPort",
        ],
        ROOT / "CastraView",
        "frontend",
    ),
]:
    log = (runtime / (name + ".log")).open("w", encoding="utf-8")
    processes.append(
        subprocess.Popen(
            command,
            cwd=cwd,
            env=env,
            stdout=log,
            stderr=log,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
    )
for _ in range(60):
    try:
        if (
            http.get(BACKEND + "/api/auth/session/").status_code == 401
            and http.get(WEB).status_code == 200
        ):
            break
    except httpx.RequestError:
        pass
    time.sleep(1)
else:
    raise RuntimeError("Local runtime did not become ready; inspect sanitized local logs.")

evidence = []


def call(name, command, payload=None, expected=200, ws=None):
    response = http.post(
        BACKEND + "/api/leader/" + command + "/",
        headers={
            "Authorization": "Bearer " + users[name]["token"],
            "X-Workspace-ID": ws or workspace,
        },
        json=payload or {},
    )
    if response.status_code != expected:
        code = response.json().get("error", {}).get("code", "unknown")
        raise AssertionError(
            f"{command}: HTTP {response.status_code}, code {code}, expected {expected}"
        )
    return response.json()


try:
    context = call("leader", "context")
    assert context["role"] == "manager" and len(context["teams"]) == 1
    evidence.append(
        "PASS: real Auth password login, Django JWT verification and assigned Team context"
    )
    create = {
        "teamId": team,
        "name": "HTTP Persistent Campaign",
        "budget": 1000,
        "currency": "USD",
        "channels": ["Meta", "Google Ads"],
        "requestId": str(uuid4()),
    }
    with ThreadPoolExecutor(max_workers=2) as pool:
        campaigns = list(pool.map(lambda _: call("leader", "create_campaign", create), range(2)))
    campaign = campaigns[0]
    assert campaigns[1]["id"] == campaign["id"]
    assert call("leader", "campaigns")["total"] == 1
    evidence.append("PASS: concurrent create persisted exactly one campaign")
    call("outsider", "campaign", {"id": campaign["id"]}, expected=403)
    call("employee", "create_campaign", {**create, "requestId": str(uuid4())}, expected=403)
    evidence.append("PASS: cross-workspace and Employee campaign creation rejected")
    content = {
        "campaignId": campaign["id"],
        "kind": "ad_content",
        "title": "Employee HTTP content",
        "payload": {
            "hook": "Real employee content hook",
            "headline": "Original headline",
            "body": "An actual persisted body",
            "cta": "Learn more",
            "channel": "Meta",
        },
        "requestId": str(uuid4()),
        "submit": True,
    }
    proposal = call("employee", "submit", content)
    decision = {
        "id": proposal["id"],
        "decision": "approve",
        "expectedVersion": 1,
        "requestId": str(uuid4()),
    }
    with ThreadPoolExecutor(max_workers=2) as pool:
        decisions = list(pool.map(lambda _: call("leader", "decide", decision), range(2)))
    assert all(x["status"] == "approved" for x in decisions)
    detail = call("employee", "proposal", {"id": proposal["id"]})
    assert len(detail["history"]) == 2 and detail["status"] == "approved"
    assert call("employee", "notifications")["unreadCount"] == 1
    evidence.append(
        "PASS: Employee submission, concurrent Leader approval, "
        "immutable revision and recipient notification"
    )
    csv = (
        b"channel,period,spend,clicks,impressions,conversions,revenue\n"
        b"Meta,2026-11-18,100,20,1000,2,250\n"
    )

    def import_csv(_):
        imported = http.post(
            BACKEND + "/api/campaign-imports/upload/",
            headers={
                "Authorization": "Bearer " + users["leader"]["token"],
                "X-Workspace-ID": workspace,
            },
            data={"mode": "commit", "campaign_id": campaign["id"]},
            files={"file": ("qa.csv", csv, "text/csv")},
        )
        assert imported.status_code == 201
        return imported.json()["import_id"]

    with ThreadPoolExecutor(max_workers=2) as pool:
        batches = list(pool.map(import_csv, range(2)))
    assert batches[0] == batches[1]
    data = call("leader", "analytics", {"campaignId": campaign["id"]})
    assert data["rowCount"] == 1 and data["spend"] == 100 and data["roas"] == 2.5
    evidence.append(
        "PASS: CSV commit, deterministic duplicate prevention and weighted real metrics"
    )
    budget = call(
        "employee",
        "submit",
        {
            "campaignId": campaign["id"],
            "kind": "budget_proposal",
            "title": "Escalated budget",
            "requestId": str(uuid4()),
            "submit": True,
            "payload": {
                "totalBudget": 1000,
                "allocations": [
                    {"channel": "Meta", "current": 500, "proposed": 700},
                    {"channel": "Google Ads", "current": 500, "proposed": 300},
                ],
            },
        },
    )
    request = {
        "id": budget["id"],
        "decision": "approve",
        "expectedVersion": 1,
        "requestId": str(uuid4()),
    }
    call("leader", "decide", request, expected=403)
    call(
        "leader",
        "decide",
        {**request, "decision": "escalate", "note": "Requires Marketing Manager"},
    )
    call("mm", "decide", {**request, "expectedVersion": 2, "requestId": str(uuid4())})
    assert call("leader", "campaign", {"id": campaign["id"]})["allocations"]["Meta"] == 700
    evidence.append(
        "PASS: server 20% threshold, escalation, "
        "Marketing Manager resolution and authoritative baseline update"
    )
    book = Workbook()
    book.active.append(
        ["channel", "period", "spend", "clicks", "impressions", "conversions", "revenue"]
    )
    book.active.append(["Google Ads", "2026-11-18", 50, 10, 100, 2, 200])
    stream = BytesIO()
    book.save(stream)
    book.close()
    headers = {"Authorization": "Bearer " + users["leader"]["token"], "X-Workspace-ID": workspace}
    for mode, expected in [("preview", 200), ("commit", 201)]:
        response = http.post(
            BACKEND + "/api/campaign-imports/upload/",
            headers=headers,
            data={"mode": mode, "campaign_id": campaign["id"]},
            files={"file": ("qa.xlsx", stream.getvalue())},
        )
        assert response.status_code == expected
        if mode == "preview":
            assert call("leader", "analytics", {"campaignId": campaign["id"]})["rowCount"] == 1
    history = call("leader", "imports", {"campaignId": campaign["id"]})
    assert history["total"] == 2 and sum(x["row_count"] for x in history["items"]) == 2
    assert call("leader", "analytics", {"campaignId": campaign["id"]})["roas"] == 3
    evidence.append(
        "PASS: XLSX preview is read-only, commit persists, exact batch history and ROAS"
    )
    pause = call(
        "leader",
        "submit",
        {
            "campaignId": campaign["id"],
            "kind": "pause_variant",
            "title": "Review actual approved variant",
            "requestId": str(uuid4()),
            "submit": True,
            "payload": {
                "variantId": proposal["target_id"],
                "reason": "Evaluate campaign performance",
            },
        },
    )
    assert pause["status"] == "pending"
    evidence.append("PASS: Pause Variant creates a pending governance request without ad dispatch")
    generation_request = str(uuid4())
    generated = call(
        "leader",
        "generate",
        {
            "campaignId": campaign["id"],
            "objective": "Increase conversions",
            "audience": "Young athletes",
            "requestId": generation_request,
        },
    )
    assert generated["payload"]["provider"] in ("openai", "deterministic-fallback")
    assert generated["status"] == "draft"
    retried = call(
        "leader",
        "generate",
        {
            "campaignId": campaign["id"],
            "objective": "Increase conversions",
            "audience": "Young athletes",
            "requestId": generation_request,
        },
    )
    assert retried["id"] == generated["id"]
    evidence.append(
        "PASS: strategy generation persisted as draft; provider=" + generated["payload"]["provider"]
    )
    call(
        "leader",
        "decide",
        {
            "id": generated["id"],
            "decision": "submit",
            "expectedVersion": 1,
            "requestId": str(uuid4()),
        },
    )
    call(
        "mm",
        "decide",
        {
            "id": generated["id"],
            "decision": "approve",
            "expectedVersion": 2,
            "requestId": str(uuid4()),
        },
    )
    template = call(
        "leader",
        "submit",
        {
            **content,
            "title": "Actual strategy-linked draft",
            "requestId": str(uuid4()),
            "submit": False,
            "payload": {**content["payload"], "source": "template", "strategyId": generated["id"]},
        },
    )
    target = http.get(
        API + "/rest/v1/ad_contents",
        headers={
            "apikey": status["ANON_KEY"],
            "Authorization": "Bearer " + users["leader"]["token"],
        },
        params={"id": "eq." + template["target_id"], "select": "strategy_id,status"},
    )
    assert target.status_code == 200
    assert target.json() == [{"strategy_id": generated["target_id"], "status": "draft"}]
    evidence.append(
        "PASS: approved strategy-to-content FK and draft status match persisted entities"
    )
    own_strategy = call(
        "mm",
        "submit",
        {
            "campaignId": campaign["id"],
            "kind": "strategy",
            "title": "MM authorized self-review",
            "requestId": str(uuid4()),
            "submit": True,
            "payload": generated["payload"],
        },
    )
    approved = call(
        "mm",
        "decide",
        {
            "id": own_strategy["id"],
            "decision": "approve",
            "expectedVersion": 1,
            "requestId": str(uuid4()),
        },
    )
    assert approved["status"] == "approved" and approved["reviewer_id"] == users["mm"]["id"]
    evidence.append(
        "PASS: Marketing Manager strategy self-approval exception is preserved and logged"
    )
    boundary = call(
        "employee",
        "submit",
        {
            "campaignId": campaign["id"],
            "kind": "budget_proposal",
            "title": "Exact 20 percent boundary",
            "requestId": str(uuid4()),
            "submit": True,
            "payload": {
                "totalBudget": 1000,
                "allocations": [
                    {"channel": "Meta", "current": 700, "proposed": 760},
                    {"channel": "Google Ads", "current": 300, "proposed": 240},
                ],
            },
        },
    )
    approved = call(
        "leader",
        "decide",
        {
            "id": boundary["id"],
            "decision": "approve",
            "expectedVersion": 1,
            "requestId": str(uuid4()),
        },
    )
    assert approved["status"] == "approved"
    evidence.append("PASS: exactly 20 percent is within Leader authority for another author")
    conflict = call(
        "employee",
        "submit",
        {**content, "title": "Conflicting decision race", "requestId": str(uuid4())},
    )

    def conflicting_decision(decision):
        response = http.post(
            BACKEND + "/api/leader/decide/",
            headers={
                "Authorization": "Bearer " + users["leader"]["token"],
                "X-Workspace-ID": workspace,
            },
            json={
                "id": conflict["id"],
                "decision": decision,
                "expectedVersion": 1,
                "requestId": str(uuid4()),
                "note": "Concurrent review decision",
            },
        )
        return response.status_code

    with ThreadPoolExecutor(max_workers=2) as pool:
        statuses = list(pool.map(conflicting_decision, ["approve", "reject"]))
    assert sorted(statuses) == [200, 409]
    final = call("employee", "proposal", {"id": conflict["id"]})
    assert final["version"] == 2 and len(final["history"]) == 2
    evidence.append("PASS: conflicting concurrent approve/reject produces one winner and one 409")

    def create_paging_campaign(index):
        return call(
            "leader",
            "create_campaign",
            {**create, "name": f"Paging QA {index:02}", "requestId": str(uuid4())},
        )

    with ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(create_paging_campaign, range(12)))
    first = call("leader", "campaigns", {"search": "Paging QA", "status": "draft", "limit": 10})
    second = call("leader", "campaigns", {"search": "Paging QA", "limit": 10, "offset": 10})
    assert first["total"] == second["total"] == 12
    assert len(first["items"]) == 10 and len(second["items"]) == 2
    assert not {x["id"] for x in first["items"]} & {x["id"] for x in second["items"]}
    evidence.append(
        "PASS: server search/status filters and pagination return 10+2 unique campaigns"
    )
    (ROOT / "docs/UI/audits/2026-11-18/leader-local-http-evidence.json").write_text(
        json.dumps({"target": API, "checks": evidence}, indent=2), encoding="utf-8"
    )
    print("\n".join(evidence), flush=True)
    (runtime / "processes.json").write_text(
        json.dumps([p.pid for p in processes]), encoding="utf-8"
    )
    if len(sys.argv) > 1 and sys.argv[1] == "serve":

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *_):
                pass

            def do_GET(self):
                origin = self.headers.get("Origin")
                name = self.path.removeprefix("/fixture/")
                if origin != WEB or name not in users:
                    self.send_error(403)
                    return
                value = json.dumps({"email": users[name]["email"], "password": password}).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", WEB)
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(value)

        print(
            "Disposable browser fixture bridge ready on loopback; credentials withheld.", flush=True
        )
        HTTPServer(("127.0.0.1", 59801), Handler).serve_forever()
finally:
    for process in processes:
        process.terminate()
    http.close()
