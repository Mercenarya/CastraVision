"""Disposable membership stack. No linked/hosted configuration is accepted."""

import ipaddress
import json
import shutil
import subprocess
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[2]
PROJECT = "CastraVision-membership-test"
CONTAINER = "supabase_db_" + PROJECT
WORK = ROOT / ".tmp/membership-stack"
API = "http://127.0.0.1:57321"


def loopback(address):
    host = urlparse(address).hostname
    if host == "localhost":
        return
    try:
        if ipaddress.ip_address(host).is_loopback:
            return
    except ValueError:
        pass
    raise RuntimeError("Only a loopback test endpoint is allowed.")


def run(args, *, input=None):
    result = subprocess.run(
        args,
        cwd=ROOT,
        input=input,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    return result


def cli(*args):
    return run(["npx.cmd", "--yes", "supabase@2.121.0", "--workdir", str(WORK), *args])


def sync():
    directory = WORK / "supabase"
    directory.mkdir(parents=True, exist_ok=True)
    (directory / "config.toml").write_text(
        """project_id = "CastraVision-membership-test"
[api]
port = 57321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
[db]
port = 57322
shadow_port = 57320
major_version = 17
[db.seed]
enabled = false
[studio]
enabled = false
port = 57323
[inbucket]
enabled = true
port = 57324
smtp_port = 57325
pop3_port = 57326
[analytics]
enabled = false
port = 57327
[edge_runtime]
enabled = false
[auth]
site_url = "http://127.0.0.1:57300"
additional_redirect_urls = ["http://127.0.0.1:57300/**", "http://localhost:57300/**"]
enable_signup = true
[auth.email]
enable_signup = true
enable_confirmations = true
max_frequency = "1s"
[auth.rate_limit]
email_sent = 1000
""",
        encoding="utf-8",
    )
    for name in ("migrations", "tests"):
        shutil.copytree(ROOT / "supabase" / name, directory / name, dirs_exist_ok=True)


def guard():
    result = run(["docker", "inspect", CONTAINER])
    if result.returncode:
        raise RuntimeError("The disposable membership DB is not available.")
    info = json.loads(result.stdout)[0]
    if (
        not info["State"]["Running"]
        or info["Config"]["Labels"].get("com.supabase.cli.project") != PROJECT
    ):
        raise RuntimeError("Refusing a database outside the membership test project.")
    if any(x["HostPort"] != "57322" for x in info["NetworkSettings"]["Ports"]["5432/tcp"]):
        raise RuntimeError("Unexpected test database port.")


def sql(statement):
    guard()
    result = run(
        [
            "docker",
            "exec",
            "-i",
            CONTAINER,
            "psql",
            "-X",
            "-U",
            "postgres",
            "-d",
            "postgres",
            "-v",
            "ON_ERROR_STOP=1",
            "-At",
        ],
        input=statement,
    )
    if result.returncode:
        raise RuntimeError("Local SQL failed: " + result.stderr[:1800])
    return result.stdout


def status():
    guard()
    result = cli("status", "-o", "json")
    if result.returncode:
        raise RuntimeError("Could not obtain disposable stack status.")
    value = json.loads(result.stdout)
    loopback(value["API_URL"])
    if value["API_URL"] != API:
        raise RuntimeError("Unexpected API project port.")
    return value


def main():
    import sys

    action = sys.argv[1]
    if action not in ("start", "test", "reset"):
        raise SystemExit("Allowed: start, test, reset (disposable project only).")
    sync()
    if action != "start":
        guard()
    result = cli(
        *(
            {
                "start": ["start", "--exclude", "studio,edge-runtime,logflare,vector,supavisor"],
                "test": ["test", "db"],
                "reset": ["db", "reset", "--local"],
            }[action]
        )
    )
    if action == "test":
        print(result.stdout[-14000:])
        print(result.stderr[-4000:])
    else:
        for line in (result.stdout + result.stderr).splitlines():
            if not any(
                secret in line.lower()
                for secret in ("key", "password", "secret", "token", "eyj", "sb_")
            ):
                if any(
                    word in line.lower()
                    for word in ("migration", "error", "failed", "started", "reset")
                ):
                    print(line[:250])
    print("Local command exit:", result.returncode)
    raise SystemExit(result.returncode)


if __name__ == "__main__":
    main()
