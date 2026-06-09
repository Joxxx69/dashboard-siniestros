"""
Script de seed: pobla la tabla causas_siniestro en Supabase.

Uso:
    python seed_causas.py
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
#   - Title Case (preposiciones "de/y" en minúsculas)
#   - Tildes correctas: Inundación, Sequía, Caída
#   - Singular en causa primaria: "Deslizamientos" → "Deslizamiento"
#   - Separador compuesto uniformizado a " - "
#   - Typos corregidos: "excesode", guiones pegados, "y" → " - "

NORMALIZATION_MAP: dict[str, str] = {
    # ── Simples ───────────────────────────────────────────────────
    "Bajas temperaturas":                                                          "Bajas Temperaturas",
    "Caida de ceniza":                                                             "Caída de Ceniza",
    "Deslizamiento":                                                               "Deslizamiento",
    "Enfermedades Incontrolables":                                                 "Enfermedades Incontrolables",
    "Exceso de Humedad":                                                           "Exceso de Humedad",
    "Granizada":                                                                   "Granizada",
    "Helada":                                                                      "Helada",
    "Incendio":                                                                    "Incendio",
    "Inundacion":                                                                  "Inundación",
    "Plagas Incontrolables":                                                       "Plagas Incontrolables",
    "Sequia":                                                                      "Sequía",
    "Taponamiento":                                                                "Taponamiento",
    "Vientos fuertes":                                                             "Vientos Fuertes",

    # ── Bajas Temperaturas compuestas ────────────────────────────
    "Bajas temperaturas - Enfermedades incontrolables":                            "Bajas Temperaturas - Enfermedades Incontrolables",

    # ── Deslizamiento compuestas (singular) ──────────────────────
    "Deslizamientos - Exceso de humedad":                                          "Deslizamiento - Exceso de Humedad",
    "Deslizamientos - Granizada":                                                  "Deslizamiento - Granizada",
    "Deslizamientos - Inundacion":                                                 "Deslizamiento - Inundación",
    "Deslizamientos - Plagas incontrolables":                                      "Deslizamiento - Plagas Incontrolables",
    "Deslizamientos - Taponamiento":                                               "Deslizamiento - Taponamiento",
    "Deslizamientos - Vientos fuertes":                                            "Deslizamiento - Vientos Fuertes",

    # ── Enfermedades Incontrolables compuestas ───────────────────
    "Enfermedades incontrolables - Exceso de humedad":                             "Enfermedades Incontrolables - Exceso de Humedad",
    "Enfermedades Incontrolables - Exceso de Humedad":                             "Enfermedades Incontrolables - Exceso de Humedad",
    "Enfermedades Incontrolables-Exceso de Humedad":                               "Enfermedades Incontrolables - Exceso de Humedad",
    "Enfermedades incontrolables - Helada - Sequia":                               "Enfermedades Incontrolables - Helada - Sequía",
    "Enfermedades incontrolables - Inundacion":                                    "Enfermedades Incontrolables - Inundación",
    "Enfermedades incontrolables - Plagas incontrolables":                         "Enfermedades Incontrolables - Plagas Incontrolables",
    "Enfermedades incontrolables - Plagas incontrolables - Sequia":                "Enfermedades Incontrolables - Plagas Incontrolables - Sequía",
    "Enfermedades incontrolables - Plagas incontrolables - Vientos fuertes":       "Enfermedades Incontrolables - Plagas Incontrolables - Vientos Fuertes",
    "Enfermedades incontrolables - Sequia":                                        "Enfermedades Incontrolables - Sequía",
    "Enfermedades incontrolables - Vientos fuertes":                               "Enfermedades Incontrolables - Vientos Fuertes",

    # ── Exceso de Humedad compuestas ─────────────────────────────
    "Exceso de humedad - enfermedades incontrolables":                             "Exceso de Humedad - Enfermedades Incontrolables",
    "Exceso de humedad - Enfermedades incontrolables":                             "Exceso de Humedad - Enfermedades Incontrolables",
    "excesode humedad y enfermedades incontrolables":                              "Exceso de Humedad - Enfermedades Incontrolables",
    "Exceso de humedad y enfermedades incontrolables":                             "Exceso de Humedad - Enfermedades Incontrolables",
    "Exceso de humedad - Inundacion":                                              "Exceso de Humedad - Inundación",
    "Exceso de humedad - Inundacion - Plagas incontrolables":                      "Exceso de Humedad - Inundación - Plagas Incontrolables",
    "Exceso de humedad - Inundacion - Taponamiento":                               "Exceso de Humedad - Inundación - Taponamiento",
    "Exceso de humedad - Inundacion - Vientos fuertes":                            "Exceso de Humedad - Inundación - Vientos Fuertes",
    "Exceso de humedad - Plagas incontrolables":                                   "Exceso de Humedad - Plagas Incontrolables",
    "Exceso de humedad - Sequia":                                                  "Exceso de Humedad - Sequía",
    "Exceso de humedad - Taponamiento":                                            "Exceso de Humedad - Taponamiento",
    "Exceso de humedad - Vientos fuertes":                                         "Exceso de Humedad - Vientos Fuertes",

    # ── Granizada compuestas ──────────────────────────────────────
    "Granizada - Sequia":                                                          "Granizada - Sequía",
    "Granizada - Vientos fuertes":                                                 "Granizada - Vientos Fuertes",

    # ── Helada compuestas ─────────────────────────────────────────
    "Helada - Plagas incontrolables":                                              "Helada - Plagas Incontrolables",
    "Helada - Sequia":                                                             "Helada - Sequía",

    # ── Inundación compuestas ─────────────────────────────────────
    "Inundacion - Plagas incontrolables":                                          "Inundación - Plagas Incontrolables",
    "Inundacion - Vientos fuertes":                                                "Inundación - Vientos Fuertes",
    "Inundacion - Exceso de humedad":                                              "Inundación - Exceso de Humedad",
    "Inundacion-exceso de humedad":                                                "Inundación - Exceso de Humedad",

    # ── Plagas Incontrolables compuestas ──────────────────────────
    "Plagas incontrolables - Inundacion":                                          "Plagas Incontrolables - Inundación",
    "Plagas incontrolables - Sequia":                                              "Plagas Incontrolables - Sequía",
    "Plagas incontrolables - Taponamiento":                                        "Plagas Incontrolables - Taponamiento",
    "Plagas incontrolables - Vientos fuertes":                                     "Plagas Incontrolables - Vientos Fuertes",

    # ── Sequía compuestas ─────────────────────────────────────────
    "Sequia - Plagas Incontrolables":                                              "Sequía - Plagas Incontrolables",
}

# ── Lista fuente (raw, tal cual en el Excel) ──────────────────────
CAUSAS_RAW = [
    "Bajas temperaturas",
    "Bajas temperaturas - Enfermedades incontrolables",
    "Caida de ceniza",
    "Deslizamiento",
    "Deslizamientos - Exceso de humedad",
    "Deslizamientos - Granizada",
    "Deslizamientos - Inundacion",
    "Deslizamientos - Plagas incontrolables",
    "Deslizamientos - Taponamiento",
    "Deslizamientos - Vientos fuertes",
    "Enfermedades Incontrolables",
    "Enfermedades incontrolables - Exceso de humedad",
    "Enfermedades Incontrolables-Exceso de Humedad",
    "Enfermedades incontrolables - Helada - Sequia",
    "Enfermedades incontrolables - Inundacion",
    "Enfermedades incontrolables - Plagas incontrolables",
    "Enfermedades incontrolables - Plagas incontrolables - Sequia",
    "Enfermedades incontrolables - Plagas incontrolables - Vientos fuertes",
    "Enfermedades incontrolables - Sequia",
    "Enfermedades incontrolables - Vientos fuertes",
    "Exceso de Humedad",
    "Exceso de humedad - enfermedades incontrolables",
    "excesode humedad y enfermedades incontrolables",
    "Exceso de humedad - Inundacion",
    "Exceso de humedad - Inundacion - Plagas incontrolables",
    "Exceso de humedad - Inundacion - Taponamiento",
    "Exceso de humedad - Inundacion - Vientos fuertes",
    "Exceso de humedad - Plagas incontrolables",
    "Exceso de humedad - Sequia",
    "Exceso de humedad - Taponamiento",
    "Exceso de humedad - Vientos fuertes",
    "Granizada",
    "Granizada - Sequia",
    "Granizada - Vientos fuertes",
    "Helada",
    "Helada - Plagas incontrolables",
    "Helada - Sequia",
    "Incendio",
    "Inundacion",
    "Inundacion - Plagas incontrolables",
    "Inundacion - Vientos fuertes",
    "Inundacion - Exceso de humedad",
    "Inundacion-exceso de humedad",
    "Plagas Incontrolables",
    "Plagas incontrolables - Inundacion",
    "Plagas incontrolables - Sequia",
    "Plagas incontrolables - Taponamiento",
    "Plagas incontrolables - Vientos fuertes",
    "Sequia",
    "Sequia - Plagas Incontrolables",
    "Taponamiento",
    "Vientos fuertes",
]


# ── Normalización ────────────────────────────────────────────────

def normalize(raw: str) -> str:
    stripped = " ".join(raw.strip().split())
    return NORMALIZATION_MAP.get(stripped, stripped)


def build_unique(raw_list: list[str]) -> list[str]:
    seen:   set[str]  = set()
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
    causas = build_unique(CAUSAS_RAW)

    print(f"Insertando {len(causas)} causas...\n")

    inserted = 0
    errors: list[dict] = []

    for descripcion in causas:
        try:
            client.table("causas_siniestro").upsert(
                {"descripcion": descripcion},
                on_conflict="descripcion",
            ).execute()
            inserted += 1
            print(f"  ✓ {descripcion}")
        except Exception as exc:
            errors.append({"descripcion": descripcion, "error": str(exc)})
            print(f"  ✗ {descripcion} — {exc}")

    print(f"\n{'='*50}")
    print(f"Insertadas : {inserted}")
    print(f"Errores    : {len(errors)}")
    if errors:
        for e in errors:
            print(f"  {e['descripcion']}: {e['error']}")
        sys.exit(1)


if __name__ == "__main__":
    seed()
