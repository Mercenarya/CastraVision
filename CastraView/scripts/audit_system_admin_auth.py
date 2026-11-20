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
email = 'systemadmin.demo@castravision.test'
with httpx.Client(timeout=25, transport=httpx.HTTPTransport(retries=2)) as http:
    response = http.post(URL + '/auth/v1/token?grant_type=password', headers={'apikey': key}, json={'email': email, 'password': pairs[email]})
    checks.append({'case': 'System Admin Supabase password login', 'http': response.status_code, 'pass': response.status_code == 200})
    if response.status_code == 200:
        token = response.json()['access_token']
        client = Client()
        result = client.get('/api/auth/session/', HTTP_AUTHORIZATION='Bearer ' + token)
        payload = result.json()
        checks.append({'case': 'Django verified platform role', 'http': result.status_code, 'platform_role': payload.get('platform_role'), 'pass': result.status_code == 200 and payload.get('platform_role') == 'system_admin'})
        logout = http.post(URL + '/auth/v1/logout?scope=local', headers={'apikey': key, 'Authorization': 'Bearer ' + token})
        checks.append({'case': 'Revoke only audit login session', 'http': logout.status_code, 'pass': logout.status_code == 204})
print(json.dumps({'checks': checks}, indent=2))
