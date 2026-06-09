"""
Script de seed: pobla la tabla estados_siniestro en Supabase.

Uso:
    python seed_estados.py
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

ESTADOS = [
    ("AJUSTADO",      "Ajustado"),
    ("CERRADO",       "Cerrado"),
    ("DESISTE",       "Desiste"),
    ("INSPECCIONADO", "Inspeccionado"),
    ("LIQUIDADO",     "Liquidado"),
    ("NEGADO",        "Negado"),
    ("PAGADO",        "Pagado"),
]


def seed():
    client = create_client(SUPABASE_URL, SUPABASE_KEY)

    print(f"Insertando {len(ESTADOS)} estados...\n")

    inserted = 0
    errors   = []

    for codigo, nombre in ESTADOS:
        try:
            client.table("estados_siniestro").upsert(
                {"codigo": codigo, "nombre": nombre},
                on_conflict="codigo",
            ).execute()
            inserted += 1
            print(f"  ✓ {codigo} — {nombre}")
        except Exception as exc:
            errors.append({"codigo": codigo, "error": str(exc)})
            print(f"  ✗ {codigo} — {exc}")

    print(f"\n{'='*50}")
    print(f"Insertados : {inserted}")
    print(f"Errores    : {len(errors)}")
    if errors:
        for e in errors:
            print(f"  {e['codigo']}: {e['error']}")
        sys.exit(1)


if __name__ == "__main__":
    seed()
