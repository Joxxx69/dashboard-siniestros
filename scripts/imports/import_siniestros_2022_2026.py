"""
Script de importación async de siniestros desde Excel a Supabase.
Sheet: 2022-2026 (headers en fila 4, datos desde fila 5)

Estrategia:
  0. Consolidación de BD: fusiona provincias/cantones duplicados (misma clave
     normalizada, distinto nombre o ID) y renombra a la forma canónica.
  1. Parse Excel: normalización, validación y detección de duplicados en Excel.
  2. Fase catálogos: resolución de provincias + upsert cultivos/causas/estados.
  3. Fase cantones: resolución por clave normalizada (requiere provincia_id).
  4. Fase siniestros: upsert concurrente con semáforo; clasifica INSERT vs UPDATE.

Uso:
    python import_siniestros_2022_2026.py
"""

import asyncio
import os
import sys
import unicodedata
from dataclasses import dataclass, field

import pandas as pd
from dotenv import load_dotenv
from supabase import acreate_client, AsyncClient

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]


EXCEL_PATH  = "/Users/joxxx69/Downloads/Copia Dashboard Aug 6 2026.xlsx"
SHEET_NAME  = "2022-2026"
HEADER_ROW  = 3
CONCURRENCY = 50
FECHA_MIN   = 2000
FECHA_MAX   = 2030


# ── Normalización ────────────────────────────────────────────────

def strip_accents(text: str) -> str:
    """'Bolívar' → 'bolivar' — compara sin tildes ni mayúsculas."""
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
    "maiz arveja":                    "Maíz - Arveja",
    "maiz arverja":                   "Maíz - Arveja",
    "maiz frejol":                    "Maíz - Fréjol",
    "maiz duro":                      "Maíz Duro",
    "maiz suave":                     "Maíz Suave",
    "maiz suave arveja":              "Maíz Suave + Arveja",
    "maiz suave frejol":              "Maíz Suave + Fréjol",
    "maiz suave haba":                "Maíz Suave + Haba",
    "mani":                           "Maní",
    "palma africana":                 "Palma Africana",
    "papa":                           "Papa",
    "pimiento":                       "Pimiento",
    "pila":                           "Pila",
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


def normalize_cultivo(value) -> str:
    raw = " ".join(str(value).strip().split())
    return CULTIVO_CANONICAL.get(cultivo_key(raw), " ".join(raw.title().split()))


def normalize_provincia(value) -> str:
    raw = " ".join(str(value).strip().split())
    return PROVINCE_CANONICAL.get(strip_accents(raw), raw.title())


def normalize_canton(value) -> str:
    return " ".join(str(value).strip().title().split())


def normalize_causa(value) -> str:
    cleaned = " ".join(str(value).strip().split())
    titled  = cleaned.title()
    for v in (" -", "- ", "-"):
        titled = titled.replace(v, " - ")
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


# ── Estructuras ──────────────────────────────────────────────────

@dataclass(frozen=True)
class ParsedRow:
    fila:           int
    numero_tramite: str
    provincia:      str
    canton:         str
    cultivo:        str
    causa:          str
    estado_codigo:  str
    has_afectadas:  float
    fecha:          str
    valor_indem:    float | None


@dataclass
class ParseSummary:
    total_leidas:     int            = 0
    sin_tramite:      int            = 0
    parse_errors:     list[dict]     = field(default_factory=list)
    excel_duplicates: list[dict]     = field(default_factory=list)
    rows:             list[ParsedRow]= field(default_factory=list)

    @property
    def validas(self) -> int:
        return len(self.rows)


@dataclass
class ImportSummary:
    inserted:     int        = 0
    updated:      int        = 0
    errors:       list[dict] = field(default_factory=list)
    build_errors: list[dict] = field(default_factory=list)


ProvMap = dict[str, tuple[int, str]]           # strip_accents(nombre) → (id, nombre_canónico)
CantMap = dict[tuple[str, int], tuple[int, str]]  # (strip_accents(nombre), prov_id) → (id, nombre)


# ── Fase parse (sync) ────────────────────────────────────────────

