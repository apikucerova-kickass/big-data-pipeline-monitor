import os
import httpx
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Hlavičky pro každý požadavek na Supabase
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def supabase_get(table: str, params: dict = None):
    """Načte data z tabulky."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    response = httpx.get(url, headers=HEADERS, params=params or {})
    response.raise_for_status()
    return response.json()

def supabase_post(table: str, data: dict):
    """Vloží nový záznam do tabulky."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    response = httpx.post(url, headers=HEADERS, json=data)
    response.raise_for_status()
    return response.json()

def supabase_patch(table: str, params: dict, data: dict):
    """Aktualizuje záznam v tabulce."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    response = httpx.patch(url, headers=HEADERS, params=params, json=data)
    response.raise_for_status()
    return response.json()

def supabase_delete(table: str, params: dict):
    """Smaže záznam z tabulky."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    response = httpx.delete(url, headers=HEADERS, params=params)
    response.raise_for_status()
    return response.json()