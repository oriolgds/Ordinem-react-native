import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator, Image, StyleSheet } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { initNotifications } from './services/notifications';
import { LogBox } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Ignorar advertencias específicas
LogBox.ignoreLogs([
    'expo-notifications', // Ignorar advertencias de expo-notifications
    'Cannot find native module', // Ignorar advertencias del módulo nativo
    'The route files', // Ignorar advertencias de rutas
]);

// Punto de entrada de la aplicación
export default function App() {
    const [isReady, setIsReady] = useState(false);
    
    useEffect(() => {
        // Función para inicializar la aplicación
        const initialize = async () => {
            try {
                // Inicializar notificaciones
                await initNotifications();
                
                // Simular un pequeño retraso para asegurar que la comprobación de autenticación se haya completado
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                setIsReady(true);
            } catch (error) {
                console.warn('Error al inicializar la aplicación:', error);
                setIsReady(true);
            }
        };

        initialize();
    }, []);

    // Mostrar pantalla de splash mientras se inicializa
    if (!isReady) {
        return (
            <View style={styles.splashContainer}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('./assets/images/ordinem-logo.png')}
                        style={styles.splashLogo}
                        resizeMode="cover"
                    />
                </View>
                <ActivityIndicator size="large" color="#6D9EBE" style={styles.loader} />
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <StatusBar style="auto" />
                <AppNavigator />
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
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