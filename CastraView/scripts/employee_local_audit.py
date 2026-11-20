"""Employee audit: disposable local users only; no env files or hosted requests."""

import json
import os
import subprocess
import sys
import threading
import types
from pathlib import Path
from socketserver import ThreadingMixIn
from uuid import uuid4
from wsgiref.simple_server import WSGIRequestHandler, WSGIServer, make_server

# Reuse the guarded fixture definitions without executing that script's CLI
# entry point or overwriting the independent System Admin evidence report.
fixture_source = Path(__file__).with_name("platform_local_harness.py")
fixture_definitions, separator, _ = fixture_source.read_text(encoding="utf-8").partition(
    "\ntry:\n    summary = run()"
)
if not separator:
    raise SystemExit("Local fixture interface changed; refusing implicit execution.")
local = types.ModuleType("employee_audit_fixture")
local.__file__ = str(fixture_source)
exec(compile(fixture_definitions, str(fixture_source), "exec"), local.__dict__)
local.summary = local.run()
from django.core.management import call_command  # noqa: E402 - configure local Django first
from django.core.wsgi import get_wsgi_application  # noqa: E402

call_command("migrate", verbosity=0, interactive=False)

workspace = local.summary["workspace"]
results = []


def record(name, passed):
    results.append({"case": name, "pass": bool(passed)})


def api(label, command, data=None):
    return local.call(
        local.users[label]["session"]["access_token"],
        "leader/" + command + "/",
        "post",
        data or {},
        workspace,
    )


def require(response, label):
    if response.status_code not in (200, 201):
        raise RuntimeError(
            label
            + " failed with HTTP "
            + str(response.status_code)
            + " / "
            + response.json().get("error", {}).get("code", "unknown")
        )
    return response.json()


manager = local.users["manager"]["session"]["access_token"]
team = require(
    local.call(manager, "workspace/teams/", "post", {"name": "Employee Audit Team"}, workspace),
    "team",
)["id"]
for label, role in [("employee", "member"), ("leader", "manager")]:
    require(
        local.call(
            manager,
            "workspace/members/" + local.users[label]["id"] + "/",
            "patch",
            {"role": role, "teamIds": [team]},
            workspace,
        ),
        "assignment",
    )
