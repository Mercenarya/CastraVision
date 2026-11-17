"""Start this worktree against the guarded disposable Supabase stack, no .env edits."""

import json
import os
import subprocess
import sys

from local_stack import API, ROOT, status


def main():
    config = status()
    env = {**os.environ, "SUPABASE_URL": API,
           "SUPABASE_PUBLISHABLE_KEY": config["ANON_KEY"],
           "SUPABASE_SERVICE_ROLE_KEY": config["SERVICE_ROLE_KEY"],
           "BACKEND_CORS_ORIGINS": "http://127.0.0.1:57300,http://localhost:57300",
           "VITE_SUPABASE_URL": API,
           "VITE_SUPABASE_PUBLISHABLE_KEY": config["ANON_KEY"],
           "VITE_API_PROXY_TARGET": "http://127.0.0.1:58000",
           "VITE_API_BASE_URL": "", "VITE_API_URL": ""}
    scratch = ROOT / ".tmp/membership-app"
    scratch.mkdir(parents=True, exist_ok=True)
    processes = {}
    for name, command, cwd in (
        ("backend", [sys.executable, "manage.py", "runserver", "127.0.0.1:58000", "--noreload"], ROOT),
        ("frontend", ["node", "node_modules/vite/bin/vite.js", "--host", "127.0.0.1",
                      "--port", "57300", "--strictPort"], ROOT / "CastraView"),
    ):
        with (scratch / (name + ".log")).open("w", encoding="utf-8") as log:
            process = subprocess.Popen(command, cwd=cwd, env=env, stdin=subprocess.DEVNULL,
                                       stdout=log, stderr=log,
                                       creationflags=subprocess.CREATE_NO_WINDOW)
            processes[name] = process.pid
    (scratch / "processes.json").write_text(json.dumps(processes), encoding="utf-8")
    print("Local test frontend: http://127.0.0.1:57300; backend: http://127.0.0.1:58000")


if __name__ == "__main__":
    main()
