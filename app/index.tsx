import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import * as SplashScreen from 'expo-splash-screen';

// Mantener el splash screen visible mientras verificamos la autenticación
SplashScreen.preventAutoHideAsync();

export default function Index() {
  const { authenticated, loading } = useAuth();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    // Solo ocultar el splash screen cuando:
    // 1. La autenticación ha terminado de cargar
    // 2. Y hemos mostrado nuestra pantalla de carga por al menos 1 segundo
    const timer = setTimeout(async () => {
      setIsInitialLoading(false);
      if (!loading) {
        await SplashScreen.hideAsync().catch(() => {});
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    // Ocultar el splash screen cuando termina la carga de autenticación
    if (!loading && !isInitialLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loading, isInitialLoading]);

  // Mientras se está cargando, mostramos nuestro propio splash screen personalizado
  if (loading || isInitialLoading) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/ordinem-logo.png')}
            style={styles.splashLogo}
            resizeMode="cover"
          />
        </View>
        <ActivityIndicator size="large" color="#6D9EBE" style={styles.loader} />
      </View>
    );
  }

  // Una vez que la autenticación está lista, redireccionamos según el estado
  if (authenticated) {
    return <Redirect href="/(tabs)/products" />;
  }

  return <Redirect href="/Login" />;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logoContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  splashLogo: {
    width: 150,
    height: 150,
  },
  loader: {
    marginTop: 30,
  }
});