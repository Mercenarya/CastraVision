"""Isolated browser UI and memory-only OTP fixture bridge; local ports only."""

import html
import json
import os
import re
import secrets
import subprocess
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse
from uuid import uuid4

import httpx
from run_platform_local import ROOT, STACK, checked_container

checked_container()
result = subprocess.run(
    ["npx.cmd", "--yes", "supabase@2.121.0", "--workdir", str(STACK), "status", "-o", "json"],
    capture_output=True,
    text=True,
    encoding="utf-8",
    check=True,
)
keys = json.loads(result.stdout)
if keys.get("API_URL") != "http://127.0.0.1:61321":
    raise SystemExit("Local API guard failed")
env = {
    **os.environ,
    "VITE_SUPABASE_URL": keys["API_URL"],
    "VITE_SUPABASE_PUBLISHABLE_KEY": keys["ANON_KEY"],
    "VITE_API_BASE_URL": "http://127.0.0.1:61380",
    "VITE_API_PROXY_TARGET": "http://127.0.0.1:61380",
}
child = subprocess.Popen(
    ["npm.cmd", "run", "dev", "--", "--host", "127.0.0.1", "--port", "61300", "--strictPort"],
    cwd=ROOT / "CastraView",
    env=env,
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)
fixture = {
    "email": "platform-browser-" + uuid4().hex[:12] + "@example.test",
    "password": secrets.token_urlsafe(30) + "aA1!",
}


class Bridge(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_GET(self):
        if self.headers.get("Origin") != "http://127.0.0.1:61300":
            self.send_error(403)
            return
        value = fixture
        if self.path == "/mail":
            value = {"ready": False}
            messages = (
                httpx.get("http://127.0.0.1:61324/api/v1/messages").json().get("messages", [])
            )
            for message in messages:
                if any(x.get("Address") == fixture["email"] for x in message.get("To", [])):
                    content = httpx.get(
                        "http://127.0.0.1:61324/api/v1/message/" + message["ID"]
                    ).json()
                    for link in re.findall(r"href=[\"\x27]([^\"\x27]+)", content.get("HTML", "")):
                        link = html.unescape(link)
                        parsed = urlparse(link)
                        if (
                            parsed.hostname in ("127.0.0.1", "localhost")
                            and parsed.port == 61321
                            and "/auth/v1/verify" in parsed.path
                        ):
                            value = {"ready": True, "link": link}
                            break
                    break
        elif self.path != "/fixture":
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "http://127.0.0.1:61300")
        self.end_headers()
        self.wfile.write(json.dumps(value).encode())


try:
    print("Isolated UI 61300; local fixture bridge 61381; credentials never printed.", flush=True)
    HTTPServer(("127.0.0.1", 61381), Bridge).serve_forever()
finally:
    child.terminate()
