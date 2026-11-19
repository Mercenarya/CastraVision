"""Read-only real JWT smoke checks for the approved hosted MM cutover.

CLI keys and known demo credentials are held in memory; never print them.
No .env reads, user provisioning, data edits or external emails.
"""

import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[2]
REF = "oviqgptccjjdaaqxabwv"
URL = f"https://{REF}.supabase.co"
raw = subprocess.run(
    [
        "npx.cmd",
        "--yes",
        "supabase@2.121.0",
        "projects",
        "api-keys",
        "--project-ref",
        REF,
        "-o",
        "json",
    ],
    cwd=ROOT,
    capture_output=True,
    text=True,
    encoding="utf-8",
    check=True,
)
keys = json.loads(raw.stdout)
if not isinstance(keys, list):
    raise SystemExit("Unexpected CLI key metadata; no values printed")
key = next((item.get("api_key") for item in keys if item.get("name") == "anon"), None)
if not key:
    key = next((item.get("api_key") for item in keys if item.get("type") == "publishable"), None)
if not key:
    raise SystemExit("Publishable/anon key not available; values withheld")
os.environ.update(
    DJANGO_SETTINGS_MODULE="CastraVision.settings",
    SUPABASE_URL=URL,
    SUPABASE_PUBLISHABLE_KEY=key,
    SUPABASE_ANON_KEY=key,
    SUPABASE_SERVICE_ROLE_KEY="",
    SUPABASE_SECRET_KEY="",
    DATABASE_URL="sqlite:///:memory:",
    OPENAI_API_KEY="",
    ALLOWED_HOSTS="testserver,localhost,127.0.0.1",
    PYTHON_DOTENV_DISABLED="1",
)
sys.path.insert(0, str(ROOT))
import django  # noqa: E402

django.setup()
from django.test import Client  # noqa: E402

# The worktree is nested under the original repo; the credential file is outside Git.
credential_file = ROOT.parents[2] / "CastraVision-demo-logins-20261108-d45251.txt"
if not credential_file.exists():
    raise SystemExit("Known demo credential file missing; no credentials requested in chat")
pairs = dict(
    re.findall(
        r"Email: ([^\r\n]+)\r?\nPassword: ([^\r\n]+)",
        credential_file.read_text(encoding="utf-8"),
    )
)
checks = []
client = Client()
for path in ("manager/reports/", "manager/competitors/"):
    checks.append(
        {"case": "anonymous " + path, "pass": client.get("/api/" + path).status_code == 401}
    )

with httpx.Client(timeout=30, transport=httpx.HTTPTransport(retries=2)) as http:
    for label, email, role in (
        ("Marketing Manager", "marketing.manager.demo@castravision.test", "admin"),
        ("Leader", "leader.demo@castravision.test", "manager"),
        ("Employee", "employee.demo@castravision.test", "member"),
    ):
        response = http.post(
            URL + "/auth/v1/token?grant_type=password",
            headers={"apikey": key},
            json={"email": email, "password": pairs[email]},
        )
        if response.status_code != 200:
            checks.append({"case": label + " login", "pass": False, "http": response.status_code})
            continue
        token = response.json()["access_token"]
        headers = {"HTTP_AUTHORIZATION": "Bearer " + token}
        try:
            session = client.get("/api/auth/session/", **headers)
            for _attempt in range(15):
                if session.status_code != 401:
                    break
                time.sleep(1)
                session = client.get("/api/auth/session/", **headers)
            membership = next(
                (row for row in session.json().get("memberships", []) if row["role"] == role), None
            )
            if session.status_code != 200 or not membership:
                checks.append(
                    {
                        "case": label + " verified context",
                        "pass": False,
                        "http": session.status_code,
                    }
                )
                continue
            headers["HTTP_X_WORKSPACE_ID"] = membership["workspace_id"]
            probe = http.post(
                URL + "/rest/v1/rpc/membership_manager_tools_ready",
                headers={"apikey": key, "Authorization": "Bearer " + token},
                json={"p_workspace_id": membership["workspace_id"]},
            )
            checks.append(
                {
                    "case": label + " real JWT capability",
                    "pass": probe.status_code == 200 and probe.json() == (role == "admin"),
                }
            )
            for path in ("manager/reports/", "manager/competitors/"):
                result = client.get("/api/" + path, **headers)
                checks.append(
                    {
                        "case": label + " " + path,
                        "pass": result.status_code == (200 if role == "admin" else 403),
                        "http": result.status_code,
                    }
                )
        finally:
            # Revoke only this smoke-test session, not the user's other devices.
            http.post(
                URL + "/auth/v1/logout?scope=local",
                headers={"apikey": key, "Authorization": "Bearer " + token},
            )

output = {
    "project": REF,
    "readOnly": True,
    "checks": checks,
    "passed": all(item["pass"] for item in checks),
}
destination = ROOT / "docs/UI/audits/2026-11-19/marketing-manager-hosted-smoke.json"
destination.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(output, ensure_ascii=False, indent=2))
raise SystemExit(0 if output["passed"] else 1)
