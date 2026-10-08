r"""Count CastraVision demo rows through the Supabase Data API.

Run from the repository root after applying the schema and demo seed:
    .venv\Scripts\python.exe supabase\check_seed.py

Requires SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) in .env or
the process environment. Keep this key on the backend only.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv

try:
    from supabase import create_client
except ImportError as exc:
    raise SystemExit(
        "Missing Supabase Python client. Install: "
        "python -m pip install -r supabase/requirements-check.txt"
    ) from exc


ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

URL = os.getenv(
    "SUPABASE_URL", "https://oviqgptccjjdaaqxabwv.supabase.co"
)
KEY = os.getenv("SUPABASE_SECRET_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
if not KEY:
    raise SystemExit(
        "Set SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY in .env "
        "or the process environment."
    )

MINIMUM_ROWS = {
    "business_profiles": 1,
    "campaign_performance": 18,
    "strategies": 3,
    "strategy_context_embeddings": 0,
    "ad_contents": 6,
    "budget_proposals": 2,
    "approvals": 2,
    "notifications": 4,
    "audit_logs": 4,
    "competitor_insights": 1,
    "reports": 1,
    "workspace_members": 1,
}


def main() -> int:
    client = create_client(URL, KEY)
    result = (
        client.table("workspaces")
        .select("id")
        .eq("name", "Cafe Ông Bụt")
        .execute()
    )
    workspaces = result.data or []
    if len(workspaces) != 1:
        print(f"Expected one Cafe Ông Bụt workspace; found {len(workspaces)}.")
        return 1

    workspace_id = workspaces[0]["id"]
    failed = False
    print("Cafe Ông Bụt demo row counts:")
    for table_name, minimum in MINIMUM_ROWS.items():
        response = (
            client.table(table_name)
            .select("*", count="exact", head=True)
            .eq("workspace_id", workspace_id)
            .execute()
        )
        count = response.count or 0
        status = "OK" if count >= minimum else "MISSING"
        print(f"  {table_name}: {count} (expected at least {minimum}) [{status}]")
        failed |= count < minimum

    return 1 if failed else 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        raise SystemExit(f"Supabase verification failed: {exc}") from exc
