"""Rollback-only concurrency check on the guarded, disposable platform stack."""

import json
import subprocess
import time
from uuid import UUID

from run_platform_local import CONTAINER, ROOT, checked_container

checked_container()
report = ROOT / "docs/UI/audits/2026-11-20/system-admin-real-local.json"
workspace = str(UUID(json.loads(report.read_text(encoding="utf-8"))["workspace"]))
command = [
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
]


def sql(source):
    return subprocess.run(command, input=source, capture_output=True, text=True, check=True).stdout


if (
    sql(f"select count(*) from public.business_profiles where workspace_id='{workspace}';")
    .splitlines()[2]
    .strip()
    != "1"
):
    raise SystemExit("Expected exactly one disposable profile; refusing concurrency probe.")

# UPDATE's trigger takes a shared metadata lock; neither connection commits writes.
writer = subprocess.Popen(
    command, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
)
writer.stdin.write(
    "begin; update public.business_profiles set updated_at=updated_at "
    f"where workspace_id='{workspace}';\n"
    "\\echo LOCK_HELD\nselect pg_sleep(2); rollback;\n"
)
writer.stdin.close()
try:
    while True:
        line = writer.stdout.readline()
        if not line:
            raise RuntimeError("Writer exited before acquiring its guard lock.")
        if line.strip() == "LOCK_HELD":
            break
    start = time.monotonic()
    sql(
        "begin; set local lock_timeout='6s'; "
        "update platform_private.companies set status='Inactive' "
        f"where workspace_id='{workspace}'; rollback;"
    )
    elapsed = time.monotonic() - start
    writer.wait(timeout=8)
    if writer.returncode or elapsed < 1:
        raise RuntimeError("Suspension did not wait for the previously authorized writer.")
    result = {
        "case": "suspension waits for existing business writer",
        "passed": True,
        "waitSeconds": round(elapsed, 3),
        "bothTransactionsRolledBack": True,
    }
    (report.parent / "system-admin-lock-check.json").write_text(
        json.dumps(result, indent=2), encoding="utf-8"
    )
    print(json.dumps(result))
finally:
    if writer.poll() is None:
        writer.terminate()