profile = {
    "business_name": "Employee Audit Business",
    "industry": "Retail",
    "business_size": "Small",
    "target_customers": "Adult runners",
    "product_service": "Running shoes",
    "primary_goal": "Grow sales",
    "preferred_channels": ["Meta"],
    "monthly_budget": 1000,
    "currency": "USD",
}
require(local.call(manager, "business-profile/", "put", profile, workspace), "profile")
campaign = require(
    api(
        "leader",
        "create_campaign",
        {
            "teamId": team,
            "name": "Employee Audit Campaign",
            "budget": 1000,
            "currency": "USD",
            "channels": ["Meta"],
            "requestId": str(uuid4()),
        },
    ),
    "campaign",
)
record(
    "Employee verified session/membership",
    any(
        m["workspace_id"] == workspace and m["role"] == "member"
        for m in local.call(
            local.users["employee"]["session"]["access_token"], "auth/session/"
        ).json()["memberships"]
    ),
)
record("Employee context", require(api("employee", "context"), "context")["role"] == "member")
record(
    "Employee campaign read",
    any(
        x["id"] == campaign["id"]
        for x in require(api("employee", "campaigns"), "campaign read")["items"]
    ),
)
record(
    "Employee campaign create denied",
    api(
        "employee",
        "create_campaign",
        {
            "teamId": team,
            "name": "Forbidden",
            "budget": 100,
            "currency": "USD",
            "channels": ["Meta"],
            "requestId": str(uuid4()),
        },
    ).status_code
    == 403,
)
payload = {
    "hook": "A real employee content hook",
    "headline": "Employee headline",
    "body": "Employee body",
    "cta": "Learn more",
    "channel": "Meta",
    "source": "manual",
}
draft = require(
    api(
        "employee",
        "submit",
        {
            "campaignId": campaign["id"],
            "kind": "ad_content",
            "title": "Employee Audit Draft",
            "payload": payload,
            "requestId": str(uuid4()),
            "submit": False,
        },
    ),
    "draft",
)
record(
    "Draft persisted",
    require(api("employee", "proposal", {"id": draft["id"]}), "draft read")["status"] == "draft",
)
edited = require(
    api(
        "employee",
        "revise",
        {
            "id": draft["id"],
            "expectedVersion": draft["version"],
            "payload": {**payload, "headline": "Employee revised"},
            "note": "Employee audit revision",
        },
    ),
    "edit",
)
record(
    "Edit persisted",
    require(api("employee", "proposal", {"id": draft["id"]}), "edit read")["payload"]["headline"]
    == "Employee revised",
)
submitted = require(
    api(
        "employee",
        "decide",
        {
            "id": draft["id"],
            "expectedVersion": edited["version"],
            "decision": "submit",
            "requestId": str(uuid4()),
        },
    ),
    "submit",
)
record("Submit persisted", submitted["status"] == "pending")
record(
    "Employee approve denied",
    api(
        "employee",
        "decide",
        {
            "id": draft["id"],
            "expectedVersion": submitted["version"],
            "decision": "approve",
            "requestId": str(uuid4()),
        },
    ).status_code
    == 403,
)
revision = require(
    api(
        "leader",
        "decide",
        {
            "id": draft["id"],
            "expectedVersion": submitted["version"],
            "decision": "revision",
            "note": "Please revise headline",
            "requestId": str(uuid4()),
        },
    ),
    "request revision",
)
detail = require(api("employee", "proposal", {"id": draft["id"]}), "feedback")
record(
    "Feedback and history readable",
    detail["status"] == "revision_requested" and len(detail["history"]) >= 3,
)
resubmitted = require(
    api(
        "employee",
        "decide",
        {
            "id": draft["id"],
            "expectedVersion": revision["version"],
            "decision": "submit",
            "requestId": str(uuid4()),
        },
    ),
    "resubmit",
)
record("Resubmit persisted", resubmitted["status"] == "pending")
approved = require(
    api(
        "leader",
        "decide",
        {
            "id": draft["id"],
            "expectedVersion": resubmitted["version"],
            "decision": "approve",
            "requestId": str(uuid4()),
        },
    ),
    "approve",
)
record(
    "Employee approved status readable",
    require(api("employee", "proposal", {"id": draft["id"]}), "approved read")["status"]
    == "approved",
)
record(
    "Proposal search/status filter",
    require(
        api(
            "employee",
            "proposals",
            {
                "mine": True,
                "search": "Employee Audit Draft",
                "status": "approved",
                "kind": "ad_content",
                "limit": 10,
                "offset": 0,
            },
        ),
        "filters",
    )["total"]
    == 1,
)
notifications = require(api("employee", "notifications"), "notifications")
record("Employee real notifications", len(notifications["items"]) > 0)
if notifications["items"]:
    notification = notifications["items"][0]
    require(api("employee", "read_notification", {"id": notification["id"]}), "read notification")
    record(
        "Notification read persisted",
        any(
            n["id"] == notification["id"] and n["is_read"]
            for n in require(api("employee", "notifications"), "notification reread")["items"]
        ),
    )
