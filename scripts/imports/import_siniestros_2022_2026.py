"""
Script de importación async de siniestros desde Excel a Supabase.
Sheet: 2022-2026 (headers en fila 4, datos desde fila 5)

Estrategia:
  0. Pre-fetch de provincias y cantones existentes en BD (lookup sin tildes)
  1. Parse Excel en memoria (sync, rápido)
  2. Fase catálogos: resolución de provincias + upsert cultivos/causas/estados en paralelo
  3. Fase cantones: resolución por clave normalizada (requiere provincia_id del paso 2)
  4. Fase siniestros: upsert concurrente con semáforo (CONCURRENCY slots)

Normalización de provincias y cantones:
  - Se compara sin tildes ni mayúsculas (strip_accents) para tolerar "BOLIVAR",
    "Bolívar", "bolivar", etc. como la misma entrada.
  - Provincias: se usa PROVINCE_CANONICAL para el nombre definitivo.
  - Cantones: se usa el nombre canónico ya existente en BD; si es nuevo, Title Case.

Uso:
    python import_siniestros_2022_2026.py
"""

import asyncio
import os
import sys
import unicodedata
from dataclasses import dataclass

import pandas as pd
from dotenv import load_dotenv
from supabase import acreate_client, AsyncClient

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

EXCEL_PATH  = "/Users/joxxx69/Downloads/Copia dash-bord 8 6 2026 ULTIMO SANTY.xlsx"
SHEET_NAME  = "2022-2026"
HEADER_ROW  = 3   # 0-indexed → fila 4 del Excel
CONCURRENCY = 50  # slots simultáneos para upsert de siniestros


# ── Helpers de normalización ─────────────────────────────────────

def strip_accents(text: str) -> str:
    """'Bolívar' → 'bolivar'  — para comparar sin tildes ni mayúsculas."""
    return " ".join(
        "".join(
            c for c in unicodedata.normalize("NFD", word)
            if unicodedata.category(c) != "Mn"
        )
        for word in str(text).strip().lower().split()
    )


# 24 provincias del Ecuador: clave sin tildes/mayúsculas → nombre canónico
PROVINCE_CANONICAL: dict[str, str] = {
    "azuay":                          "Azuay",
    "bolivar":                        "Bolívar",
    "canar":                          "Cañar",
    "carchi":                         "Carchi",
    "chimborazo":                     "Chimborazo",
    "cotopaxi":                       "Cotopaxi",
    "el oro":                         "El Oro",
    "esmeraldas":                     "Esmeraldas",
    "galapagos":                      "Galápagos",
    "guayas":                         "Guayas",
    "imbabura":                       "Imbabura",
    "loja":                           "Loja",
    "los rios":                       "Los Ríos",
    "manabi":                         "Manabí",
    "morona santiago":                "Morona Santiago",
    "napo":                           "Napo",
    "orellana":                       "Orellana",
    "pastaza":                        "Pastaza",
    "pichincha":                      "Pichincha",
    "santa elena":                    "Santa Elena",
    "santo domingo de los tsachilas": "Santo Domingo de los Tsáchilas",
    "sucumbios":                      "Sucumbíos",
    "tungurahua":                     "Tungurahua",
    "zamora chinchipe":               "Zamora Chinchipe",
}


def normalize_provincia(value) -> str:
    """Normaliza provincia usando PROVINCE_CANONICAL; fallback: Title Case."""
    raw = " ".join(str(value).strip().split())
    return PROVINCE_CANONICAL.get(strip_accents(raw), raw.title())


def normalize_canton(value) -> str:
    """Title Case limpio — la canonicalización real se hace via BD en import_async."""
    return " ".join(str(value).strip().title().split())


def normalize_causa(value) -> str:
    cleaned = " ".join(str(value).strip().split())
    titled  = cleaned.title()
    for variant in (" -", "- ", "-"):
        titled = titled.replace(variant, " - ")
    return " ".join(titled.split())


