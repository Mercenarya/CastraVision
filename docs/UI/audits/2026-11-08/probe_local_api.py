"""Read results on main: loopback API + disposable SQLite identity only."""

import json
import os
import secrets
import sys
from pathlib import Path
from unittest.mock import patch

import django
import httpx

sys.path.insert(0, str(Path.cwd()))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "CastraVision.settings")
django.setup()

from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import Client

if settings.DATABASES["default"]["ENGINE"] != "django.db.backends.sqlite3":
    raise SystemExit("REFUSED: local SQLite fixture database required")

base = "http://127.0.0.1:8000/api/"
email = f"local-audit-{secrets.token_hex(8)}@example.test"
password = secrets.token_urlsafe(32)
created = None
results = []


def record(name, response, expected):
    results.append({"case": name, "status": response.status_code, "expected": expected})
    assert response.status_code == expected, (name, response.status_code)


def send(client, method, path, **kwargs):
    headers = {"X-CSRFToken": client.cookies.get("csrftoken", "")}
    return client.request(method, base + path, headers=headers, **kwargs)


try:
    with httpx.Client(timeout=20) as client:
        record("anonymous profile denied", client.get(base + "business-profile/"), 401)
        record("anonymous import history denied", client.get(base + "campaign-imports/"), 401)
        client.get(base + "auth/csrf/")
        response = send(client, "POST", "auth/register/", json={"email": email, "password": password})
        record("local Django signup", response, 201)
        created = int(response.json()["user"]["id"])
        profile = {
            "business_name": "Disposable Local Audit",
            "industry": "Retail",
            "business_size": "Small",
            "target_customers": "Local fixture customers",
            "primary_goal": "Local fixture sales",
            "product_service": "Local fixture product",
            "preferred_channels": ["Meta"],
            "monthly_budget": 1000000,
            "currency": "VND",
        }
        record("save local business profile", send(client, "PUT", "business-profile/", json=profile), 200)
        response = send(client, "GET", "business-profile/")
        record("read saved profile", response, 200)
        assert response.json()["profile"]["business_name"] == profile["business_name"]
        bad = {"file": ("bad.csv", b"foo,bar\na,b\n", "text/csv")}
        record("invalid import rejected", send(client, "POST", "campaign-imports/upload/", files=bad), 400)
        content = b"channel,period,spend,clicks,impressions,conversions,revenue\nMeta,2026-11,100,10,1000,1,200\n"
        files = {"file": ("audit-only.csv", content, "text/csv")}
        response = send(client, "POST", "campaign-imports/upload/", files=files)
        record("local CSV preview", response, 200)
        assert response.json()["row_count"] == 1
        record("local CSV commit", send(client, "POST", "campaign-imports/upload/", files=files, data={"mode": "commit"}), 201)
        record("logout", send(client, "POST", "auth/logout/"), 200)
    with httpx.Client(timeout=20) as client:
        client.get(base + "auth/csrf/")
        record("fresh-session local login", send(client, "POST", "auth/login/", json={"email": email, "password": password}), 200)
        response = send(client, "GET", "campaign-imports/")
        record("CSV persisted across login", response, 200)
        assert len(response.json()["imports"]) == 1
        record("final logout", send(client, "POST", "auth/logout/"), 200)

    # No external AI request: patch the provider only, exercise actual routing and
    # validation anonymously with CSRF checks enabled.
    valid = {
        "business_name": "Local audit", "industry": "Retail", "business_size": "Small",
        "product_service": "Fixture products", "target_audience": "Fixture audience",
        "campaign_goal": "Fixture campaign", "budget": 1000000,
        "currency": "VND", "preferred_channels": ["Meta"],
    }
    with patch("CastraServices.views.generate_strategy") as provider:
        provider.return_value.model_dump.return_value = {"audit_provider_stub": True}
        response = Client(enforce_csrf_checks=True).post(
            "/api/strategies/generate/", data=json.dumps(valid), content_type="application/json",
            HTTP_HOST="127.0.0.1",
        )
        results.append({"case": "anonymous strategy reaches provider (security defect)",
                        "status": response.status_code, "provider_called": provider.called,
                        "expected_denial": "401 or 403",
                        "security_defect_reproduced": response.status_code == 200 and provider.called})
finally:
    if created is not None:
        get_user_model().objects.filter(pk=created, email=email).delete()
    print(json.dumps({"results": results, "fixture_removed": not get_user_model().objects.filter(email=email).exists()}, indent=2))