def parse_excel() -> ParseSummary:
    print(f"Leyendo: {EXCEL_PATH}  →  sheet '{SHEET_NAME}'")
    df = pd.read_excel(EXCEL_PATH, sheet_name=SHEET_NAME, header=HEADER_ROW, dtype=str)
    df = df.loc[:, df.columns.notna()]
    df.columns = [str(c).strip().upper() for c in df.columns]

    summary        = ParseSummary()
    seen_tramites: dict[str, int] = {}   # tramite → veces visto

    for idx, row in df.iterrows():
        summary.total_leidas += 1
        fila           = int(idx) + HEADER_ROW + 2
        numero_tramite = str(row.get("NUMERO TRAMITE2", "")).strip()

        if not numero_tramite or numero_tramite == "nan":
            summary.sin_tramite += 1
            continue

        original_tramite = numero_tramite
        if numero_tramite in seen_tramites:
            count          = seen_tramites[numero_tramite]
            numero_tramite = f"{numero_tramite}-{count}"
            seen_tramites[original_tramite] += 1
            summary.excel_duplicates.append({
                "tipo":                    "DUPLICADO_EXCEL",
                "fila":                    fila,
                "numero_tramite_original": original_tramite,
                "numero_tramite_asignado": numero_tramite,
            })
            print(f"  [fila {fila}] DUPLICADO Excel → {original_tramite}  asignado: {numero_tramite}")
        else:
            seen_tramites[numero_tramite] = 1

        try:
            has_afectadas = normalize_numeric(row["HAS AFECTADAS AVISO SINIESTRO"])
            fecha         = normalize_date(row["FECHA OCURRENCIA AVISO SINIESTRO"])

            if has_afectadas is None:
                raise ValueError("has_afectadas es nulo")
            if has_afectadas < 0:
                raise ValueError(f"has_afectadas negativo: {has_afectadas}")
            if fecha is None:
                raise ValueError("fecha_ocurrencia es nula")
            if not (FECHA_MIN <= int(fecha[:4]) <= FECHA_MAX):
                raise ValueError(f"fecha fuera de rango [{FECHA_MIN}-{FECHA_MAX}]: {fecha}")

            provincia = normalize_provincia(row["PROVINCIA"])
            canton    = normalize_canton(row["CANTON"])
            if not provincia:
                raise ValueError("provincia vacía")
            if not canton:
                raise ValueError("cantón vacío")

            summary.rows.append(ParsedRow(
                fila           = fila,
                numero_tramite = numero_tramite,
                provincia      = provincia,
                canton         = canton,
                cultivo        = normalize_cultivo(row["CULTIVO"]),
                causa          = normalize_causa(row["CAUSA SINIESTRO AVISO"]),
                estado_codigo  = normalize_codigo(row["ESTADO SINIESTRO"]),
                has_afectadas  = has_afectadas,
                fecha          = fecha,
                valor_indem    = normalize_numeric(row["VALOR INDEMNIZACION"]),
            ))
        except Exception as exc:
            summary.parse_errors.append({
                "tipo": "PARSE_ERROR", "fila": fila,
                "numero_tramite": numero_tramite, "error": str(exc),
            })
            print(f"  [fila {fila}] PARSE ERROR → {numero_tramite}: {exc}")

    return summary


# ── Consolidación de BD (async) ───────────────────────────────────

async def consolidate_provinces(client: AsyncClient) -> ProvMap:
    """
    Detecta provincias con la misma clave normalizada (ej. 'Canar' y 'Cañar').
    Para cada grupo duplicado:
      - Elige el ganador: la entrada cuyo nombre es el canónico, o la de menor id.
      - Renombra el ganador al nombre canónico si es necesario.
      - Migra cantones.provincia_id de los perdedores al ganador.
      - Elimina los perdedores.
    Devuelve ProvMap limpio.
    """
    res = await client.table("provincias").select("id, nombre").order("id").execute()

    # Agrupa por clave normalizada
    groups: dict[str, list[tuple[int, str]]] = {}
    for r in res.data:
        groups.setdefault(strip_accents(r["nombre"]), []).append((r["id"], r["nombre"]))

    clean_map: ProvMap = {}

    for key, entries in groups.items():
        canonical = PROVINCE_CANONICAL.get(key, entries[0][1].title())

        # Ganador: preferir la entrada cuyo nombre ya es canónico; si no, la de menor id
        winner_entry = next(
            ((id_, nm) for id_, nm in entries if nm == canonical),
            entries[0],
        )
        winner_id, winner_name = winner_entry

        # Renombrar si difiere del canónico
        if winner_name != canonical:
            await client.table("provincias").update({"nombre": canonical}).eq("id", winner_id).execute()
            print(f"  ↻ Provincia renombrada: '{winner_name}' → '{canonical}'")

        # Migrar y eliminar entradas duplicadas
        losers = [(id_, nm) for id_, nm in entries if id_ != winner_id]
        for loser_id, loser_name in losers:
            await client.table("cantones").update({"provincia_id": winner_id}).eq("provincia_id", loser_id).execute()
            await client.table("provincias").delete().eq("id", loser_id).execute()
            print(f"  ✗ Provincia duplicada eliminada: '{loser_name}' (id={loser_id}) → fusionada en '{canonical}'")

        clean_map[key] = (winner_id, canonical)

    return clean_map


