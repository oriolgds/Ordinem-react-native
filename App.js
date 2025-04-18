import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator';
import { initNotifications } from './services/notifications';
import { LogBox } from 'react-native';

// Ignorar advertencias específicas
LogBox.ignoreLogs([
    'expo-notifications', // Ignorar advertencias de expo-notifications
    'Cannot find native module', // Ignorar advertencias del módulo nativo
    'The route files', // Ignorar advertencias de rutas
]);

// Punto de entrada de la aplicación
export default function App() {
    useEffect(() => {
        // Inicializar notificaciones al arrancar la app
        const setupNotifications = async () => {
            try {
                await initNotifications();
            } catch (error) {
                console.warn('Error al inicializar notificaciones:', error);
            }
        };

        setupNotifications();
    }, []);

    return (
        <SafeAreaProvider>
            <StatusBar style="auto" />
            <AppNavigator />
        </SafeAreaProvider>
    );
} 