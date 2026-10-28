import os,sys
from pathlib import Path

from dotenv import load_dotenv
from supabase import Client, create_client

CURRENT = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(CURRENT,"..")
sys.path.append(ROOT)
ENV = os.path.join(ROOT,".env")


load_dotenv(ENV)

# Prefer the legacy name for compatibility, then use the current backend key names.
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = (
    os.getenv("SUPABASE_KEY")
    or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("SUPABASE_SECRET_KEY")
    or os.getenv("SUPABASE_PUBLISHABLE_KEY")
    or os.getenv("SUPABASE_ANON_KEY")
)

if not supabase_url or not supabase_key:
    raise ValueError(
        "SUPABASE_URL and a Supabase API key must be set in the environment"
    )

supabase: Client = create_client(supabase_url, supabase_key)

def get_supabase_client() -> Client:
    return supabase