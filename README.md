# Ordinem - Aplicación Móvil

Aplicación móvil para el sistema de gestión de productos Ordinem desarrollada con Expo y React Native.

## Características

- **Escaneo de códigos QR** para emparejar dispositivos
- **Visualización de productos** en tiempo real
- **Sistema de notificaciones** para productos próximos a expirar
- **Información nutricional detallada** de los productos
- **Filtros por categorías** y fechas de caducidad
- **Modo oscuro** y preferencias personalizables

## Estructura del Proyecto

```
/mobile
  /app         # Pantallas principales
  /assets      # Imágenes, fuentes, etc.
  /components  # Componentes reutilizables
  /hooks       # Custom hooks de React
  /navigation  # Configuración de React Navigation
  /services    # Servicios (Firebase, API, etc.)
  /utils       # Utilidades y helpers
```

## Tecnologías Utilizadas

- **Expo SDK 50+**
- **React Native**
- **Firebase**
  - Authentication
  - Realtime Database
- **React Navigation 7**
- **Bun** (gestor de paquetes)

## Requisitos Previos

- Node.js 16+
- Bun instalado globalmente
- Cuenta de Firebase
- Expo CLI (opcional)

## Instalación

1. Clona este repositorio
   ```
   git clone https://github.com/tu-usuario/ordinem-app.git
   cd ordinem-app
   ```

2. Instala las dependencias
   ```
   bun install
   ```

3. Configura Firebase
   - Crea un proyecto en Firebase
   - Habilita Authentication y Realtime Database
   - Actualiza la configuración en `services/firebase.js`

4. Ejecuta la aplicación
   ```
   bun run android  # Para Android
   bun run ios      # Para iOS (requiere macOS)
   bun run web      # Para web
   ```

## Seguridad

La aplicación implementa:
- Cifrado AES-256-CBC para los códigos QR
- Autenticación segura mediante Firebase Auth
- Validación de dispositivos emparejados

## Integración con OpenFoodFacts

La aplicación se integra con la API de OpenFoodFacts para obtener información detallada de los productos escaneados.

## Contribución

1. Haz un fork del proyecto
2. Crea una rama para tu característica (`git checkout -b feature/amazing-feature`)
3. Haz commit de tus cambios (`git commit -m 'Add some amazing feature'`)
4. Haz push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## Licencia

Distribuido bajo la licencia MIT. Consulta `LICENSE` para más información.

## Contacto

Tu Nombre - [@tu_twitter](https://twitter.com/tu_twitter) - email@ejemplo.com

Enlace del proyecto: [https://github.com/tu-usuario/ordinem-app](https://github.com/tu-usuario/ordinem-app) 