strategy_response = api(
    "employee",
    "generate",
    {
        "campaignId": campaign["id"],
        "objective": "Employee audit sales strategy",
        "audience": "Adult runners",
        "requestId": str(uuid4()),
    },
)
record(
    "Strategy generate persisted",
    strategy_response.status_code == 200
    and require(
        api("employee", "proposal", {"id": strategy_response.json().get("id", str(uuid4()))}),
        "strategy read",
    )["target_type"]
    == "strategy",
)
if strategy_response.status_code == 200:
    record(
        "Strategy provider is explicit",
        strategy_response.json()["payload"].get("provider") == "deterministic-fallback",
    )
    strategy = strategy_response.json()
    template = {**payload, "source": "template", "strategyId": strategy["id"]}
    attempt = api(
        "employee",
        "submit",
        {
            "campaignId": campaign["id"],
            "kind": "ad_content",
            "title": "Unapproved template",
            "payload": template,
            "requestId": str(uuid4()),
            "submit": False,
        },
    )
    record("Unapproved strategy cannot be used as a template", attempt.status_code >= 400)
    pending_strategy = require(
        api(
            "employee",
            "decide",
            {
                "id": strategy["id"],
                "expectedVersion": strategy["version"],
                "decision": "submit",
                "requestId": str(uuid4()),
            },
        ),
        "submit strategy",
    )
    approved_strategy = require(
        api(
            "leader",
            "decide",
            {
                "id": strategy["id"],
                "expectedVersion": pending_strategy["version"],
                "decision": "approve",
                "requestId": str(uuid4()),
            },
        ),
        "approve strategy",
    )
    template_request = str(uuid4())
    created_template = require(
        api(
            "employee",
            "submit",
            {
                "campaignId": campaign["id"],
                "kind": "ad_content",
                "title": "Approved Strategy Template",
                "payload": template,
                "requestId": template_request,
                "submit": False,
            },
        ),
        "save template",
    )
    template_detail = require(
        api("employee", "proposal", {"id": created_template["id"]}), "read template"
    )
    record(
        "Approved strategy template persists its source reference",
        template_detail["payload"]["strategyId"] == strategy["id"]
        and template_detail["payload"]["source"] == "template",
    )
    duplicate_template = require(
        api(
            "employee",
            "submit",
            {
                "campaignId": campaign["id"],
                "kind": "ad_content",
                "title": "Approved Strategy Template",
                "payload": template,
                "requestId": template_request,
                "submit": False,
            },
        ),
        "duplicate template",
    )
    record(
        "Duplicate Employee draft request is idempotent",
        duplicate_template["id"] == created_template["id"],
    )
    stale = api(
        "employee",
        "revise",
        {
            "id": created_template["id"],
            "expectedVersion": 0,
            "payload": template,
            "note": "Stale client",
        },
    )
    record(
        "Stale Employee draft revision is rejected",
        stale.status_code == 409 and stale.json().get("error", {}).get("code") == "STALE_VERSION",
    )

other_team = require(
    local.call(
        manager, "workspace/teams/", "post", {"name": "Other Employee Audit Team"}, workspace
    ),
    "other team",
)["id"]
other_campaign = require(
    api(
        "manager",
        "create_campaign",
        {
            "teamId": other_team,
            "name": "Other Team Private Campaign",
            "budget": 1000,
            "currency": "USD",
            "channels": ["Meta"],
            "requestId": str(uuid4()),
        },
    ),
    "other campaign",
)
record(
    "Other-Team campaign detail denied",
    api("employee", "campaign", {"id": other_campaign["id"]}).status_code in (403, 404),
)
foreign_rest = local.http.get(
    local.URL + "/rest/v1/campaigns",
    headers={
        "apikey": local.PUBLIC,
        "Authorization": "Bearer " + local.users["employee"]["session"]["access_token"],
    },
    params={"id": "eq." + other_campaign["id"], "select": "id"},
)
record(
    "Other-Team campaign hidden by direct REST RLS",
    foreign_rest.is_success and foreign_rest.json() == [],
)
record("Role injection rejected", api("employee", "context", {"role": "admin"}).status_code == 400)
require(
    local.call(
        manager,
        "workspace/members/" + local.users["employee"]["id"] + "/",
        "patch",
        {"role": "member", "teamIds": []},
        workspace,
    ),
    "revoke team",
)
record(
    "Old Employee JWT loses campaign access after Team removal",
    api("employee", "campaign", {"id": campaign["id"]}).status_code in (403, 404),
)
require(
    local.call(
        manager,
        "workspace/members/" + local.users["employee"]["id"] + "/",
        "patch",
        {"role": "member", "teamIds": [team]},
        workspace,
    ),
    "restore team",
)
record(
    "Employee business profile write denied",
    local.call(
        local.users["employee"]["session"]["access_token"],
        "business-profile/",
        "put",
        profile,
        workspace,
    ).status_code
    == 403,
)
record(
    "Employee personnel management denied",
    local.call(
        local.users["employee"]["session"]["access_token"],
        "workspace/personnel/",
        workspace=workspace,
    ).status_code
    == 403,
)
record(
    "Employee report export denied",
    local.call(
        local.users["employee"]["session"]["access_token"],
        "manager/reports/",
        "post",
        {},
        workspace,
    ).status_code
    == 403,
)


