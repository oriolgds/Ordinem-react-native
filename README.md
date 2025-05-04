# Ordinem

<p align="center">
  <img src="./assets/images/ordinem-logo.png" alt="Ordinem Logo" width="200" />
</p>

<p align="center">
  <a href="https://github.com/oriolgds/Ordinem-react-native/releases">
    <img src="https://img.shields.io/github/v/release/oriolgds/Ordinem-react-native?include_prereleases&style=flat-square" alt="Releases" />
  </a>
  <a href="https://github.com/oriolgds/Ordinem-react-native/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/oriolgds/Ordinem-react-native?style=flat-square" alt="License" />
  </a>
  <a href="https://github.com/oriolgds/Ordinem-react-native/stargazers">
    <img src="https://img.shields.io/github/stars/oriolgds/Ordinem-react-native?style=flat-square" alt="Stars" />
  </a>
  <a href="https://github.com/oriolgds/Ordinem-react-native/network/members">
    <img src="https://img.shields.io/github/forks/oriolgds/Ordinem-react-native?style=flat-square" alt="Forks" />
  </a>
  <a href="https://github.com/oriolgds/Ordinem-react-native/issues">
    <img src="https://img.shields.io/github/issues/oriolgds/Ordinem-react-native?style=flat-square" alt="Issues" />
  </a>
</p>

## 🚀 Visión General

Aplicación móvil inteligente construida con React Native y Expo que permite gestionar productos del hogar mediante la integración con armarios conectados, ofreciendo información nutricional detallada y alertas de caducidad.

**Ordinem** revoluciona la gestión de productos en el hogar integrándose con armarios inteligentes que utilizan **inteligencia artificial para detectar automáticamente los productos**, eliminando la necesidad de escanear códigos de barras manualmente.

## ✨ Características Principales

- **Detección automática de productos** mediante IA en los armarios conectados
- **Escaneo de códigos QR** para vincular rápidamente dispositivos
- **Visualización de productos** en tiempo real desde los armarios conectados
- **Información nutricional detallada** con datos de OpenFoodFacts
- **Sistema de notificaciones** para productos próximos a caducar
- **Filtros inteligentes** por categorías, fechas de caducidad y valores nutricionales
- **Modo oscuro** y preferencias personalizables
- **Interfaz intuitiva** diseñada para una gestión eficiente

## 📱 Capturas de pantalla

<p align="center">
  <img src="https://via.placeholder.com/180x380?text=Pantalla+Inicio" width="180" alt="Pantalla de inicio" />
  <img src="https://via.placeholder.com/180x380?text=Lista+Productos" width="180" alt="Lista de productos" />
  <img src="https://via.placeholder.com/180x380?text=Detalle+Producto" width="180" alt="Detalle de producto" />
</p>

## 🛠️ Tecnologías Utilizadas

- **[Expo](https://expo.dev/)** (SDK 52)
- **[React Native](https://reactnative.dev/)** (0.76.9)
- **[Firebase](https://firebase.google.com/)**
  - Authentication
  - Realtime Database
- **[React Navigation 7](https://reactnavigation.org/)**
- **[Expo Router 4](https://docs.expo.dev/router/introduction/)**
- **[TypeScript](https://www.typescriptlang.org/)**

## 📂 Estructura del Proyecto

```
/
├── app/                # Rutas de la aplicación (Expo Router)
│   ├── (tabs)/         # Pantallas de la navegación principal
│   └── modals/         # Pantallas modales
├── assets/             # Imágenes, fuentes, etc.
├── components/         # Componentes reutilizables
├── hooks/              # Custom hooks de React
├── services/           # Servicios (Firebase, API, etc.)
└── utils/              # Utilidades y helpers
```

## ⚙️ Instalación y Configuración

### Requisitos Previos

- Node.js 18+ y NPM
- Expo CLI: `npm install -g expo-cli`
- Cuenta de Firebase

### Pasos para la instalación

1. **Clona este repositorio**
   ```bash
   git clone https://github.com/oriolgds/Ordinem-react-native.git
   cd Ordinem-react-native
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Configura Firebase**
   - Crea un proyecto en [Firebase](https://console.firebase.google.com/)
   - Habilita Authentication y Realtime Database
   - Copia la configuración en `services/firebase.js`

4. **Ejecuta la aplicación**
   ```bash
   npm start        # Inicia el servidor de desarrollo
   npm run android  # Para Android
   npm run ios      # Para iOS (requiere macOS)
   ```

## 🔄 Scripts disponibles

```bash
npm start              # Inicia el servidor de desarrollo
npm run android        # Ejecuta la app en un dispositivo/emulador Android
npm run ios            # Ejecuta la app en un dispositivo/simulador iOS
npm run web            # Ejecuta la app en navegador web
npm run build:android  # Compila la app para producción en Android
npm test               # Ejecuta las pruebas
npm run lint           # Ejecuta el linter
npm run clean          # Limpia los archivos de compilación
```

## 🔐 Seguridad

La aplicación implementa:
- Autenticación segura mediante Firebase Auth
- Validación y verificación de dispositivos vinculados
- Cifrado de datos sensibles
- Comunicación segura con los armarios inteligentes

## 🌐 Integración con OpenFoodFacts

La aplicación se integra con la [API de OpenFoodFacts](https://world.openfoodfacts.org/) para obtener información detallada de los productos detectados, incluyendo datos nutricionales, alergenos, ingredientes y más.

## 🤝 Contribución

Las contribuciones son bienvenidas y apreciadas. Para contribuir:

1. Haz un fork del proyecto
2. Crea una rama para tu característica (`git checkout -b feature/amazing-feature`)
3. Haz commit de tus cambios (`git commit -m 'Add some amazing feature'`)
4. Haz push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

Para más detalles, consulta nuestra [guía de contribución](CONTRIBUTING.md).

## 📄 Licencia

Distribuido bajo la licencia MIT. Consulta el archivo [`LICENSE`](LICENSE) para más información.

## 👥 Ecosistema Ordinem

Este proyecto es parte del ecosistema Ordinem:

- **[Ordinem](https://github.com/oriolgds/Ordinem)** - Repositorio principal del proyecto
- **[Ordinem-react-native](https://github.com/oriolgds/Ordinem-react-native)** - Aplicación móvil (este repositorio)

## 📞 Contacto

**Oriol Giner Díaz** - Fundador y Desarrollador Principal

[![Instagram Badge](https://img.shields.io/badge/-@oriolgds-E4405F?style=flat-square&logo=instagram&logoColor=white)](https://instagram.com/oriolgds)
[![GitHub Badge](https://img.shields.io/badge/-@oriolgds-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/oriolgds)

**Email de contacto:**
- Proyecto: ordinem@europe.com
- Desarrollador: oriolginger2008@gmail.com

---

<p align="center">
  <sub>Desarrollado con ❤️ en Barcelona</sub>
</p>