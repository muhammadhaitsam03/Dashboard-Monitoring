import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

# Initialize the Supabase client
# Ensure the .env file has valid values before creating the client to avoid errors
supabase: Client | None = None
if url and key and "YOUR_SUPABASE" not in key:
    supabase = create_client(url, key)
else:
    print("WARNING: Supabase URL and KEY are not properly configured in .env")
