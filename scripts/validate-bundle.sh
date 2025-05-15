#!/bin/bash

# Script para validar un Android App Bundle usando bundletool
# Uso: ./validate-bundle.sh ruta/al/bundle.aab

if [ -z "$1" ]; then
    echo "Error: Debes proporcionar la ruta al archivo .aab"
    echo "Uso: ./validate-bundle.sh ruta/al/bundle.aab"
    exit 1
fi

BUNDLE_PATH="$1"

if [ ! -f "$BUNDLE_PATH" ]; then
    echo "Error: El archivo $BUNDLE_PATH no existe"
    exit 1
fi

if [[ ! "$BUNDLE_PATH" == *.aab ]]; then
    echo "Error: El archivo debe tener extensión .aab"
    exit 1
fi

echo "Validando bundle: $BUNDLE_PATH"
echo "-------------------------------"

# Validar el bundle
echo "1. Validando estructura del bundle..."
java -jar bundletool.jar validate --bundle="$BUNDLE_PATH"
VALIDATE_RESULT=$?

if [ $VALIDATE_RESULT -eq 0 ]; then
    echo "✅ El bundle es válido"
else
    echo "❌ El bundle no es válido"
    exit 1
fi

# Generar APKs a partir del bundle para probar
echo "2. Generando APKs a partir del bundle para verificación..."
java -jar bundletool.jar build-apks --bundle="$BUNDLE_PATH" --output="output.apks" --mode=universal

if [ $? -eq 0 ]; then
    echo "✅ APKs generados correctamente"
else
    echo "❌ Error al generar APKs"
    exit 1
fi

# Obtener información del bundle
echo "3. Información del bundle:"
java -jar bundletool.jar dump manifest --bundle="$BUNDLE_PATH"

echo "-------------------------------"
echo "El bundle ha sido validado exitosamente y está listo para subirse a Google Play."
echo "Para instalar el APK generado en un dispositivo, puedes usar:"
echo "java -jar bundletool.jar install-apks --apks=output.apks"
