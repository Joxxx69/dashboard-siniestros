#!/bin/bash
# Ejecuta todos los seeds e importación en orden.
# Uso: bash seed_all.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

source venv/bin/activate

run() {
    echo ""
    echo "▶ $1"
    echo "────────────────────────────────────────"
    python "$1"
}

run seeds/seed_estados.py
run seeds/seed_cultivos.py
run seeds/seed_causas.py
run seeds/seed_ubicaciones.py
run imports/import_siniestros_2022_2026.py

echo ""
echo "========================================"
echo "Seed completo."
