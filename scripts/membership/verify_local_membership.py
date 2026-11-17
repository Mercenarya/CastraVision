"""Real GoTrue/PostgREST + Django integration, guarded disposable local stack only.

No credentials, callback links, email bodies or tokens are printed. Fixture data
belongs to this run and is removed even after failure; never resets a database.
"""

import json
import os
import re
import secrets
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from html import unescape
from pathlib import Path
from uuid import uuid4

import httpx
from local_stack import API, sql, status


def main():
    config = status()
    os.environ.update(
        DJANGO_SETTINGS_MODULE="CastraVision.settings",
        SUPABASE_URL=API,
        SUPABASE_PUBLISHABLE_KEY=config["ANON_KEY"],
        SUPABASE_SERVICE_ROLE_KEY=config["SERVICE_ROLE_KEY"],
    )
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
    import django

    django.setup()
    from django.test import Client, override_settings

    admin_headers = {
        "apikey": config["SERVICE_ROLE_KEY"],
        "Authorization": "Bearer " + config["SERVICE_ROLE_KEY"],
    }
    public_headers = {"apikey": config["ANON_KEY"]}
    users, workspaces = [], []
    prefix = "mship-" + uuid4().hex[:10]
    password = secrets.token_urlsafe(24)

    def auth(method, path, headers=None, **kwargs):
        response = httpx.request(
            method,
            API + "/auth/v1/" + path,
            headers=headers or public_headers,
            timeout=25,
            **kwargs,
        )
        if response.is_error:
            raise AssertionError("Local Auth request failed: " + str(response.status_code))
        return response.json()

    def user(name, role=None):
        value = auth(
            "POST",
            "admin/users",
            admin_headers,
            json={
                "email": f"{prefix}-{name}@example.test",
                "password": password,
                "email_confirm": True,
                "app_metadata": {"platform_role": role} if role else {},
            },
        )
        users.append(value["id"])
        # Operator-provisioned fixture explicitly completes the Auth password step.
        auth("PUT", "admin/users/" + value["id"], admin_headers, json={"password": password})
        session = auth(
            "POST",
            "token?grant_type=password",
            json={"email": value["email"], "password": password},
        )
        return {**value, "token": session["access_token"]}

    def email_session(address, *, send=True):
        if send:
            auth(
                "POST",
                "otp",
                params={"redirect_to": "http://127.0.0.1:57300/auth/complete"},
                json={"email": address, "create_user": True},
            )
        for _ in range(30):
            messages = httpx.get("http://127.0.0.1:57324/api/v1/messages").json()["messages"]
            for message in messages:
                recipients = message.get("To", [])
                if not any(x.get("Address", "").lower() == address.lower() for x in recipients):
                    continue
                mail = httpx.get("http://127.0.0.1:57324/api/v1/message/" + message["ID"]).json()
                content = unescape(mail.get("HTML", "") + mail.get("Text", ""))
                links = re.findall(r'https?://[^\s<>"\']+', content)
                link = next((x for x in links if "/auth/v1/verify?" in x), None)
                if link:
                    # Email uses Docker's advertised endpoint; force guarded local API.
                    response = httpx.get(
                        API + "/auth/v1/verify?" + link.split("?", 1)[1], follow_redirects=False
                    )
                    from urllib.parse import parse_qs, urlparse

                    callback = response.headers.get("location", "")
                    params = parse_qs(urlparse(callback).fragment)
                    if "access_token" not in params:
                        raise AssertionError("Local email verification failed (no session)")
                    return {"token": params["access_token"][0]}
            time.sleep(0.2)
        raise AssertionError("Local verification email did not arrive")

    def api(identity, method, path, body=None, workspace=None, expected=200):
        headers = {"HTTP_AUTHORIZATION": "Bearer " + identity["token"]}
        if workspace:
            headers["HTTP_X_WORKSPACE_ID"] = workspace
        response = (
            getattr(Client(), method)(
                "/api/" + path,
                data=json.dumps(body or {}),
                content_type="application/json",
                **headers,
            )
            if method != "get"
            else Client().get("/api/" + path, **headers)
        )
        if response.status_code != expected:
            code = response.json().get("error", {}).get("code", "unknown")
            raise AssertionError(f"{method} {path}: {response.status_code} ({code})")
        return response.json()

    def rpc(identity, name, params):
        response = httpx.post(
            API + "/rest/v1/rpc/membership_" + name,
            headers={**public_headers, "Authorization": "Bearer " + identity["token"]},
            json=params,
            timeout=25,
        )
        return response

    try:
        manager, other, employee = user("manager"), user("other"), user("employee")
        leader, system = user("leader"), user("platform", "system_admin")
        for owner in (manager, other):
            ws = str(uuid4())
            workspaces.append(ws)
            sql(
                "insert into public.workspaces(id,name,owner_id) "
                f"values ('{ws}','{prefix}','{owner['id']}');"
                "insert into public.workspace_members(workspace_id,user_id,role) "
                f"values ('{ws}','{owner['id']}','admin');"
            )
        ws, ws_other = workspaces
        sql(
            "insert into public.workspace_members(workspace_id,user_id,role) "
            f"values ('{ws}','{leader['id']}','manager');"
        )
        with override_settings(
            SUPABASE_URL=API,
            SUPABASE_PUBLISHABLE_KEY=config["ANON_KEY"],
            SUPABASE_SERVICE_ROLE_KEY=config["SERVICE_ROLE_KEY"],
            CORS_ALLOWED_ORIGINS=["http://127.0.0.1:57300"],
        ):
            api(
                manager,
                "put",
                "workspace/recruitment/",
                {"acceptingJoinRequests": True, "publicDescription": "Local acceptance"},
                ws,
            )
            companies = api(employee, "get", "onboarding/companies/")
            assert {x["id"] for x in companies["items"]} == {ws}
            assert set(companies["items"][0]) == {"id", "name", "publicDescription"}
            for blocked in (employee, leader, system):
                api(blocked, "get", "workspace/personnel/", workspace=ws, expected=403)
            api(other, "get", "workspace/personnel/", workspace=ws, expected=403)
            print("PASS: four-role boundary, cross-company isolation, minimal opted-in directory")
            # Real concurrent HTTP requests, same user, same Workspace.
            params = {"p_workspace_id": ws, "p_message": "Local concurrent request"}
            with ThreadPoolExecutor(max_workers=2) as pool:
                results = list(pool.map(lambda _: rpc(employee, "request_join", params), range(2)))
            assert all(x.is_success for x in results)
            request_id = results[0].json()["id"]
            assert results[1].json()["id"] == request_id
            notifications = api(manager, "get", "membership-notifications/")
            assert notifications["unreadCount"] == 1
            assert not api(employee, "get", "auth/session/")["memberships"]
            print(
                "PASS: concurrent requests create one request/notification; no premature membership"
            )
            decision = {
                "p_workspace_id": ws,
                "p_request_id": request_id,
                "p_decision": "approve",
                "p_team_id": None,
                "p_reason": "",
            }
            with ThreadPoolExecutor(max_workers=2) as pool:
                results = list(
                    pool.map(lambda _: rpc(manager, "review_request", decision), range(2))
                )
            assert all(x.is_success for x in results)
            memberships = api(employee, "get", "auth/session/")["memberships"]
            assert len(memberships) == 1 and memberships[0]["role"] == "member"
            assert api(employee, "get", "membership-notifications/")["unreadCount"] == 1
            print("PASS: concurrent approvals produce one Employee membership/result")
            # GoTrue email link for a new account; generate_link is local admin only.
            address = f"{prefix}-new@example.test"
            newcomer = email_session(address)
            local_new = auth(
                "GET", "user", {**public_headers, "Authorization": "Bearer " + newcomer["token"]}
            )
            users.append(local_new["id"])
            assert api(newcomer, "get", "auth/session/")["onboarding"]["passwordSetupRequired"]
            api(newcomer, "post", "onboarding/requests/", {"workspaceId": ws}, expected=403)
            auth(
                "PUT",
                "user",
                {**public_headers, "Authorization": "Bearer " + newcomer["token"]},
                json={"password": password},
            )
            assert not api(newcomer, "get", "auth/session/")["onboarding"]["passwordSetupRequired"]
            print("PASS: verified email link, password required, Supabase password, onboarding")
            invited_address = f"{prefix}-invited@example.test"
            invitation = api(
                manager,
                "post",
                "workspace/invitations/",
                {"email": invited_address, "role": "member", "teamId": None},
                ws,
                201,
            )
            assert invitation["deliveryStatus"] == "sent"
            # Provider has accepted email into local Mailpit; no claim about real Gmail.
            local_user = json.loads(
                sql(
                    "select row_to_json(x) from (select id from auth.users "
                    f"where email='{invited_address}') x;"
                )
            )
            users.append(local_user["id"])
            assert (
                sql(
                    "select count(*) from public.workspace_members "
                    f"where user_id='{local_user['id']}';"
                ).strip()
                == "0"
            )
            api(
                employee, "post", f"onboarding/invitations/{invitation['id']}/accept/", expected=403
            )
            recipient = email_session(invited_address, send=False)
            auth(
                "PUT",
                "user",
                {**public_headers, "Authorization": "Bearer " + recipient["token"]},
                json={"password": password},
            )
            accepted = api(recipient, "post", f"onboarding/invitations/{invitation['id']}/accept/")
            assert accepted["status"] == "accepted"
            print(
                "PASS: local OTP delivery; no premature membership; "
                "wrong recipient denied; explicit acceptance"
            )
            # An existing password is neither overwritten nor sent through Django.
            auth(
                "POST",
                "token?grant_type=password",
                json={"email": employee["email"], "password": password},
            )
            print("PASS: existing password login remains valid")
    finally:
        for ws in workspaces:
            sql(f"delete from public.workspaces where id='{ws}';")
        for uid in users:
            auth("DELETE", "admin/users/" + uid, admin_headers)
        print("Local run fixtures removed; no existing user or Workspace changed.")


if __name__ == "__main__":
    main()
