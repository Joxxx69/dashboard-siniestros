"""
Script de seed: pobla provincias y cantones en Supabase
consumiendo la API interna de catálogo de ubicación.

Uso:
    python seed_ubicaciones.py

Variables en .env:
    SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
    API_BASE_URL
    API_TOKEN
"""

import os
import sys
import requests
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# ── Config ───────────────────────────────────────────────────────

API_BASE = os.environ["API_BASE_URL"].rstrip("/")
TOKEN    = os.environ["API_TOKEN"]
HEADERS  = {"Authorization": f"Bearer {TOKEN}"}

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

ENDPOINT_PROVINCIAS = f"{API_BASE}/findAll"
ENDPOINT_CANTONES   = f"{API_BASE}/findCantonesByUbiIdProvincia"

print(f"API_BASE_URL: {API_BASE}")
print(f"ENDPOINT_PROVINCIAS: {ENDPOINT_PROVINCIAS}")
print(f"ENDPOINT_CANTONES: {ENDPOINT_CANTONES}")

# ── Normalización ────────────────────────────────────────────────

def normalize(value: str) -> str:
    """'MORONA SANTIAGO' → 'Morona Santiago'"""
    return str(value).strip().title().replace("  ", " ")

# ── API ──────────────────────────────────────────────────────────

def fetch_provincias() -> list[dict]:
    resp = requests.get(ENDPOINT_PROVINCIAS, headers=HEADERS, timeout=10)
    resp.raise_for_status()
    return resp.json()

def fetch_cantones(ubi_id: int) -> list[dict]:
    resp = requests.get(f"{ENDPOINT_CANTONES}/{ubi_id}", headers=HEADERS, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    return data.get("cantones", [])

# ── Seed ─────────────────────────────────────────────────────────

def seed(client: Client):
    provincias_api = fetch_provincias()

    total_prov   = 0
    total_cant   = 0
    errors       = []

    for prov in provincias_api:
        # Provincias sin ubi_id (ej: ISLA) no tienen cantones → skip
        if prov["ubi_id"] is None:
            print(f"  SKIP provincia sin ubi_id: {prov['pro_descripcion']}")
            continue

        nombre_prov = normalize(prov["pro_descripcion"])
        ubi_id      = prov["ubi_id"]

        try:
            # Upsert provincia
            result = client.table("provincias").upsert(
                {"nombre": nombre_prov},
                on_conflict="nombre",
            ).execute()
            provincia_id = result.data[0]["id"]
            total_prov += 1
            print(f"\n[{total_prov}] {nombre_prov} (supabase id={provincia_id})")

            # Cantones de esta provincia
            cantones_api = fetch_cantones(ubi_id)

            for canton in cantones_api:
                nombre_canton = normalize(canton["can_descripcion"])
                try:
                    client.table("cantones").upsert(
                        {
                            "nombre":      nombre_canton,
                            "provincia_id": provincia_id,
                        },
                        on_conflict="nombre,provincia_id",
                    ).execute()
                    total_cant += 1
                    print(f"    ✓ {nombre_canton}")
                except Exception as exc:
                    errors.append({
                        "nivel":    "canton",
                        "nombre":   nombre_canton,
                        "provincia": nombre_prov,
                        "error":    str(exc),
                    })
                    print(f"    ✗ {nombre_canton} — {exc}")

        except Exception as exc:
            errors.append({"nivel": "provincia", "nombre": nombre_prov, "error": str(exc)})
            print(f"  ERROR provincia {nombre_prov}: {exc}")

    # Resumen
    print(f"\n{'='*50}")
    print(f"Provincias insertadas : {total_prov}")
    print(f"Cantones insertados   : {total_cant}")
    print(f"Errores               : {len(errors)}")
    if errors:
        for e in errors:
            print(f"  [{e['nivel']}] {e.get('provincia','')} / {e['nombre']}: {e['error']}")
        sys.exit(1)


if __name__ == "__main__":
    print("Conectando a Supabase...")
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print(f"Consultando API: {ENDPOINT_PROVINCIAS}\n")
    seed(client)