async def consolidate_cultivos(client: AsyncClient) -> None:
    """
    Detecta cultivos con la misma clave normalizada (ej. 'Maiz Duro' y 'Maíz Duro').
    Conserva el canónico (o el de menor id), migra siniestros y elimina duplicados.
    """
    res = await client.table("cultivos").select("id, nombre").order("id").execute()

    groups: dict[str, list[tuple[int, str]]] = {}
    for r in res.data:
        groups.setdefault(cultivo_key(r["nombre"]), []).append((r["id"], r["nombre"]))

    for key, entries in groups.items():
        if len(entries) == 1:
            continue
        canonical = CULTIVO_CANONICAL.get(key, entries[0][1])
        winner_entry = next(
            ((id_, nm) for id_, nm in entries if nm == canonical),
            entries[0],
        )
        winner_id, winner_name = winner_entry

        if winner_name != canonical:
            await client.table("cultivos").update({"nombre": canonical}).eq("id", winner_id).execute()
            print(f"  ↻ Cultivo renombrado: '{winner_name}' → '{canonical}'")

        for loser_id, loser_name in [(id_, nm) for id_, nm in entries if id_ != winner_id]:
            await client.table("siniestros").update({"cultivo_id": winner_id}).eq("cultivo_id", loser_id).execute()
            await client.table("cultivos").delete().eq("id", loser_id).execute()
            print(f"  ✗ Cultivo duplicado eliminado: '{loser_name}' (id={loser_id}) → fusionado en '{canonical}'")


async def consolidate_cantons(client: AsyncClient) -> CantMap:
    """
    Detecta cantones con la misma (clave_normalizada, provincia_id).
    Para cada grupo duplicado:
      - Elige el ganador (menor id), renombra a Title Case canónico.
      - Migra siniestros.canton_id de los perdedores al ganador.
      - Elimina los perdedores.
    Devuelve CantMap limpio.
    """
    res = await client.table("cantones").select("id, nombre, provincia_id").order("id").execute()

    groups: dict[tuple[str, int], list[tuple[int, str]]] = {}
    for r in res.data:
        key = (strip_accents(r["nombre"]), r["provincia_id"])
        groups.setdefault(key, []).append((r["id"], r["nombre"]))

    clean_map: CantMap = {}

    for (stripped, prov_id), entries in groups.items():
        canonical = entries[0][1].title()
        winner_id, winner_name = entries[0]

        if winner_name != canonical:
            await client.table("cantones").update({"nombre": canonical}).eq("id", winner_id).execute()

        losers = entries[1:]
        for loser_id, loser_name in losers:
            await client.table("siniestros").update({"canton_id": winner_id}).eq("canton_id", loser_id).execute()
            await client.table("cantones").delete().eq("id", loser_id).execute()
            print(f"  ✗ Cantón duplicado eliminado: '{loser_name}' (id={loser_id}) → fusionado en '{canonical}'")

        clean_map[(stripped, prov_id)] = (winner_id, canonical)

    return clean_map


# ── Helpers async ────────────────────────────────────────────────

