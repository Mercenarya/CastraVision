"""Prepare/start an isolated local stack. Never prints CLI credentials."""

import re
import shutil
import subprocess
import sys
from pathlib import Path

repo = Path(__file__).resolve().parents[2]
stack = repo / ".tmp" / "mm-functional-test"
(stack / "supabase").mkdir(parents=True, exist_ok=True)
shutil.copytree(
    repo / "supabase" / "migrations", stack / "supabase" / "migrations", dirs_exist_ok=True
)
config = """project_id = "CastraVision-mm-functional-test"
[api]
enabled = true
port = 60321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000
[db]
port = 60322
shadow_port = 60320
major_version = 17
[db.seed]
enabled = false
[studio]
enabled = false
port = 60323
[inbucket]
enabled = true
port = 60324
smtp_port = 60325
pop3_port = 60326
[auth]
enabled = true
site_url = "http://127.0.0.1:60300"
additional_redirect_urls = ["http://127.0.0.1:60300/**"]
enable_signup = true
[auth.email]
enable_signup = true
enable_confirmations = true
[analytics]
enabled = false
port = 60327
[edge_runtime]
enabled = false
"""
(stack / "supabase" / "config.toml").write_text(config, encoding="utf-8")
command = ["db", "reset", "--local"] if sys.argv[1:] == ["reset"] else ["start"]
result = subprocess.run(
    ["npx.cmd", "--yes", "supabase@2.121.0", "--workdir", str(stack), *command],
    capture_output=True,
    text=True,
    encoding="utf-8",
    errors="replace",
)
output = result.stdout + result.stderr
safe = re.sub(r"eyJ[\w-]+\.[\w-]+\.[\w-]+", "[REDACTED]", output)
safe = "\n".join(
    line
    for line in safe.splitlines()
    if not re.search(r"(?i)secret|password|api.key|anon.key|service.role|publishable|S3.*key", line)
)
print(safe[-5000:])
raise SystemExit(result.returncode)
