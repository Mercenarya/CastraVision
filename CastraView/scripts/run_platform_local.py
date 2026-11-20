"""Isolated platform test stack; no hosted mode and no reset command."""

import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROJECT = "CastraVision-platform-test"
CONTAINER = "supabase_db_" + PROJECT
STACK = ROOT / ".tmp" / "platform-test"


def checked_container():
    result = subprocess.run(["docker", "inspect", CONTAINER], capture_output=True, text=True)
    if result.returncode:
        raise SystemExit("The isolated platform container is unavailable.")
    info = json.loads(result.stdout)[0]
    if (
        not info["State"]["Running"]
        or info["Config"]["Labels"].get("com.supabase.cli.project") != PROJECT
    ):
        raise SystemExit("Platform test container identity/running guard failed.")


def main():
    global PROJECT, CONTAINER, STACK
    action = sys.argv[1] if len(sys.argv) > 1 else "start"
    brand_clean = action.endswith("-brand-clean")
    if brand_clean:
        action = action.replace("-brand-clean", "-clean")
    employee_clean = action.endswith("-employee-clean")
    if employee_clean:
        action = action.replace("-employee-clean", "-clean")
    clean = action.endswith("-clean")
    if clean:
        PROJECT = "CastraVision-platform-clean-test"
        CONTAINER = "supabase_db_" + PROJECT
        STACK = ROOT / ".tmp" / "platform-clean-test"
        action = action.removesuffix("-clean")
    if employee_clean:
        PROJECT = "CastraVision-employee-clean-test"
        CONTAINER = "supabase_db_" + PROJECT
        STACK = ROOT / ".tmp" / "employee-clean-test"
    if brand_clean:
        PROJECT = "CastraVision-brand-clean-test"
        CONTAINER = "supabase_db_" + PROJECT
        STACK = ROOT / ".tmp" / "brand-clean-test"
    if action == "start":
        (STACK / "supabase").mkdir(parents=True, exist_ok=True)
        shutil.copytree(
            ROOT / "supabase/migrations", STACK / "supabase/migrations", dirs_exist_ok=True
        )
        config = (ROOT / "CastraView/scripts/run_mm_local.py").read_text(encoding="utf-8")
        config = config.split('config = """', 1)[1].split('"""', 1)[0]
        config = config.replace("CastraVision-mm-functional-test", PROJECT).replace(
            "603", "643" if brand_clean else "633" if employee_clean else "623" if clean else "613"
        )
        (STACK / "supabase/config.toml").write_text(config, encoding="utf-8")
        command = ["npx.cmd", "--yes", "supabase@2.121.0", "--workdir", str(STACK), "start"]
        if clean:
            command += [
                "--exclude",
                "gotrue,realtime,storage-api,imgproxy,kong,mailpit,postgrest,postgres-meta,studio,edge-runtime,logflare,vector,supavisor",
            ]
        result = subprocess.run(
            command, capture_output=True, text=True, encoding="utf-8", errors="replace"
        )
        output = re.sub(r"eyJ[\w-]+\.[\w-]+\.[\w-]+", "[REDACTED]", result.stdout + result.stderr)
        safe = [
            line
            for line in output.splitlines()
            if not re.search(
                r"(?i)secret|password|api.key|anon.key|service.role|publishable|S3.*key|sb_|db_url|postgresql://",
                line,
            )
        ]
        print("\n".join(safe[-30:]))
        if result.returncode:
            raise SystemExit(result.returncode)
        checked_container()
        print(
            "Clean isolated database ready on "
            + ("64322." if brand_clean else "63322." if employee_clean else "62322.")
            if clean
            else "Isolated platform stack ready; API 61321, DB 61322, mail 61324."
        )
    elif action == "suite":
        checked_container()
        failed = []
        total = 0
        for source in sorted((ROOT / "supabase" / "tests").glob("*.test.sql")):
            result = subprocess.run(
                [
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
                ],
                input=source.read_text(encoding="utf-8"),
                capture_output=True,
                text=True,
                encoding="utf-8",
            )
            bad = result.returncode or re.search(r"not ok \d", result.stdout)
            tests = len(re.findall(r"\bok \d+ -", result.stdout))
            total += tests
            print(source.name + ": " + ("FAIL" if bad else "PASS") + " (" + str(tests) + ")")
            if bad:
                failed.append(source.name)
                print((result.stdout + result.stderr)[-4000:])
        print("TOTAL assertions:", total, "failed files:", len(failed))
        raise SystemExit(bool(failed))
    elif action in ("sql", "test") and len(sys.argv) == 3:
        checked_container()
        source = (ROOT / sys.argv[2]).resolve()
        if not source.is_relative_to(ROOT / "supabase") or source.suffix != ".sql":
            raise SystemExit("Only repository Supabase SQL files are allowed.")
        command = [
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
        ]
        result = subprocess.run(
            command,
            input=source.read_text(encoding="utf-8"),
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        print((result.stdout + result.stderr)[-7000:])
        raise SystemExit(result.returncode or (1 if re.search(r"not ok \d", result.stdout) else 0))
    else:
        raise SystemExit("Usage: run_platform_local.py start | sql/test supabase/path.sql")


if __name__ == "__main__":
    main()
