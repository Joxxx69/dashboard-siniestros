#!/bin/bash
# Setup del entorno Python para el script de importación

echo "Creando entorno virtual..."
python3 -m venv venv

echo "Activando entorno virtual..."
source venv/bin/activate

echo "Instalando dependencias..."
pip install -r requirements.txt

echo ""
echo "Setup completo."
echo ""
echo "Próximos pasos:"
echo "  1. Completar scripts/.env con tus credenciales de Supabase"
echo "  2. Activar el entorno: source venv/bin/activate"
echo "  3. Ejecutar: python import_siniestros.py <archivo.xlsx>"
