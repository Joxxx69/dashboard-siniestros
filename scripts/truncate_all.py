"""
Script de truncate: limpia todas las tablas en orden correcto (FK safe).

Uso:
    python truncate_all.py
    python truncate_all.py --dry-run
    python truncate_all.py --tables siniestros cantones
"""

import os
import sys
import argparse
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

# Orden respetando FK: primero las tablas que referencian, luego las referenciadas
TRUNCATE_ORDER = [
    "siniestros",       # FK → cultivos, cantones, causas_siniestro, estados_siniestro
    "cantones",         # FK → provincias
    "provincias",
    "cultivos",
    "causas_siniestro",
    "estados_siniestro",
]


def truncate_table(client, table: str, dry_run: bool) -> int:
    if dry_run:
        res = client.table(table).select("id", count="exact").execute()
        count = res.count or 0
        print(f"  [DRY-RUN] {table}: {count} registros se eliminarían")
        return count

    res = client.table(table).delete().neq("id", 0).execute()
    deleted = len(res.data) if res.data else 0
    print(f"  ✓ {table}: {deleted} registros eliminados")
    return deleted


def main():
    parser = argparse.ArgumentParser(description="Truncate tablas de Supabase")
    parser.add_argument("--dry-run", action="store_true", help="Solo muestra cuántos registros se eliminarían")
    parser.add_argument("--tables", nargs="+", choices=TRUNCATE_ORDER, metavar="TABLE",
                        help="Tablas específicas a truncar (en el orden indicado)")
    args = parser.parse_args()

    client = create_client(SUPABASE_URL, SUPABASE_KEY)

    tables = args.tables if args.tables else TRUNCATE_ORDER
    # Reordenar según TRUNCATE_ORDER para respetar FKs aunque el usuario pase en otro orden
    tables = [t for t in TRUNCATE_ORDER if t in tables]

    mode = "DRY-RUN" if args.dry_run else "TRUNCATE"
    print(f"\n{'─' * 40}")
    print(f"  Modo: {mode}")
    print(f"  Tablas: {', '.join(tables)}")
    print(f"{'─' * 40}\n")

    if not args.dry_run:
        confirm = input("¿Confirmas que deseas eliminar TODOS los datos? [s/N]: ").strip().lower()
        if confirm != "s":
            print("Operación cancelada.")
            sys.exit(0)

    total = 0
    for table in tables:
        try:
            total += truncate_table(client, table, args.dry_run)
        except Exception as e:
            print(f"  ✗ {table}: ERROR → {e}")
            sys.exit(1)

    print(f"\n{'─' * 40}")
    label = "se eliminarían" if args.dry_run else "eliminados en total"
    print(f"  {total} registros {label}.")
    print(f"{'─' * 40}\n")


if __name__ == "__main__":
    main()
