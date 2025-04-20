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

  // Cargar la sesión guardada al inicializar
  useEffect(() => {
    const loadStoredSession = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem("user_credential");
        if (storedUserData && !auth.currentUser) {
          // Si hay datos guardados pero no hay un usuario actualmente autenticado
          // en Firebase, usamos esta información para mostrar un estado de carga
          // mientras Firebase restaura automáticamente la sesión
          setAuthState({
            user: null,
            authenticated: false,
            loading: true,
          });
        }
      } catch (error) {
        console.error("Error al cargar la sesión guardada:", error);
      }
    };

    loadStoredSession();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Usuario autenticado
        try {
          // Obtener el token de autenticación
          const token = await user.getIdToken();
          
          // Guardar el token y los datos de usuario en AsyncStorage
          const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            emailVerified: user.emailVerified,
            token: token,
          };
          
          await AsyncStorage.setItem("user", JSON.stringify(userData));
          await AsyncStorage.setItem("userToken", token);
          
          setAuthState({
            user,
            authenticated: true,
            loading: false,
          });
        } catch (error) {
          console.error("Error al guardar datos de sesión:", error);
          setAuthState({
            user,
            authenticated: true,
            loading: false,
          });
        }
      } else {
        // Usuario no autenticado
        setAuthState({
          user: null,
          authenticated: false,
          loading: false,
        });

        // Limpiar información de usuario en AsyncStorage
        await AsyncStorage.removeItem("user");
        await AsyncStorage.removeItem("userToken");
        await AsyncStorage.removeItem("user_credential");
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
