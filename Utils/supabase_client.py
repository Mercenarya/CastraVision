import os
from pathlib import Path

from dotenv import load_dotenv

from supabase import Client, create_client

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

# Accept the current publishable key names while retaining legacy compatibility.
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = (
    os.getenv("SUPABASE_KEY")
    or os.getenv("SUPABASE_PUBLISHABLE_KEY")
    or os.getenv("SUPABASE_ANON_KEY")
)

supabase: Client | None = None

def get_supabase_client() -> Client:
    global supabase
    if supabase is None:
        if not supabase_url or not supabase_key:
            raise ValueError(
                "SUPABASE_URL and a Supabase publishable/anon key "
                "must be set in environment variables"
            )
        supabase = create_client(supabase_url, supabase_key)
    return supabase