def normalize_codigo(value) -> str:
    return " ".join(str(value).strip().split()).upper()


def normalize_date(value) -> str | None:
    if pd.isna(value):
        return None
    try:
        return pd.to_datetime(value, dayfirst=True).strftime("%Y-%m-%d")
    except Exception:
        raise ValueError(f"Formato de fecha no reconocido: {value!r}")


def normalize_numeric(value) -> float | None:
    if pd.isna(value):
        return None
    return float(str(value).replace(",", ".").strip())


# ── Estructura de fila parseada ──────────────────────────────────

@dataclass(frozen=True)
class ParsedRow:
    fila:           int
    numero_tramite: str
    provincia:      str   # ya canonicalizado con PROVINCE_CANONICAL
    canton:         str   # Title Case; se reconcilia con BD en import_async
    cultivo:        str
    causa:          str
    estado_codigo:  str
    has_afectadas:  float
    fecha:          str
    valor_indem:    float | None


# ── Fase 0: Parseo del Excel (sync) ──────────────────────────────

def parse_excel() -> tuple[list[ParsedRow], list[dict]]:
    print(f"Leyendo: {EXCEL_PATH}  →  sheet '{SHEET_NAME}'")

    df = pd.read_excel(EXCEL_PATH, sheet_name=SHEET_NAME, header=HEADER_ROW, dtype=str)
    df = df.loc[:, df.columns.notna()]
    df.columns = [str(c).strip().upper() for c in df.columns]
    df = df[df["NUMERO TRAMITE2"].notna()].reset_index(drop=True)

    print(f"Filas a procesar: {len(df)}\n")

    rows:         list[ParsedRow] = []
    parse_errors: list[dict]      = []

    for idx, row in df.iterrows():
        fila           = int(idx) + HEADER_ROW + 2
        numero_tramite = str(row["NUMERO TRAMITE2"]).strip()

        if not numero_tramite or numero_tramite == "nan":
            continue

        try:
            has_afectadas = normalize_numeric(row["HAS AFECTADAS AVISO SINIESTRO"])
            fecha         = normalize_date(row["FECHA OCURRENCIA AVISO SINIESTRO"])

            if has_afectadas is None or fecha is None:
                raise ValueError("has_afectadas o fecha_ocurrencia nulos")

            rows.append(ParsedRow(
                fila           = fila,
                numero_tramite = numero_tramite,
                provincia      = normalize_provincia(row["PROVINCIA"]),
                canton         = normalize_canton(row["CANTON"]),
                cultivo        = " ".join(str(row["CULTIVO"]).strip().title().split()),
                causa          = normalize_causa(row["CAUSA SINIESTRO AVISO"]),
                estado_codigo  = normalize_codigo(row["ESTADO SINIESTRO"]),
                has_afectadas  = has_afectadas,
                fecha          = fecha,
                valor_indem    = normalize_numeric(row["VALOR INDEMNIZACION"]),
            ))
        except Exception as exc:
            parse_errors.append({"fila": fila, "numero_tramite": numero_tramite, "error": str(exc)})
            print(f"  [fila {fila}] PARSE ERROR: {exc}")

    return rows, parse_errors


# ── Helpers async ────────────────────────────────────────────────

# Tipo para los mapas de lookup: clave_normalizada → (id, nombre_canónico)
ProvMap = dict[str, tuple[int, str]]           # strip_accents(nombre) → (id, nombre)
CantMap = dict[tuple[str, int], tuple[int, str]]  # (strip_accents(nombre), prov_id) → (id, nombre)


async def resolve_provincia(
    client:   AsyncClient,
    raw:      str,
    db_map:   ProvMap,
) -> tuple[int, str]:
    """
    Busca la provincia en BD por clave normalizada.
    Si no existe, inserta con el nombre canónico de PROVINCE_CANONICAL.
    Devuelve (id, nombre_canónico).
    """
    key       = strip_accents(raw)
    canonical = PROVINCE_CANONICAL.get(key, raw.title())

    if key in db_map:
        return db_map[key]

    res  = await client.table("provincias").upsert({"nombre": canonical}, on_conflict="nombre").execute()
    _id  = res.data[0]["id"]
    db_map[key] = (_id, canonical)
    return (_id, canonical)


