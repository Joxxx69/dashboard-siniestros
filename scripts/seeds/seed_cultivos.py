"""
Script de seed: pobla la tabla cultivos en Supabase.

Uso:
    python seed_cultivos.py
"""



import os
import sys
import unicodedata
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

def strip_accents(text: str) -> str:
    return " ".join(
        "".join(c for c in unicodedata.normalize("NFD", w) if unicodedata.category(c) != "Mn")
        for w in str(text).strip().lower().split()
    )


def cultivo_key(text: str) -> str:
    """'Maíz - Fréjol' → 'maiz frejol' — sin tildes, sin signos, lowercase."""
    no_accents = strip_accents(text)
    alnum_only = "".join(c if c.isalnum() else " " for c in no_accents)
    return " ".join(alnum_only.split())


CULTIVO_CANONICAL: dict[str, str] = {
    "aguacate":                       "Aguacate",
    "algodon urpima":                 "Algodón Urpima",
    "arroz":                          "Arroz",
    "arveja":                         "Arveja",
    "banano":                         "Banano",
    "cacao":                          "Cacao",
    "cacao platano":                  "Cacao + Plátano",
    "cafe":                           "Café",
    "cana de azucar formacion":       "Caña de Azúcar Formación",
    "cebada":                         "Cebada",
    "cebolla colorada":               "Cebolla Colorada",
    "cebolla perla":                  "Cebolla Perla",
    "frejol":                         "Fréjol",
    "haba":                           "Haba",
    "maiz arveja":                    "Maíz Suave + Arveja",
    "maiz arverja":                   "Maíz Suave + Arveja",
    "maiz frejol":                    "Maíz Suave + Fréjol",
    "maiz duro":                      "Maíz Duro",
    "maiz suave":                     "Maíz Suave",
    "maiz suave arveja":              "Maíz Suave + Arveja",
    "maiz suave frejol":              "Maíz Suave + Fréjol",
    "maiz suave haba":                "Maíz Suave + Haba",
    "mani":                           "Maní",
    "palma africana":                 "Palma Africana",
    "papa":                           "Papa",
    "pimiento":                       "Pimiento",
    "pina":                           "Piña",
    "pitahaya":                       "Pitahaya",
    "platano":                        "Plátano",
    "quinua":                         "Quinua",
    "soya":                           "Soya",
    "tomate de arbol":                "Tomate de Árbol",
    "tomate horticola campo abierto": "Tomate Hortícola Campo Abierto",
    "trigo":                          "Trigo",
    "brocoli":                        "Brócoli",
}

# ── Lista fuente (valores canónicos del mapa) ─────────────────────
CULTIVOS_RAW = list(CULTIVO_CANONICAL.values())


# ── Normalización ────────────────────────────────────────────────

def normalize(raw: str) -> str:
    return CULTIVO_CANONICAL.get(cultivo_key(raw), " ".join(raw.strip().title().split()))


def build_unique(raw_list: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for raw in raw_list:
        normalized = normalize(raw)
        key = normalized.lower()
        if key not in seen:
            seen.add(key)
            result.append(normalized)
    return result


# ── Seed ─────────────────────────────────────────────────────────

def seed() -> None:
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    cultivos = build_unique(CULTIVOS_RAW)

    print(f"Insertando {len(cultivos)} cultivos...\n")

    inserted = 0
    errors: list[dict] = []

    for nombre in cultivos:
        try:
            client.table("cultivos").upsert(
                {"nombre": nombre},
                on_conflict="nombre",
            ).execute()
            inserted += 1
            print(f"  ✓ {nombre}")
        except Exception as exc:
            errors.append({"nombre": nombre, "error": str(exc)})
            print(f"  ✗ {nombre} — {exc}")

    print(f"\n{'='*40}")
    print(f"Insertados : {inserted}")
    print(f"Errores    : {len(errors)}")
    if errors:
        for e in errors:
            print(f"  {e['nombre']}: {e['error']}")
        sys.exit(1)


if __name__ == "__main__":
    seed()