async def resolve_provincia(client: AsyncClient, raw: str, db_map: ProvMap) -> tuple[int, str]:
    key       = strip_accents(raw)
    canonical = PROVINCE_CANONICAL.get(key, raw.title())
    if key in db_map:
        return db_map[key]
    res = await client.table("provincias").upsert({"nombre": canonical}, on_conflict="nombre").execute()
    _id = res.data[0]["id"]
    db_map[key] = (_id, canonical)
    return (_id, canonical)


async def resolve_canton(client: AsyncClient, raw: str, prov_id: int, db_map: CantMap) -> tuple[int, str]:
    key       = (strip_accents(raw), prov_id)
    canonical = raw.title()
    if key in db_map:
        return db_map[key]
    res = await client.table("cantones").upsert(
        {"nombre": canonical, "provincia_id": prov_id},
        on_conflict="nombre,provincia_id",
    ).execute()
    _id = res.data[0]["id"]
    db_map[key] = (_id, canonical)
    return (_id, canonical)


async def upsert_all(
    client: AsyncClient, table: str, records: list[dict],
    conflict_col: str, key_col: str,
) -> dict[str, int]:
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
    all_map = {r["codigo"]: r["id"] for r in res.data}
    missing = codigos - set(all_map)
    if missing:
        raise ValueError(f"Estados no encontrados: {missing}. Ejecuta seed_estados.py primero.")
    return {c: all_map[c] for c in codigos}


async def fetch_existing_tramites(client: AsyncClient) -> set[str]:
    existing: set[str] = set()
    page, from_ = 10_000, 0
    while True:
        res = await client.table("siniestros").select("numero_tramite") \
                          .order("id").range(from_, from_ + page - 1).execute()
        if not res.data:
            break
        existing.update(r["numero_tramite"] for r in res.data)
        if len(res.data) < page:
            break
        from_ += page
    return existing


# ── Fase principal async ─────────────────────────────────────────

async def import_async(rows: list[ParsedRow]) -> ImportSummary:
    client: AsyncClient = await acreate_client(SUPABASE_URL, SUPABASE_KEY)

    unique_provincias = list({r.provincia    for r in rows})
    unique_cultivos   = list({r.cultivo      for r in rows})
    unique_causas     = list({r.causa        for r in rows})
    unique_estados    = {r.estado_codigo     for r in rows}

    # ── Fase 0: consolidación secuencial + pre-fetch en paralelo ────
    # Provincias primero: su consolidación actualiza canton.provincia_id,
    # por lo que consolidate_cantons debe ejecutarse después.
    print("\nFase 0: consolidando BD y pre-fetcheando catálogos...")
    prov_db_map = await consolidate_provinces(client)
    await consolidate_cultivos(client)
    cant_db_map, existing_tramites = await asyncio.gather(
        consolidate_cantons(client),
        fetch_existing_tramites(client),
    )
    print(
        f"  BD consolidada: {len(prov_db_map)} provincias, "
        f"{len(cant_db_map)} cantones, {len(existing_tramites)} tramites"
    )

    # ── Fase 1: catálogos en paralelo ────────────────────────────
    print("\nFase 1: catálogos (provincias / cultivos / causas / estados)...")
    prov_results, cultivo_map, causa_map, estado_map = await asyncio.gather(
        asyncio.gather(*[resolve_provincia(client, p, prov_db_map) for p in unique_provincias]),
        upsert_all(client, "cultivos",         [{"nombre": c}      for c in unique_cultivos], "nombre",      "nombre"),
        upsert_all(client, "causas_siniestro", [{"descripcion": c} for c in unique_causas],   "descripcion", "descripcion"),
        fetch_estados(client, unique_estados),
    )
    provincia_map: dict[str, tuple[int, str]] = {
        raw: result for raw, result in zip(unique_provincias, prov_results)
    }

    # ── Fase 2: cantones en paralelo ─────────────────────────────
    print("Fase 2: cantones...")
    unique_cantones = list({(r.canton, r.provincia) for r in rows})
    cant_results    = await asyncio.gather(*[
        resolve_canton(client, canton_raw, provincia_map[prov_raw][0], cant_db_map)
        for canton_raw, prov_raw in unique_cantones
    ])
    canton_map: dict[tuple[str, str], tuple[int, str]] = {
        pair: result for pair, result in zip(unique_cantones, cant_results)
    }

    # ── Fase 3: siniestros concurrentes ──────────────────────────
    print(f"Fase 3: importando {len(rows)} siniestros (concurrencia={CONCURRENCY})...")

    summary      = ImportSummary()
    payloads:    list[dict]      = []
    row_refs:    list[ParsedRow] = []

    for r in rows:
        try:
            canton_id, _ = canton_map[(r.canton, r.provincia)]
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
            summary.build_errors.append({
                "tipo": "BUILD_ERROR", "fila": r.fila,
                "numero_tramite": r.numero_tramite, "error": f"ID no resuelto: {exc}",
            })

    sem = asyncio.Semaphore(CONCURRENCY)

    async def upsert_one(payload: dict, r: ParsedRow) -> dict:
        async with sem:
            is_update = r.numero_tramite in existing_tramites
            tag       = "UPDATE" if is_update else "INSERT"
            try:
                await client.table("siniestros") \
                             .upsert(payload, on_conflict="numero_tramite") \
                             .execute()
                prov_name   = provincia_map[r.provincia][1]
                canton_name = canton_map[(r.canton, r.provincia)][1]
                print(f"  [fila {r.fila}] {tag} → {r.numero_tramite} | {prov_name}/{canton_name}")
                return {"ok": True, "is_update": is_update}
            except Exception as exc:
                print(f"  [fila {r.fila}] ERROR → {r.numero_tramite}: {exc}")
                return {
                    "ok": False, "is_update": is_update,
                    "tipo": "UPSERT_ERROR", "fila": r.fila,
                    "numero_tramite": r.numero_tramite, "error": str(exc),
                }

    results = await asyncio.gather(*[
        upsert_one(p, r) for p, r in zip(payloads, row_refs)
    ])

    for res in results:
        if res["ok"]:
            if res["is_update"]:
                summary.updated += 1
            else:
                summary.inserted += 1
        else:
            summary.errors.append(res)

    return summary


