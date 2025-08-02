// Firebase will be initialized when needed
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, Redirect } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "@/services/firebase";
import { User, signInWithCustomToken } from "firebase/auth";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View } from "react-native";
import { LinkingOptions } from "@react-navigation/native";
import { FirebaseProvider } from "@/components/FirebaseProvider";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Definir el tema personalizado de Ordinem
const OrdinemTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#6D9EBE",
    background: "#FFFFFF",
    card: "#FFFFFF",
    text: "#333333",
    border: "#E0E0E0",
    notification: "#FF5252",
  },
};

// Tema oscuro personalizado
const OrdinemDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: "#6D9EBE",
    background: "#121212",
    card: "#1E1E1E",
    text: "#F0F0F0",
    border: "#333333",
    notification: "#FF5252",
  },
};

// En tu configuración de Linking en app/_layout.tsx
const linking: LinkingOptions<any> = {
  prefixes: ["https://oriolgds.github.io/ordinem"],
  config: {
    screens: {
      index: "",
      Login: "login",
      register: "register",
      "(tabs)": {
        screens: {
          products: "products",
          notifications: "notifications",
          settings: "settings",
        },
      },
    },
    initialRouteName: "index",
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);

  // Comprobar si hay una sesión guardada al iniciar la aplicación
  useEffect(() => {
    const checkStoredSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user_credential");

        if (storedUser) {
          const userData = JSON.parse(storedUser);
          // Comprobaciones silenciosas sin consola.log

          // Comprobar si hay un usuario autenticado en Firebase
          if (!auth.currentUser && userData.uid) {
            // Intentar reautenticar usando el token guardado
            const userToken = await AsyncStorage.getItem("userToken");
            if (userToken) {
              try {
                // Verificar que el token sea válido
                const { verifyAndRefreshToken } = await import(
                  "@/services/firebase"
                );
                await verifyAndRefreshToken();
              } catch (reAuthError) {
                // Limpiar datos de sesión inválidos silenciosamente
                await AsyncStorage.removeItem("user_credential");
                await AsyncStorage.removeItem("userToken");
              }
            }
          }
        }

        // No llamar a hideAsync aquí, lo manejaremos en el componente index.tsx
        setIsSessionLoaded(true);
      } catch (error) {
        setIsSessionLoaded(true);
      }
    };

    checkStoredSession();
  }, []);

  // Solo devolvemos null mientras se cargan los assets y fuentes
  // El splash screen permanecerá visible hasta que se oculte explícitamente en index.tsx
  if (!loaded || !isSessionLoaded) {
    return null;
  }

  return (
    <FirebaseProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider
          value={colorScheme === "dark" ? OrdinemDarkTheme : OrdinemTheme}
        >
          <Stack screenOptions={{ headerShown: false }} linking={linking}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="Login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="+not-found"
              options={{ title: "No encontrado" }}
            />
          </Stack>
          <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        </ThemeProvider>
      </GestureHandlerRootView>
    </FirebaseProvider>
  );
}

export function Layout() {
  return (
    <ThemeProvider value={OrdinemTheme}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: OrdinemTheme.colors.primary,
          tabBarInactiveTintColor: "#8E8E93",
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopColor: OrdinemTheme.colors.border,
          },
          headerStyle: {
            backgroundColor: "#FFFFFF",
          },
          headerTintColor: OrdinemTheme.colors.text,
        }}
      >
        <Tabs.Screen
          name="products"
          options={{
            title: "Productos",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cube-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: "Notificaciones",
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="notifications-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Ajustes",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </ThemeProvider>
  );
}
