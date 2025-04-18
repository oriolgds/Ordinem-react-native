import { useState, useEffect } from "react";
import { auth } from "@/services/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthState {
  user: User | null;
  authenticated: boolean;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    authenticated: false,
    loading: true,
  });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Usuario autenticado
        setAuthState({
          user,
          authenticated: true,
          loading: false,
        });

        // Guardar información de usuario en AsyncStorage
        await AsyncStorage.setItem(
          "user",
          JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
          })
        );
      } else {
        // Usuario no autenticado
        setAuthState({
          user: null,
          authenticated: false,
          loading: false,
        });

        // Limpiar información de usuario en AsyncStorage
        await AsyncStorage.removeItem("user");
      }
    });

    // Limpiar el listener cuando el componente se desmonte
    return () => unsubscribe();
  }, []);

  // Comprobar si el usuario está autenticado y redirigir si es necesario
  const requireAuth = (redirectTo = "/") => {
    if (!authState.loading && !authState.authenticated) {
      router.replace(redirectTo);
      return false;
    }
    return true;
  };

  // Comprobar si el usuario está autenticado y redirigir a la pantalla principal si lo está
  const redirectIfAuthenticated = (redirectTo = "/(tabs)/products") => {
    if (!authState.loading && authState.authenticated) {
      router.replace(redirectTo);
      return true;
    }
    return false;
  };

  return {
    user: authState.user,
    authenticated: authState.authenticated,
    loading: authState.loading,
    requireAuth,
    redirectIfAuthenticated,
  };
}