def task_api(label, command, data=None):
    return local.call(
        local.users[label]["session"]["access_token"],
        "employee/" + command + "/",
        "post",
        data or {},
        workspace,
    )


task_input = {
    "campaignId": campaign["id"],
    "assigneeId": local.users["employee"]["id"],
    "title": "Employee Assigned Task",
    "description": "Write campaign copy and link your proposal.",
    "dueAt": None,
    "requestId": str(uuid4()),
}
assigned_task = require(task_api("leader", "create", task_input), "Leader assigns Employee task")
record(
    "Leader assignment persisted with real assignee and optional deadline",
    assigned_task["assignee_id"] == local.users["employee"]["id"]
    and assigned_task["due_at"] is None,
)
record(
    "Duplicate task create is idempotent",
    require(task_api("leader", "create", task_input), "duplicate task")["id"]
    == assigned_task["id"],
)
record(
    "Employee cannot self-assign tasks",
    task_api("employee", "create", {**task_input, "requestId": str(uuid4())}).status_code == 403,
)
record(
    "Employee cannot enumerate task assignees",
    task_api("employee", "candidates", {"campaignId": campaign["id"]}).status_code == 403,
)
record(
    "Task payload cannot override actor",
    task_api(
        "leader", "create", {**task_input, "assigned_by": local.users["employee"]["id"]}
    ).status_code
    == 400,
)
record(
    "Employee task search and status use actual rows",
    require(
        task_api("employee", "list", {"search": "Employee Assigned", "status": "todo"}), "task list"
    )["total"]
    == 1,
)
working_task = require(
    task_api(
        "employee",
        "update",
        {
            "id": assigned_task["id"],
            "status": "in_progress",
            "expectedVersion": 1,
            "proposalId": created_template["id"],
        },
    ),
    "Employee links own proposal",
)
record(
    "Employee links own same-campaign proposal",
    working_task["proposal_id"] == created_template["id"],
)
record(
    "Stale task version denied by real API",
    task_api(
        "employee",
        "update",
        {"id": assigned_task["id"], "status": "completed", "expectedVersion": 1},
    ).status_code
    == 409,
)
done_task = require(
    task_api(
        "employee",
        "update",
        {
            "id": assigned_task["id"],
            "status": "completed",
            "expectedVersion": working_task["version"],
        },
    ),
    "complete operational task",
)
record(
    "Operational completion does not approve proposal",
    require(api("employee", "proposal", {"id": created_template["id"]}), "linked draft")["status"]
    == "draft"
    and require(task_api("employee", "summary"), "task summary")["completed"] == 1,
)
require(
    task_api(
        "employee",
        "update",
        {
            "id": assigned_task["id"],
            "status": "in_progress",
            "expectedVersion": done_task["version"],
        },
    ),
    "reopen task for UI",
)
local.make_user("coworker")
invite = local.rpc(
    manager,
    "membership_invite",
    {"p_workspace_id": workspace, "p_email": local.users["coworker"]["email"], "p_role": "member"},
)
local.rpc(
    local.users["coworker"]["session"]["access_token"],
    "membership_accept_invitation",
    {"p_invitation_id": invite["id"]},
)
require(
    local.call(
        manager,
        "workspace/members/" + local.users["coworker"]["id"] + "/",
        "patch",
        {"role": "member", "teamIds": [team, other_team]},
        workspace,
    ),
    "assign coworker Teams",
)
record(
    "Same-Team coworker cannot read task through API",
    task_api("coworker", "task", {"id": assigned_task["id"]}).status_code == 404,
)
coworker_rest = local.http.get(
    local.URL + "/rest/v1/workspace_tasks",
    headers={
        "apikey": local.PUBLIC,
        "Authorization": "Bearer " + local.users["coworker"]["session"]["access_token"],
    },
    params={"id": "eq." + assigned_task["id"], "select": "id"},
)
record(
    "Same-Team coworker direct REST task RLS is empty",
    coworker_rest.is_success and coworker_rest.json() == [],
)
other_task = require(
    task_api(
        "manager",
        "create",
        {
            **task_input,
            "campaignId": other_campaign["id"],
            "assigneeId": local.users["coworker"]["id"],
            "title": "Other Team task",
            "requestId": str(uuid4()),
        },
    ),
    "MM assigns across workspace Teams",
)
record(
    "Leader cannot access another Team task",
    task_api("leader", "task", {"id": other_task["id"]}).status_code == 404,
)
record(
    "Leader cannot create in another Team",
    task_api(
        "leader",
        "create",
        {
            **task_input,
            "campaignId": other_campaign["id"],
            "assigneeId": local.users["coworker"]["id"],
            "requestId": str(uuid4()),
        },
    ).status_code
    == 403,
)
candidate_rows = require(
    task_api("leader", "candidates", {"campaignId": campaign["id"]}), "task candidates"
)["items"]
record(
    "Task candidates expose only scoped names and IDs",
    candidate_rows and all(set(row) == {"id", "name"} for row in candidate_rows),
)
require(
    local.call(
        manager,
        "workspace/members/" + local.users["employee"]["id"] + "/",
        "patch",
        {"role": "member", "teamIds": []},
        workspace,
    ),
    "remove task Team",
)
record(
    "Old JWT loses task access after Team removal",
    task_api("employee", "task", {"id": assigned_task["id"]}).status_code == 404,
)
require(
    local.call(
        manager,
        "workspace/members/" + local.users["employee"]["id"] + "/",
        "patch",
        {"role": "member", "teamIds": [team]},
        workspace,
    ),
    "restore task Team",
)
operator_token = local.users["system"]["session"]["access_token"]
company_state = require(
    local.call(operator_token, "platform/companies/" + workspace + "/"), "company pre-suspension"
)
suspended = require(
    local.call(
        operator_token,
        "platform/companies/" + workspace + "/",
        "patch",
        {"version": company_state["version"], "status": "Inactive"},
    ),
    "suspend task tenant",
)
record(
    "Old JWT task API blocked while tenant Inactive",
    task_api("employee", "summary").status_code == 403,
)
inactive_rest = local.http.get(
    local.URL + "/rest/v1/workspace_tasks",
    headers={
        "apikey": local.PUBLIC,
        "Authorization": "Bearer " + local.users["employee"]["session"]["access_token"],
    },
    params={"select": "id", "workspace_id": "eq." + workspace},
)
record(
    "Old JWT task REST blocked while tenant Inactive",
    inactive_rest.is_success and inactive_rest.json() == [],
)
require(
    local.call(
        operator_token,
        "platform/companies/" + workspace + "/",
        "patch",
        {"version": suspended["version"], "status": "Active"},
    ),
    "reactivate task tenant",
)