async def resolve_canton(
    client:  AsyncClient,
    raw:     str,
    prov_id: int,
    db_map:  CantMap,
) -> tuple[int, str]:
    """
    Busca el cantón en BD por (clave_normalizada, provincia_id).
    Si no existe, inserta con Title Case.
    Devuelve (id, nombre_canónico).
    """
    key       = (strip_accents(raw), prov_id)
    canonical = raw.title()

    if key in db_map:
        return db_map[key]

    res = await client.table("cantones").upsert(
        {"nombre": canonical, "provincia_id": prov_id},
        on_conflict="nombre,provincia_id",
    ).execute()
    _id     = res.data[0]["id"]
    db_map[key] = (_id, canonical)
    return (_id, canonical)


async def upsert_all(
    client:       AsyncClient,
    table:        str,
    records:      list[dict],
    conflict_col: str,
    key_col:      str,
) -> dict[str, int]:
    """Upsert todos los registros en paralelo → {key_value: id}."""
    results = await asyncio.gather(*[
        client.table(table).upsert(rec, on_conflict=conflict_col).execute()
        for rec in records
    ], return_exceptions=True)

    id_map: dict[str, int] = {}
    for rec, res in zip(records, results):
        if isinstance(res, Exception):
            raise res
        id_map[rec[key_col]] = res.data[0]["id"]
    return id_map


async def fetch_estados(client: AsyncClient, codigos: set[str]) -> dict[str, int]:
    res     = await client.table("estados_siniestro").select("id, codigo").execute()
    all_map = {row["codigo"]: row["id"] for row in res.data}
    missing = codigos - set(all_map)
    if missing:
        raise ValueError(f"Estados no encontrados en BD: {missing}. Ejecuta seed_estados.py primero.")
    return {c: all_map[c] for c in codigos}


# ── Fase principal async ─────────────────────────────────────────

