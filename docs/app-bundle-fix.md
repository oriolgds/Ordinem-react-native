# Solución del Error de App Bundle

## Problema
El error `File 'BundleConfig.pb' was not found.` indica que hay un problema con la estructura del App Bundle generado. Este archivo es esencial para el formato de Android App Bundle (AAB).

## Soluciones implementadas

### 1. Cambio en la configuración de compilación
- Se ha modificado `eas.json` para generar un App Bundle en lugar de un APK para la versión de producción.

### 2. Herramientas para validar el App Bundle
- Se ha descargado `bundletool` para validar localmente los App Bundles.
- Se ha creado un script `validate-bundle.sh` para facilitar la validación de App Bundles.

## Cómo solucionar el problema

### Paso 1: Generar un nuevo App Bundle
```bash
npm run build:aab-local
```
Este comando generará un archivo AAB (Android App Bundle) en lugar de un APK.

### Paso 2: Validar el App Bundle generado
```bash
npm run validate:bundle ruta/al/archivo.aab
```
Este comando validará el App Bundle y confirmará si es válido para subir a Google Play.

### Paso 3 (opcional): Generar APKs para pruebas
Si necesitas probar el App Bundle en un dispositivo antes de subirlo:

```bash
java -jar bundletool.jar build-apks --bundle=ruta/al/archivo.aab --output=output.apks --mode=universal
java -jar bundletool.jar install-apks --apks=output.apks
```

## Notas adicionales

- Los App Bundles son el formato recomendado por Google Play Store.
- Los archivos AAB son más eficientes y permiten a Google Play generar APKs optimizados para cada dispositivo.
- Si sigues teniendo problemas, asegúrate de que tu proyecto está actualizado:
  ```bash
  npm run clean
  npm run prebuild
  ```

## Enlaces útiles
- [Documentación oficial de Bundletool](https://developer.android.com/tools/bundletool)
- [Guía de App Bundles de Android](https://developer.android.com/guide/app-bundle)
