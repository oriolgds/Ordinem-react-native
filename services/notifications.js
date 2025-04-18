import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuración de notificaciones
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Registrar para notificaciones push
export const registerForPushNotificationsAsync = async () => {
    try {
        let token;

        // Verificar si el dispositivo es compatible (no aplica para web)
        if (Platform.OS !== 'web') {
            // Solicitar permisos
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            // Si no tenemos permisos, solicitarlos
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            // Si el usuario rechazó los permisos, no podemos mostrar notificaciones
            if (finalStatus !== 'granted') {
                console.log('No se obtuvieron permisos para notificaciones push');
                return null;
            }

            // Obtener token de Expo
            token = (await Notifications.getExpoPushTokenAsync({ projectId: '447748932648' })).data;
            console.log('Token de notificaciones push:', token);

            // Guardar token en AsyncStorage
            await AsyncStorage.setItem('pushToken', token);
        } else {
            console.log('Las notificaciones push no están disponibles en la web');
        }

        // Configuración específica para Android
        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#6D9EBE',
            });
        }

        return token;
    } catch (error) {
        console.error('Error al registrar para notificaciones:', error);
        return null;
    }
};

// Enviar notificación local
export const sendLocalNotification = async (title, body, data = {}) => {
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
            },
            trigger: null, // Inmediatamente
        });

        return true;
    } catch (error) {
        console.error('Error al enviar notificación local:', error);
        return false;
    }
};

// Programar notificación
export const scheduleNotification = async (title, body, trigger, data = {}) => {
    try {
        const identifier = await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
            },
            trigger,
        });

        return identifier;
    } catch (error) {
        console.error('Error al programar notificación:', error);
        return null;
    }
};

// Cancelar todas las notificaciones
export const cancelAllNotifications = async () => {
    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
        return true;
    } catch (error) {
        console.error('Error al cancelar notificaciones:', error);
        return false;
    }
};

// Inicializar notificaciones
export const initNotifications = async () => {
    return await registerForPushNotificationsAsync();
}; 