async def import_async(rows: list[ParsedRow]) -> tuple[int, list[dict]]:
    client: AsyncClient = await acreate_client(SUPABASE_URL, SUPABASE_KEY)

    unique_provincias = list({r.provincia for r in rows})
    unique_cultivos   = list({r.cultivo   for r in rows})
    unique_causas     = list({r.causa     for r in rows})
    unique_estados    = {r.estado_codigo  for r in rows}

    print(
        f"Catálogos únicos: {len(unique_provincias)} provincias, "
        f"{len(unique_cultivos)} cultivos, {len(unique_causas)} causas, "
        f"{len(unique_estados)} estados"
    )

    # ── Fase 0: pre-fetch de provincias y cantones existentes ─────
    print("\nFase 0: pre-fetch de provincias y cantones en BD...")
    provs_res, cants_res = await asyncio.gather(
        client.table("provincias").select("id, nombre").execute(),
        client.table("cantones").select("id, nombre, provincia_id").execute(),
    )

    prov_db_map: ProvMap = {
        strip_accents(r["nombre"]): (r["id"], r["nombre"])
        for r in provs_res.data
    }
    cant_db_map: CantMap = {
        (strip_accents(r["nombre"]), r["provincia_id"]): (r["id"], r["nombre"])
        for r in cants_res.data
    }
    print(f"  {len(prov_db_map)} provincias, {len(cant_db_map)} cantones cargados de BD")

    # ── Fase 1: provincias + cultivos + causas + estados (paralelo) ──
    print("\nFase 1: catálogos en paralelo...")
    (
        prov_results,
        cultivo_map,
        causa_map,
        estado_map,
    ) = await asyncio.gather(
        asyncio.gather(*[
            resolve_provincia(client, p, prov_db_map) for p in unique_provincias
        ]),
        upsert_all(client, "cultivos",         [{"nombre": c}      for c in unique_cultivos], "nombre",      "nombre"),
        upsert_all(client, "causas_siniestro", [{"descripcion": c} for c in unique_causas],   "descripcion", "descripcion"),
        fetch_estados(client, unique_estados),
    )

    # prov_results es lista de (id, canonical) en el mismo orden que unique_provincias
    provincia_map: dict[str, tuple[int, str]] = {
        raw: result for raw, result in zip(unique_provincias, prov_results)
    }

    # ── Fase 2: cantones (requiere provincia_id) ──────────────────
    print("Fase 2: cantones en paralelo...")
    unique_cantones = list({(r.canton, r.provincia) for r in rows})

    cant_results = await asyncio.gather(*[
        resolve_canton(client, canton_raw, provincia_map[prov_raw][0], cant_db_map)
        for canton_raw, prov_raw in unique_cantones
    ])

    canton_map: dict[tuple[str, str], tuple[int, str]] = {
        (canton_raw, prov_raw): result
        for (canton_raw, prov_raw), result in zip(unique_cantones, cant_results)
    }

    # ── Fase 3: siniestros concurrentes con semáforo ──────────────
    print(f"Fase 3: importando {len(rows)} siniestros (concurrencia={CONCURRENCY})...")

    payloads:     list[dict]      = []
    row_refs:     list[ParsedRow] = []
    build_errors: list[dict]      = []

    for r in rows:
        try:
            prov_id,   prov_name   = provincia_map[r.provincia]
            canton_id, canton_name = canton_map[(r.canton, r.provincia)]
            payloads.append({
                "numero_tramite":      r.numero_tramite,
                "cultivo_id":          cultivo_map[r.cultivo],
                "canton_id":           canton_id,
                "causa_id":            causa_map[r.causa],
                "estado_id":           estado_map[r.estado_codigo],
                "has_afectadas":       r.has_afectadas,
                "valor_indemnizacion": r.valor_indem,
                "fecha_ocurrencia":    r.fecha,
            })
            row_refs.append(r)
        except KeyError as exc:
            build_errors.append({
                "fila": r.fila, "numero_tramite": r.numero_tramite,
                "error": f"ID no resuelto: {exc}",
            })

    sem = asyncio.Semaphore(CONCURRENCY)

    async def upsert_one(payload: dict, r: ParsedRow) -> dict | None:
        async with sem:
            try:
                await client.table("siniestros") \
                             .upsert(payload, on_conflict="numero_tramite") \
                             .execute()
                prov_name   = provincia_map[r.provincia][1]
                canton_name = canton_map[(r.canton, r.provincia)][1]
                print(f"  [fila {r.fila}] OK → {r.numero_tramite} | {prov_name}/{canton_name}")
                return None
            except Exception as exc:
                err = {"fila": r.fila, "numero_tramite": r.numero_tramite, "error": str(exc)}
                print(f"  [fila {r.fila}] ERROR: {exc}")
                return err

    upsert_results = await asyncio.gather(*[
        upsert_one(payload, r) for payload, r in zip(payloads, row_refs)
    ])

    upsert_errors = [e for e in upsert_results if e is not None]
    loaded        = len(payloads) - len(upsert_errors)

    return loaded, build_errors + upsert_errors


# ── Entry point ──────────────────────────────────────────────────

async def main() -> None:
    rows, parse_errors = parse_excel()

    if not rows:
        print("No hay filas válidas para procesar.")
        sys.exit(0)

    loaded, runtime_errors = await import_async(rows)
    all_errors = parse_errors + runtime_errors

    print(f"\n{'='*60}")
    print(f"Registros cargados : {loaded}")
    print(f"Errores de parseo  : {len(parse_errors)}")
    print(f"Errores de upsert  : {len(runtime_errors)}")

    if all_errors:
        error_file = EXCEL_PATH.replace(".xlsx", "_errores.csv")
        pd.DataFrame(all_errors).to_csv(error_file, index=False)
        print(f"Detalle de errores → {error_file}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
