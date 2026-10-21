"""Real integration spike for Django user-JWT forwarding and Supabase RLS."""

from __future__ import annotations

import argparse
import concurrent.futures
import os
import shutil
import socket
import subprocess
import sys
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse

import httpx

ROOT = Path(__file__).resolve().parents[2]
LOCAL_HOSTS = {"127.0.0.1", "localhost"}
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


@dataclass(frozen=True)
class Identity:
    user_id: str
    token: str
    workspace_id: str


class Checks:
    def __init__(self) -> None:
        self.failed = 0
        self.skipped = 0

    def check(self, name: str, passed: bool, detail: str = "") -> None:
        status = "PASS" if passed else "FAIL"
        if not passed:
            self.failed += 1
        suffix = f" - {detail}" if detail else ""
        print(f"[{status}] {name}{suffix}")

    def skip(self, name: str, detail: str) -> None:
        self.skipped += 1
        print(f"[SKIP] {name} - {detail}")


def _parse_env_lines(output: str) -> dict[str, str]:
    values: dict[str, str] = {}
    for raw_line in output.splitlines():
        line = raw_line.strip()
        if not line or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def _local_supabase_env() -> dict[str, str]:
    npx = shutil.which("npx")
    if not npx:
        raise RuntimeError("npx is not installed")
    completed = subprocess.run(
        [npx, "--yes", "supabase@2.121.0", "status", "-o", "env"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
    )
    values = _parse_env_lines(completed.stdout)
    required = ("API_URL", "ANON_KEY", "SERVICE_ROLE_KEY")
    missing = [name for name in required if not values.get(name)]
    if missing:
        raise RuntimeError("Supabase status omitted required local values")
    return values


def _assert_local(url: str) -> None:
    host = (urlparse(url).hostname or "").casefold()
    if host not in LOCAL_HOSTS:
        raise RuntimeError("Refusing a local-mode write to a non-local Supabase host")


def _headers(api_key: str, token: str | None = None) -> dict[str, str]:
    result = {"apikey": api_key, "Content-Type": "application/json"}
    if token:
        result["Authorization"] = f"Bearer {token}"
    return result


def _create_user(base_url: str, service_key: str, email: str, password: str) -> str:
    response = httpx.post(
        f"{base_url}/auth/v1/admin/users",
        headers=_headers(service_key, service_key),
        json={"email": email, "password": password, "email_confirm": True},
        timeout=10,
    )
    response.raise_for_status()
    return str(response.json()["id"])


def _sign_in(base_url: str, anon_key: str, email: str, password: str) -> str:
    response = httpx.post(
        f"{base_url}/auth/v1/token",
        params={"grant_type": "password"},
        headers=_headers(anon_key),
        json={"email": email, "password": password},
        timeout=10,
    )
    response.raise_for_status()
    return str(response.json()["access_token"])


def _create_workspace(base_url: str, anon_key: str, token: str, name: str) -> str:
    response = httpx.post(
        f"{base_url}/rest/v1/rpc/create_workspace_with_admin",
        headers=_headers(anon_key, token),
        json={"workspace_name": name},
        timeout=10,
    )
    response.raise_for_status()
    payload = response.json()
    if not isinstance(payload, list) or not payload:
        raise RuntimeError("Workspace RPC returned an unexpected response")
    return str(payload[0]["workspace_id"])


def _new_identity(base_url: str, anon_key: str, service_key: str, label: str) -> Identity:
    marker = uuid.uuid4().hex
    email = f"spike-{label}-{marker}@example.test"
    password = f"Spike-{marker}-Aa9!"
    user_id = _create_user(base_url, service_key, email, password)
    token = _sign_in(base_url, anon_key, email, password)
    workspace_id = _create_workspace(base_url, anon_key, token, f"Spike {label} {marker[:8]}")
    return Identity(user_id=user_id, token=token, workspace_id=workspace_id)


def _configure_django(base_url: str, anon_key: str, service_key: str, db_url: str = "") -> None:
    os.environ.update(
        {
            "DJANGO_SETTINGS_MODULE": "CastraVision.settings",
            "SUPABASE_URL": base_url,
            "SUPABASE_PUBLISHABLE_KEY": anon_key,
            "SUPABASE_ANON_KEY": anon_key,
            "SUPABASE_SERVICE_ROLE_KEY": service_key,
            "SUPABASE_JWT_ISSUER": f"{base_url}/auth/v1",
            "SUPABASE_JWKS_URL": f"{base_url}/auth/v1/.well-known/jwks.json",
            "SUPABASE_JWT_AUDIENCE": "authenticated",
            "SUPABASE_JWT_ALGORITHMS": "ES256,RS256,HS256",
        }
    )
    if db_url:
        os.environ["DATABASE_URL"] = db_url


def _free_port() -> int:
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        return int(listener.getsockname()[1])


def _start_django(environment: dict[str, str]) -> tuple[subprocess.Popen[bytes], str]:
    port = _free_port()
    python = sys.executable
    process = subprocess.Popen(
        [python, "manage.py", "runserver", f"127.0.0.1:{port}", "--noreload"],
        cwd=ROOT,
        env=environment,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    url = f"http://127.0.0.1:{port}"
    for _ in range(80):
        if process.poll() is not None:
            raise RuntimeError("Django dev server exited before becoming ready")
        try:
            if httpx.get(f"{url}/api/health/", timeout=0.5).status_code == 200:
                return process, url
        except httpx.RequestError:
            pass
        time.sleep(0.1)
    process.terminate()
    raise RuntimeError("Django dev server did not become ready")


def _django_auth_checks(checks: Checks, django_url: str, a: Identity, b: Identity) -> None:
    endpoint = f"{django_url}/api/campaign-imports/sandbox/"

    own = httpx.post(
        endpoint,
        headers={"Authorization": f"Bearer {a.token}", "X-Workspace-ID": a.workspace_id},
        timeout=20,
    )
    checks.check("Django: A ghi workspace A", own.status_code == 201, f"HTTP {own.status_code}")

    cross = httpx.post(
        endpoint,
        headers={"Authorization": f"Bearer {b.token}", "X-Workspace-ID": a.workspace_id},
        timeout=20,
    )
    checks.check(
        "Django: B bị chặn khi ghi workspace A",
        cross.status_code == 403,
        f"HTTP {cross.status_code}, chặn tại membership authorization",
    )

    missing = httpx.post(endpoint, headers={"X-Workspace-ID": a.workspace_id}, timeout=10)
    checks.check(
        "Django: thiếu Authorization",
        missing.status_code == 401,
        f"HTTP {missing.status_code}",
    )

    junk = httpx.post(
        endpoint,
        headers={"Authorization": "Bearer not-a-jwt", "X-Workspace-ID": a.workspace_id},
        timeout=10,
    )
    checks.check("Django: token rác", junk.status_code == 401, f"HTTP {junk.status_code}")

    pieces = a.token.split(".")
    pieces[-1] = ("A" if not pieces[-1].startswith("A") else "B") + pieces[-1][1:]
    tampered = httpx.post(
        endpoint,
        headers={"Authorization": f"Bearer {'.'.join(pieces)}", "X-Workspace-ID": a.workspace_id},
        timeout=10,
    )
    checks.check(
        "Django: token bị sửa chữ ký",
        tampered.status_code == 401,
        f"HTTP {tampered.status_code}",
    )

    checks.skip(
        "Django GET dữ liệu theo workspace",
        "repo không có endpoint GET workspace-scoped; không thêm route theo quy tắc spike",
    )
    checks.skip(
        "Django member bị chặn ở endpoint ghi",
        "các endpoint ghi hiện có dùng require_workspace_member nên member được phép",
    )


def _client_checks(checks: Checks, a: Identity, b: Identity, service_key: str) -> None:
    from CastraServices.supabase_client import SupabaseDataClient, user_client

    client_a = user_client(a.token)
    client_b = user_client(b.token)

    role_aa = client_a.request("POST", "rpc/workspace_role", json={"ws_id": a.workspace_id})
    role_ab = client_a.request("POST", "rpc/workspace_role", json={"ws_id": b.workspace_id})
    role_ba = client_b.request("POST", "rpc/workspace_role", json={"ws_id": a.workspace_id})
    checks.check("Client: role A/A là admin", role_aa == "admin")
    checks.check("Client: role A/B là null", role_ab is None)
    checks.check("Client: role B/A là null", role_ba is None)

    def visible(client: SupabaseDataClient) -> set[str]:
        rows = client.request("GET", "workspaces", params={"select": "id"})
        return {str(row["id"]) for row in rows}

    visible_a = visible(client_a)
    visible_b = visible(client_b)
    checks.check("Client: A chỉ thấy workspace A", visible_a == {a.workspace_id})
    checks.check("Client: B chỉ thấy workspace B", visible_b == {b.workspace_id})

    def one_request(index: int) -> bool:
        identity, client = (a, client_a) if index % 2 == 0 else (b, client_b)
        return visible(client) == {identity.workspace_id}

    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
        concurrent_results = list(pool.map(one_request, range(40)))
    checks.check(
        "Client: 40 request đồng thời không rò workspace",
        len(concurrent_results) == 40 and all(concurrent_results),
    )

    service = SupabaseDataClient(service_key, api_key=service_key)
    service_visible = visible(service)
    checks.check(
        "Đối chứng service-role thấy cả hai workspace",
        {a.workspace_id, b.workspace_id}.issubset(service_visible),
        "service-role bỏ qua RLS nên không được dùng cho request của user",
    )


def _verify_local_token(checks: Checks, token: str, base_url: str) -> None:
    import jwt

    from CastraServices.authentication import _verified_subject

    header = jwt.get_unverified_header(token)
    jwks = httpx.get(f"{base_url}/auth/v1/.well-known/jwks.json", timeout=10)
    keys = jwks.json().get("keys", []) if jwks.status_code == 200 else []
    algorithm = str(header.get("alg", ""))
    kid_status = "có" if header.get("kid") else "không"
    checks.check(
        "JWT local có alg",
        bool(algorithm),
        f"alg={algorithm}, kid={kid_status}",
    )
    checks.check("JWKS local truy cập được", jwks.status_code == 200, f"{len(keys)} key")
    try:
        subject = _verified_subject(token)
        checks.check("authentication.py xác minh token local", bool(subject), f"nhánh {algorithm}")
    except Exception as exc:
        cause = exc.__cause__
        cause_detail = (
            f"; cause={type(cause).__name__}: {cause}" if cause is not None else ""
        )
        checks.check(
            "authentication.py xác minh token local",
            False,
            f"nhánh {algorithm}; {type(exc).__name__}: {exc}{cause_detail}",
        )


def _wait_for_token_iat(checks: Checks, token: str) -> None:
    import jwt

    claims = jwt.decode(token, options={"verify_signature": False})
    issued_at = claims.get("iat")
    delay = float(issued_at) - time.time() + 1 if isinstance(issued_at, int) else 0
    if delay > 0:
        if delay > 30:
            raise RuntimeError("Local Auth clock is more than 30 seconds ahead")
        checks.check(
            "JWT local: phát hiện lệch đồng hồ",
            True,
            f"chờ {delay:.1f}s để token đạt iat",
        )
        time.sleep(delay)


def _run_inspector(checks: Checks, token: str) -> None:
    environment = os.environ.copy()
    environment["TOKEN_TO_INSPECT"] = token
    completed = subprocess.run(
        [sys.executable, str(Path(__file__).with_name("inspect_jwt.py"))],
        cwd=ROOT,
        env=environment,
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=False,
    )
    checks.check(
        "inspect_jwt.py đọc token local an toàn",
        completed.returncode == 0,
    )
    if completed.returncode == 0:
        print(completed.stdout.strip())


def _cleanup_local(base_url: str, service_key: str, identities: list[Identity]) -> None:
    for identity in identities:
        httpx.delete(
            f"{base_url}/rest/v1/workspaces",
            params={"id": f"eq.{identity.workspace_id}"},
            headers={**_headers(service_key, service_key), "Prefer": "return=minimal"},
            timeout=10,
        ).raise_for_status()
    for identity in identities:
        httpx.delete(
            f"{base_url}/auth/v1/admin/users/{identity.user_id}",
            headers=_headers(service_key, service_key),
            timeout=10,
        ).raise_for_status()


def _hosted(args: argparse.Namespace, checks: Checks) -> int:
    base_url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    anon_key = os.environ.get("SUPABASE_PUBLISHABLE_KEY", "")
    token_a = os.environ.get("SPIKE_TOKEN_A", "")
    token_b = os.environ.get("SPIKE_TOKEN_B", "")
    workspace_a = os.environ.get("SPIKE_WORKSPACE_A", "")
    workspace_b = os.environ.get("SPIKE_WORKSPACE_B", "")
    if not all((base_url, anon_key, token_a, token_b, workspace_a, workspace_b)):
        raise RuntimeError(
            "Hosted mode requires SUPABASE_URL, publishable key, two tokens, "
            "and two workspace IDs"
        )
    _configure_django(base_url, anon_key, "")
    import django

    django.setup()
    from CastraServices.supabase_client import user_client

    client_a, client_b = user_client(token_a), user_client(token_b)
    role_aa = client_a.request("POST", "rpc/workspace_role", json={"ws_id": workspace_a})
    role_ab = client_a.request("POST", "rpc/workspace_role", json={"ws_id": workspace_b})
    role_ba = client_b.request("POST", "rpc/workspace_role", json={"ws_id": workspace_a})
    checks.check("Hosted read: role A/A", role_aa is not None)
    checks.check("Hosted read: role A/B null", role_ab is None)
    checks.check("Hosted read: role B/A null", role_ba is None)
    rows_a = client_a.request("GET", "workspaces", params={"select": "id"})
    rows_b = client_b.request("GET", "workspaces", params={"select": "id"})
    checks.check("Hosted read: A cô lập", {str(row["id"]) for row in rows_a} == {workspace_a})
    checks.check("Hosted read: B cô lập", {str(row["id"]) for row in rows_b} == {workspace_b})

    server: subprocess.Popen[bytes] | None = None
    try:
        server, django_url = _start_django(os.environ.copy())
        endpoint = f"{django_url}/api/campaign-imports/sandbox/"
        missing = httpx.post(
            endpoint,
            headers={"X-Workspace-ID": workspace_a},
            timeout=10,
        )
        junk = httpx.post(
            endpoint,
            headers={
                "Authorization": "Bearer not-a-jwt",
                "X-Workspace-ID": workspace_a,
            },
            timeout=10,
        )
        checks.check("Hosted Django: thiếu Authorization", missing.status_code == 401)
        checks.check("Hosted Django: token rác", junk.status_code == 401)
    finally:
        if server is not None:
            server.terminate()
            try:
                server.wait(timeout=5)
            except subprocess.TimeoutExpired:
                server.kill()
    return 1 if checks.failed else 0


def _local(checks: Checks) -> int:
    values = _local_supabase_env()
    base_url = values["API_URL"].rstrip("/")
    anon_key = values["ANON_KEY"]
    service_key = values["SERVICE_ROLE_KEY"]
    _assert_local(base_url)
    _configure_django(base_url, anon_key, service_key, values.get("DB_URL", ""))

    import django

    django.setup()
    identities: list[Identity] = []
    server: subprocess.Popen[bytes] | None = None
    try:
        a = _new_identity(base_url, anon_key, service_key, "a")
        identities.append(a)
        b = _new_identity(base_url, anon_key, service_key, "b")
        identities.append(b)
        _wait_for_token_iat(checks, a.token)
        _run_inspector(checks, a.token)
        _verify_local_token(checks, a.token, base_url)

        environment = os.environ.copy()
        server, django_url = _start_django(environment)
        _django_auth_checks(checks, django_url, a, b)
        _client_checks(checks, a, b, service_key)
    finally:
        if server is not None:
            server.terminate()
            try:
                server.wait(timeout=5)
            except subprocess.TimeoutExpired:
                server.kill()
        if identities:
            _cleanup_local(base_url, service_key, identities)
    return 1 if checks.failed else 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--hosted",
        action="store_true",
        help="Run read-only checks against an explicitly configured hosted project",
    )
    args = parser.parse_args()
    checks = Checks()
    try:
        result = _hosted(args, checks) if args.hosted else _local(checks)
    except Exception as exc:
        print(f"[FAIL] Spike aborted safely: {type(exc).__name__}: {exc}")
        return 1
    print(f"Summary: failed={checks.failed}, skipped={checks.skipped}")
    return result


if __name__ == "__main__":
    raise SystemExit(main())
