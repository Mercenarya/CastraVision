import os
from supabase import Client, create_client

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_PUBLISHABLE_KEY")
supabase: Client | None = (
    create_client(supabase_url, supabase_key)
    if supabase_url and supabase_key
    else None
)


def get_supabase_client() -> Client:
    if supabase is None:
        raise RuntimeError("Supabase is not configured for this environment.")
    return supabase