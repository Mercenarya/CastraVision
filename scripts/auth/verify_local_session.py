"""Real GoTrue/PostgREST verification; refuses any non-disposable target.

Requires the separate CastraVision-auth-sync-test stack on ports 56321/56322.
Never prints keys, passwords or tokens; deletes only fixtures created by this run.
"""

import json
import os
import secrets
import subprocess
import sys
from pathlib import Path
from uuid import uuid4

import httpx

ROOT = Path(__file__).resolve().parents[2]
PROJECT = "CastraVision-auth-sync-test"
CONTAINER = f"supabase_db_{PROJECT}"
URL = "http://127.0.0.1:56321"


def command(*args, input=None):
    result = subprocess.run(args, input=input, capture_output=True, text=True, cwd=ROOT)
    if result.returncode:
        raise RuntimeError("Local test command failed; output withheld to protect credentials.")
    return result.stdout


def guard():
    info = json.loads(command("docker", "inspect", CONTAINER))[0]
    if not info["State"]["Running"]:
        raise RuntimeError("Disposable database is not running.")
    if info["Config"]["Labels"].get("com.supabase.cli.project") != PROJECT:
        raise RuntimeError("Refusing a database outside the disposable test project.")
    bindings = info["NetworkSettings"]["Ports"]["5432/tcp"]
    if not bindings or any(item["HostPort"] != "56322" for item in bindings):
        raise RuntimeError("Disposable DB port does not match 56322.")


def sql(statement):
    guard()
    return command(
        "docker",
        "exec",
        "-i",
        CONTAINER,
        "psql",
        "-U",
        "postgres",
        "-d",
        "postgres",
        "-v",
        "ON_ERROR_STOP=1",
        "-At",
        input=statement,
    )