brand = require(
    local.call(manager, "employee/brand-safety-rules/", workspace=workspace), "MM reads rules"
)
brand_input = {
    **brand["rules"],
    "bannedTerms": ["TUYỆT ĐỐI"],
    "requiredTerms": ["Điều kiện áp dụng"],
}
brand_saved = require(
    local.call(
        manager,
        "employee/brand-safety-rules/",
        "patch",
        {"rules": brand_input, "expectedVersion": brand["version"]},
        workspace,
    ),
    "MM saves rules",
)
record(
    "MM rules persist and server revision advances",
    brand_saved["rules"] == brand_input and brand_saved["version"] != brand["version"],
)
record(
    "Stale rules update rejected",
    local.call(
        manager,
        "employee/brand-safety-rules/",
        "patch",
        {"rules": brand_input, "expectedVersion": brand["version"]},
        workspace,
    ).status_code
    == 409,
)
for label in ("employee", "leader"):
    record(
        label + " cannot write brand rules",
        local.call(
            local.users[label]["session"]["access_token"],
            "employee/brand-safety-rules/",
            "patch",
            {"rules": brand_input, "expectedVersion": brand_saved["version"]},
            workspace,
        ).status_code
        == 403,
    )
employee_brand = require(
    local.call(
        local.users["employee"]["session"]["access_token"],
        "employee/brand-safety-rules/",
        workspace=workspace,
    ),
    "Employee reads company rules",
)
record(
    "Employee reads actual MM configuration without edit rights",
    employee_brand["rules"] == brand_input and employee_brand["canEdit"] is False,
)
check_input = {
    "fields": {
        "headline": "Guaranteed results TUYỆT ĐỐI",
        "body": "Contact review.fixture@example.test +84 912 345 678",
    },
    "expectedVersion": brand_saved["version"],
}
brand_result = require(
    local.call(
        local.users["employee"]["session"]["access_token"],
        "employee/brand-safety/",
        "post",
        check_input,
        workspace,
    ),
    "Employee checks content",
)
record(
    "Real provider detects custom phrase, missing phrase, claims and personal data",
    {x["code"] for x in brand_result["findings"]}
    == {"BANNED_TERM", "MISSING_REQUIRED_TERM", "ABSOLUTE_CLAIM", "PERSONAL_DATA"},
)
record(
    "Provider response does not echo detected personal data or approve content",
    "review.fixture" not in json.dumps(brand_result)
    and "912" not in json.dumps(brand_result)
    and "score" not in brand_result
    and "approved" not in brand_result,
)
record(
    "Stale rule revision cannot produce a current result",
    local.call(
        local.users["employee"]["session"]["access_token"],
        "employee/brand-safety/",
        "post",
        {**check_input, "expectedVersion": brand["version"]},
        workspace,
    ).status_code
    == 409,
)
clean_result = require(
    local.call(
        local.users["employee"]["session"]["access_token"],
        "employee/brand-safety/",
        "post",
        {
            "fields": {"body": "Thông điệp thông thường. Điều kiện áp dụng."},
            "expectedVersion": brand_saved["version"],
        },
        workspace,
    ),
    "Clean rule check",
)
record(
    "Clean content has no findings without claiming legal safety",
    clean_result["status"] == "no_findings" and clean_result["findings"] == [],
)
record(
    "Employee cannot read rules of an unassigned workspace",
    local.call(
        local.users["employee"]["session"]["access_token"],
        "employee/brand-safety-rules/",
        workspace=str(uuid4()),
    ).status_code
    == 403,
)
company_state = require(
    local.call(operator_token, "platform/companies/" + workspace + "/"), "brand tenant state"
)
brand_suspended = require(
    local.call(
        operator_token,
        "platform/companies/" + workspace + "/",
        "patch",
        {"version": company_state["version"], "status": "Inactive"},
    ),
    "suspend brand tenant",
)
record(
    "Old JWT cannot use brand check on Inactive tenant",
    local.call(
        local.users["employee"]["session"]["access_token"],
        "employee/brand-safety/",
        "post",
        check_input,
        workspace,
    ).status_code
    == 403,
)
require(
    local.call(
        operator_token,
        "platform/companies/" + workspace + "/",
        "patch",
        {"version": brand_suspended["version"], "status": "Active"},
    ),
    "reactivate brand tenant",
)