# ── Reporte final ────────────────────────────────────────────────

def print_report(parse: ParseSummary, imp: ImportSummary) -> None:
    SEP        = "═" * 60
    all_errors = parse.parse_errors + imp.build_errors + imp.errors

    print(f"\n{SEP}")
    print("RESUMEN DE IMPORTACIÓN")
    print(SEP)
    print("\nExcel")
    print(f"  Total filas leídas           : {parse.total_leidas:>6,}")
    print(f"  Sin número de trámite        : {parse.sin_tramite:>6,}")
    print(f"  Duplicados re-numerados (-N) : {len(parse.excel_duplicates):>6,}")
    print(f"  Errores de parseo/validación : {len(parse.parse_errors):>6,}")
    print(f"  Válidos para importar        : {parse.validas:>6,}")
    print("\nSupabase")
    print(f"  Nuevos (INSERT)              : {imp.inserted:>6,}")
    print(f"  Actualizados (UPDATE)        : {imp.updated:>6,}")
    print(f"  Errores de build             : {len(imp.build_errors):>6,}")
    print(f"  Errores de upsert            : {len(imp.errors):>6,}")
    print(f"\n{SEP}")
    print(f"  TOTAL procesados OK          : {imp.inserted + imp.updated:>6,}")
    print(f"  TOTAL con errores            : {len(all_errors):>6,}")
    print(SEP)

    base = EXCEL_PATH.replace(".xlsx", "")
    if parse.excel_duplicates:
        path = f"{base}_duplicados_excel.csv"
        pd.DataFrame(parse.excel_duplicates).to_csv(path, index=False)
        print(f"\n⚠  Duplicados en Excel → {path}")
    if all_errors:
        path = f"{base}_errores.csv"
        pd.DataFrame(all_errors).to_csv(path, index=False)
        print(f"✗  Errores → {path}")


# ── Entry point ──────────────────────────────────────────────────

async def main() -> None:
    parse = parse_excel()
    print(
        f"\nParseo: {parse.validas} válidas, "
        f"{len(parse.excel_duplicates)} duplicados Excel, "
        f"{len(parse.parse_errors)} errores"
    )

    if not parse.rows:
        print("No hay filas válidas.")
        sys.exit(0)

    imp = await import_async(parse.rows)
    print_report(parse, imp)

    if parse.excel_duplicates or parse.parse_errors or imp.build_errors or imp.errors:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