def main():
    guard()
    config = json.loads(
        command(
            "npx.cmd",
            "--yes",
            "supabase@2.121.0",
            "--workdir",
            str(ROOT / ".tmp" / "auth-sync-test"),
            "status",
            "-o",
            "json",
        )
    )
    if config["API_URL"] not in (URL, URL.replace("127.0.0.1", "localhost")):
        raise RuntimeError("Refusing a non-local Auth API.")
    public = config["ANON_KEY"]
    admin_headers = {
        "apikey": config["SERVICE_ROLE_KEY"],
        "Authorization": "Bearer " + config["SERVICE_ROLE_KEY"],
    }
    auth = httpx.Client(base_url=URL + "/auth/v1", timeout=20)
    created = []
    workspaces = [str(uuid4()), str(uuid4())]
    password = secrets.token_urlsafe(30)
    identities = {}
    try:
        for role in ("admin", "manager", "member", "system_admin", "unassigned"):
            email = f"auth-sync-{uuid4().hex}@example.test"
            response = auth.post(
                "/admin/users",
                headers=admin_headers,
                json={
                    "email": email,
                    "password": password,
                    "email_confirm": True,
                    "app_metadata": {"platform_role": "system_admin"}
                    if role == "system_admin"
                    else {},
                    "user_metadata": {"role": "system_admin"} if role == "member" else {},
                },
            )
            if response.status_code != 200:
                raise RuntimeError(f"Local fixture creation failed ({response.status_code}).")
            user = response.json()["id"]
            created.append(user)
            signed_in = auth.post(
                "/token?grant_type=password",
                headers={"apikey": public},
                json={"email": email, "password": password},
            )
            if signed_in.status_code != 200:
                raise RuntimeError("Local Supabase sign-in failed.")
            identities[role] = {"id": user, **signed_in.json()}
        owner = identities["admin"]["id"]
        for workspace in workspaces:
            sql(
                f"insert into public.workspaces(id,name,owner_id) values ('{workspace}',"
                f"'Auth sync fixture','{owner}');"
            )
        for role in ("admin", "manager", "member"):
            user = identities[role]["id"]
            sql(
                f"insert into public.workspace_members(workspace_id,user_id,role) "
                f"values ('{workspaces[0]}','{user}','{role}');"
            )
        sql(
            f"insert into public.workspace_members(workspace_id,user_id,role) "
            f"values ('{workspaces[1]}','{owner}','admin');"
        )

        sys.path.insert(0, str(ROOT))
        os.environ["DJANGO_SETTINGS_MODULE"] = "CastraVision.test_settings"
        import django

        django.setup()
        from django.core.files.uploadedfile import SimpleUploadedFile
        from django.test import Client, override_settings

        def check(name, condition):
            if not condition:
                raise AssertionError(name)
            print("PASS", name)

        with override_settings(
            SUPABASE_URL=URL, SUPABASE_PUBLISHABLE_KEY=public, ALLOWED_HOSTS=["testserver"]
        ):
            client = Client(enforce_csrf_checks=True)
            for role, identity in identities.items():
                headers = {
                    "HTTP_AUTHORIZATION": "Bearer " + identity["access_token"],
                    "HTTP_X_WORKSPACE_ID": workspaces[0],
                }
                response = client.get("/api/auth/session/", **headers)
                if response.status_code != 200:
                    print(
                        "Auth context failure:",
                        response.status_code,
                        response.json().get("error", {}).get("code"),
                    )
                check(f"real Auth identity / {role}", response.status_code == 200)
                body = response.json()
                expected = "system_admin" if role == "system_admin" else None
                check(f"trusted platform role / {role}", body["platform_role"] == expected)
                if role in ("admin", "manager", "member"):
                    check(f"real RLS membership / {role}", body["memberships"][0]["role"] == role)
                    if role == "admin":
                        check("multiple memberships retained", len(body["memberships"]) == 2)
                        check(
                            "ambiguous Workspace requires selection",
                            client.get(
                                "/api/business-profile/",
                                HTTP_AUTHORIZATION=headers["HTTP_AUTHORIZATION"],
                            ).status_code
                            == 403,
                        )
                    profile = {
                        "business_name": "Auth fixture",
                        "industry": "Retail",
                        "business_size": "Small",
                        "target_customers": "Local test audience",
                        "monthly_budget": 1000000,
                        "preferred_channels": ["Meta"],
                    }
                    saved = client.put(
                        "/api/business-profile/",
                        data=json.dumps(profile),
                        content_type="application/json",
                        **headers,
                    )
                    check(
                        f"profile write / {role}",
                        saved.status_code == (200 if role == "admin" else 403),
                    )
                    check(
                        f"profile read / {role}",
                        client.get("/api/business-profile/", **headers).status_code == 200,
                    )
                    content = (
                        b"channel,period,spend,clicks,impressions,conversions,revenue\n"
                        b"Meta,2026-11,100,10,1000,1,200\n"
                    )
                    for mode, status in (("preview", 200), ("commit", 201)):
                        imported = client.post(
                            "/api/campaign-imports/upload/",
                            {
                                "file": SimpleUploadedFile("local.csv", content, "text/csv"),
                                "mode": mode,
                            },
                            **headers,
                        )
                        check(f"Supabase import {mode} / {role}", imported.status_code == status)
                    check(
                        f"Supabase import history / {role}",
                        client.get("/api/campaign-imports/", **headers).json()["imports"] != [],
                    )
                    if role != "admin":
                        foreign = {**headers, "HTTP_X_WORKSPACE_ID": workspaces[1]}
                        check(
                            f"foreign Workspace denied / {role}",
                            client.get("/api/business-profile/", **foreign).status_code == 403,
                        )
                else:
                    check(f"no business membership / {role}", body["memberships"] == [])
                    check(
                        f"business API denied / {role}",
                        client.get("/api/business-profile/", **headers).status_code == 403,
                    )
            check(
                "forged token denied",
                client.get(
                    "/api/auth/session/", HTTP_AUTHORIZATION="Bearer invalid-fixture"
                ).status_code
                == 401,
            )
            check(
                "cookie cannot replace token", client.get("/api/auth/session/").status_code == 401
            )
            refresh = auth.post(
                "/token?grant_type=refresh_token",
                headers={"apikey": public},
                json={"refresh_token": identities["member"]["refresh_token"]},
            )
            check("real Supabase refresh", refresh.status_code == 200)
            refreshed = refresh.json()
            check(
                "Django accepts refreshed identity",
                client.get(
                    "/api/auth/session/", HTTP_AUTHORIZATION="Bearer " + refreshed["access_token"]
                ).status_code
                == 200,
            )
            logged_out = auth.post(
                "/logout?scope=local",
                headers={"apikey": public, "Authorization": "Bearer " + refreshed["access_token"]},
            )
            check("real Supabase local logout", logged_out.status_code in (200, 204))
            refresh_again = auth.post(
                "/token?grant_type=refresh_token",
                headers={"apikey": public},
                json={"refresh_token": refreshed["refresh_token"]},
            )
            check("logout revokes refresh session", refresh_again.status_code != 200)
    finally:
        for workspace in workspaces:
            sql(f"delete from public.workspaces where id='{workspace}';")
        for user in reversed(created):
            response = auth.delete("/admin/users/" + user, headers=admin_headers)
            if response.status_code not in (200, 404):
                raise RuntimeError("Local fixture cleanup failed.")
        auth.close()
        print("Local fixtures cleaned; no hosted requests made.")


if __name__ == "__main__":
    main()
