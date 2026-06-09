"""
Script de seed: pobla la tabla cultivos en Supabase.

Uso:
    python seed_cultivos.py
"""



import os
import sys
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

# ── Valores raw del Excel → normalizados ─────────────────────────
# Reglas aplicadas:
#   - Title Case
#   - Tildes y ñ correctas
#   - Separador compuesto uniformizado a " + "
#   - "Arverja" corregido a "Arveja"
#   - "de/de Árbol" en minúsculas (preposición)

NORMALIZATION_MAP: dict[str, str] = {
    "AGUACATE":                        "Aguacate",
    "ALGODON URPIMA":                  "Algodón Urpima",
    "ARROZ":                           "Arroz",
    "ARVEJA":                          "Arveja",
    "BANANO":                          "Banano",
    "CACAO":                           "Cacao",
    "CACAO+PLATANO":                   "Cacao + Plátano",
    "CACAO - PLATANO":                 "Cacao + Plátano",
    "CAFE":                            "Café",
    "Café":                            "Café",
    "CANA DE AZUCAR FORMACION":        "Caña de Azúcar Formación",
    "CAÑA DE AZÚCAR FORMACIÓN":        "Caña de Azúcar Formación",
    "CEBADA":                          "Cebada",
    "CEBOLLA COLORADA":                "Cebolla Colorada",
    "Cebolla colorada":                "Cebolla Colorada",
    "CEBOLLA PERLA":                   "Cebolla Perla",
    "FREJOL":                          "Fréjol",
    "FRÉJOL":                          "Fréjol",
    "HABA":                            "Haba",
    "MAIZ - FREJOL":                   "Maíz - Fréjol",
    "Maíz - Frejol":                   "Maíz - Fréjol",
    "Maíz - Arverja":                  "Maíz - Arveja",
    "MAIZ DURO":                       "Maíz Duro",
    "MAÍZ DURO":                       "Maíz Duro",
    "MAIZ SUAVE":                      "Maíz Suave",
    "MAIZ SUAVE + ARVEJA":             "Maíz Suave + Arveja",
    "MAIZ SUAVE + FREJOL":             "Maíz Suave + Fréjol",
    "MÁIZ SUAVE+FREJOL":               "Maíz Suave + Fréjol",
    "MAIZ SUAVE + HABA":               "Maíz Suave + Haba",
    "MAÍZ SUAVE+HABA":                 "Maíz Suave + Haba",
    "MANI":                            "Maní",
    "PALMA AFRICANA":                  "Palma Africana",
    "Palma Africana":                  "Palma Africana",
    "PAPA":                            "Papa",
    "PIMIENTO":                        "Pimiento",
    "Pimiento":                        "Pimiento",
    "PILA":                            "Pila",
    "PINA":                            "Piña",
    "PIÑA":                            "Piña",
    "PITAHAYA":                        "Pitahaya",
    "PLATANO":                         "Plátano",
    "PLÁTANO":                         "Plátano",
    "QUINUA":                          "Quinua",
    "SOYA":                            "Soya",
    "TOMATE DE ARBOL":                 "Tomate de Árbol",
    "TOMATE HORTICOLA CAMPO ABIERTO":  "Tomate Hortícola Campo Abierto",
    "TOMATE HORTÍCOLA CAMPO ABIERTO":  "Tomate Hortícola Campo Abierto",
    "TRIGO":                           "Trigo",
    "BROCOLI":                         "Brócoli",
}

# ── Lista fuente (raw, tal cual en el Excel) ──────────────────────
CULTIVOS_RAW = [
    "AGUACATE",
    "ALGODON URPIMA",
    "ARROZ",
    "ARVEJA",
    "BANANO",
    "CACAO",
    "CACAO+PLATANO",
    "Café",
    "CAÑA DE AZÚCAR FORMACIÓN",
    "CEBADA",
    "Cebolla colorada",
    "CEBOLLA PERLA",
    "FRÉJOL",
    "HABA",
    "Maíz - Arverja",
    "Maíz - Frejol",
    "MAÍZ DURO",
    "MAIZ SUAVE",
    "MAIZ SUAVE + ARVEJA",
    "MÁIZ SUAVE+FREJOL",
    "MAÍZ SUAVE+HABA",
    "MANI",
    "Palma Africana",
    "PAPA",
    "Pimiento",
    "PILA",
    "PIÑA",
    "PITAHAYA",
    "PLÁTANO",
    "QUINUA",
    "SOYA",
    "TOMATE HORTÍCOLA CAMPO ABIERTO",
    "TRIGO",
    "TOMATE DE ARBOL",
    "BROCOLI",
]


# ── Normalización ────────────────────────────────────────────────

def normalize(raw: str) -> str:
    return NORMALIZATION_MAP.get(raw, " ".join(raw.strip().title().split()))


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