class Quiet(WSGIRequestHandler):
    def log_message(self, *_args):
        pass

    def handle(self):
        try:
            super().handle()
        except ConnectionResetError:
            self.server.cancelled_connections += 1


class AuditServer(ThreadingMixIn, WSGIServer):
    daemon_threads = True
    request_queue_size = 32


server = make_server(
    "127.0.0.1", 61480, get_wsgi_application(), server_class=AuditServer, handler_class=Quiet
)
server.cancelled_connections = 0
threading.Thread(target=server.serve_forever, daemon=True).start()
env = {
    **{
        key: value
        for key, value in os.environ.items()
        if key
        not in (
            "SUPABASE_SERVICE_ROLE_KEY",
            "SUPABASE_SECRET_KEY",
            "DATABASE_URL",
        )
    },
    "EMPLOYEE_AUDIT": "1",
    "EMPLOYEE_EMAIL": local.users["employee"]["email"],
    "EMPLOYEE_PASSWORD": local.users["employee"]["password"],
    "EMPLOYEE_WORKSPACE": workspace,
    "EMPLOYEE_USER_ID": local.users["employee"]["id"],
    "LEADER_EMAIL": local.users["leader"]["email"],
    "LEADER_PASSWORD": local.users["leader"]["password"],
    "VITE_SUPABASE_URL": local.URL,
    "VITE_SUPABASE_PUBLISHABLE_KEY": local.PUBLIC,
    "VITE_API_BASE_URL": "http://127.0.0.1:61480",
}
if "--browser" in sys.argv:
    from http.server import BaseHTTPRequestHandler, HTTPServer
    from urllib.parse import parse_qs, urlparse

    class FixtureBridge(BaseHTTPRequestHandler):
        def log_message(self, *_args):
            pass

        def do_GET(self):
            parsed = urlparse(self.path)
            role = parse_qs(parsed.query).get("role", ["employee"])[0]
            if (
                self.headers.get("Origin") != "http://127.0.0.1:61400"
                or parsed.path != "/fixture"
                or role not in ("employee", "leader", "manager", "coworker")
            ):
                self.send_error(403)
                return
            fixture = local.users[role]
            payload = {key: fixture[key] for key in ("email", "password", "id")}
            payload["workspace"] = workspace
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Access-Control-Allow-Origin", "http://127.0.0.1:61400")
            self.end_headers()
            self.wfile.write(json.dumps(payload).encode())

    browser_env = {**env, "BACKEND_CORS_ORIGINS": "http://127.0.0.1:61400"}
    # Django settings were initialized earlier; only the isolated test origin is added.
    from django.conf import settings

    settings.CORS_ALLOWED_ORIGINS = ["http://127.0.0.1:61400"]
    browser_child = subprocess.Popen(
        ["node", "node_modules/vite/bin/vite.js", "--config", "scripts/employee-browser.config.js"],
        cwd=local.ROOT / "CastraView",
        env=browser_env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    bridge = HTTPServer(("127.0.0.1", 61481), FixtureBridge)
    try:
        print("Employee isolated browser ready: UI 61400, API 61480, fixture 61481.", flush=True)
        bridge.serve_forever()
    finally:
        bridge.server_close()
        server.shutdown()
        server.server_close()
        browser_child.terminate()
        browser_child.wait(timeout=10)
    raise SystemExit(0)
try:
    ui_process = subprocess.Popen(
        [
            "node",
            "node_modules/vitest/vitest.mjs",
            "run",
            "--config",
            "scripts/employee-audit.config.js",
        ],
        cwd=local.ROOT / "CastraView",
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
    )
    try:
        stdout, stderr = ui_process.communicate(timeout=300)
    except subprocess.TimeoutExpired:
        subprocess.run(["taskkill", "/PID", str(ui_process.pid), "/T", "/F"], capture_output=True)
        stdout, stderr = ui_process.communicate()
        print("UI integration timed out; not counted as a product pass.")
    ui = subprocess.CompletedProcess([], ui_process.returncode, stdout, stderr)
    # Test reporter output could contain form DOM. Keep only counters and error names.
    record("Employee production UI integration suite", ui.returncode == 0)
    safe_lines = [
        line for line in ui.stdout.splitlines() if "Test Files " in line or "Tests " in line
    ]
    print("\n".join(safe_lines))
    if ui.returncode:
        # No raw DOM/credentials are printed or persisted.
        print("UI suite failed; inspect sanitized per-case evidence, not raw DOM.")
        import re

        print(
            json.dumps(
                {
                    "failureKinds": re.findall(
                        r"(?:Error|TypeError|AssertionError|ReferenceError|TestingLibraryElementError):[^\n<]{0,180}",
                        ui.stdout + ui.stderr,
                    )[:5]
                }
            )
        )
finally:
    server.shutdown()
    server.server_close()
out = local.ROOT / "docs/UI/audits/2026-11-20/employee-remediation-real-local.json"
out.write_text(
    json.dumps(
        {
            "checks": results,
            "workspace": workspace,
            "campaign": campaign["id"],
            "cancelledConnections": server.cancelled_connections,
        },
        indent=2,
    ),
    encoding="utf-8",
)
print(
    json.dumps(
        {
            "checks": len(results),
            "passed": sum(r["pass"] for r in results),
            "failed": [r["case"] for r in results if not r["pass"]],
        }
    )
)
raise SystemExit(any(not row["pass"] for row in results))
