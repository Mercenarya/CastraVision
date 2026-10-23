"""Fail closed unless a performance command targets the expected local stack."""

from __future__ import annotations

import ipaddress
import json
import os
import socket
import subprocess
from urllib.parse import urlparse

CONTAINER = "supabase_db_CastraVision-main"
EXPECTED_CONFIRMATION = "CastraVision-main"
PROJECT_LABEL = "com.supabase.cli.project"


def _fail(message: str) -> None:
    raise SystemExit(f"PERF GUARD: {message}")


def _is_loopback(host: str) -> bool:
    normalized = host.strip().strip("[]").lower()
    if normalized == "localhost":
        return True
    try:
        return ipaddress.ip_address(normalized).is_loopback
    except ValueError:
        try:
            addresses = socket.getaddrinfo(normalized, None)
        except socket.gaierror:
            return False
        return bool(addresses) and all(
            ipaddress.ip_address(address[4][0]).is_loopback for address in addresses
        )


def require_loopback_tcp(target: str | None) -> None:
    """Reject a TCP host/URL unless every resolved address is loopback."""
    if not target:
        return
    parsed = urlparse(target if "://" in target else f"tcp://{target}")
    if not parsed.hostname or not _is_loopback(parsed.hostname):
        _fail(f"refusing non-loopback TCP target: {parsed.hostname or target}")


def require_local_stack(*, tcp_target: str | None = None) -> None:
    """Verify explicit consent and the identity of the local Supabase DB container."""
    if os.environ.get("PERF_LOCAL_CONFIRM") != EXPECTED_CONFIRMATION:
        _fail(f"set PERF_LOCAL_CONFIRM={EXPECTED_CONFIRMATION} before running")
    require_loopback_tcp(tcp_target)
    try:
        result = subprocess.run(
            ["docker", "inspect", CONTAINER],
            check=True,
            capture_output=True,
            text=True,
        )
    except (FileNotFoundError, subprocess.CalledProcessError) as exc:
        _fail(f"cannot inspect local container {CONTAINER}: {exc}")
    try:
        details = json.loads(result.stdout)[0]
    except (IndexError, KeyError, json.JSONDecodeError) as exc:
        _fail(f"invalid docker inspect response for {CONTAINER}: {exc}")
    if not details.get("State", {}).get("Running"):
        _fail(f"container {CONTAINER} is not running")
    actual_project = details.get("Config", {}).get("Labels", {}).get(PROJECT_LABEL)
    if actual_project != EXPECTED_CONFIRMATION:
        _fail(
            f"container label {PROJECT_LABEL}={actual_project!r}; "
            f"expected {EXPECTED_CONFIRMATION!r}"
        )
