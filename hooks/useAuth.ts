import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, verifyAndRefreshToken } from "@/services/firebase";
import { onAuthStateChanged } from "firebase/auth";

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

  // Intentar restaurar la sesión al iniciar
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Verificar si tenemos un token válido
        const user = await verifyAndRefreshToken();
        if (user) {
          setAuthState({
            user,
            authenticated: true,
            loading: false,
          });
        } else {
          setAuthState({
            user: null,
            authenticated: false,
            loading: false,
          });
        }
      } catch (error) {
        console.error("Error al restaurar sesión:", error);
        setAuthState({
          user: null,
          authenticated: false,
          loading: false,
        });
      }
    };

    restoreSession();
  }, []);

  // Escuchar cambios en el estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Obtener un token fresco
          const token = await user.getIdToken(true);
          await AsyncStorage.setItem("userToken", token);

          setAuthState({
            user,
            authenticated: true,
            loading: false,
          });
        } catch (error) {
          console.error("Error al actualizar token:", error);
          setAuthState({
            user: null,
            authenticated: false,
            loading: false,
          });
        }
      } else {
        // Limpiar datos de sesión
        await AsyncStorage.multiRemove(["user_credential", "userToken"]);
        setAuthState({
          user: null,
          authenticated: false,
          loading: false,
        });
      }
    });

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
