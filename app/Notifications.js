import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { subscribeToDeviceNotifications, markNotificationAsRead } from '../services/firebase';
import { useNavigation } from '@react-navigation/native';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const auth = getAuth();
    const navigation = useNavigation();

    // Configurar el listener en tiempo real para notificaciones
    useEffect(() => {
        let unsubscribe = null;

        const setupNotificationsListener = async () => {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                setLoading(false);
                return;
            }

            // Suscribirse a notificaciones en tiempo real
            unsubscribe = subscribeToDeviceNotifications((newNotifications) => {
                // Actualizar el estado con las nuevas notificaciones
                setNotifications(newNotifications);
                setLoading(false);
            });
        };

        setupNotificationsListener();

        // Limpiar el listener cuando se desmonte el componente
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    // Función para marcar como leída una notificación
    const handleNotificationPress = async (notification) => {
        try {
            if (!notification.read) {
                // Asegurar que se pasa el deviceId correcto
                await markNotificationAsRead(notification.id, notification.deviceId);

                // No necesitamos actualizar el estado manualmente
                // El listener en tiempo real actualizará el estado automáticamente
            }

            // Si la notificación tiene un producto asociado, navegar a los detalles
            if (notification.product_barcode) {
                navigation.navigate('ProductDetails', {
                    barcode: notification.product_barcode
                });
            }
        } catch (error) {
            console.error('Error al marcar notificación como leída:', error);
        }
    };

    // Función para obtener color según el tipo de notificación
    const getNotificationColor = (type) => {
        switch (type) {
            case 'expired':
                return '#FF5252';
            case 'expiring_soon':
                return '#FFC107';
            case 'expiring_week':
                return '#4CAF50';
            default:
                return '#6D9EBE';
        }
    };

    // Función para obtener ícono según el tipo de notificación
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'expired':
                return 'alert-circle';
            case 'expiring_soon':
                return 'time';
            case 'expiring_week':
                return 'calendar';
            default:
                return 'notifications';
        }
    };

    // Renderizar cada notificación
    const renderNotification = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.notificationItem,
                !item.read && styles.unreadNotification
            ]}
            onPress={() => handleNotificationPress(item)}
        >
            <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.type) }]}>
                <Ionicons
                    name={getNotificationIcon(item.type)}
                    size={24}
                    color="white"
                />
            </View>

            <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{item.title}</Text>
                <Text style={styles.notificationMessage}>{item.message}</Text>
                <Text style={styles.notificationTime}>
                    {new Date(item.created_at).toLocaleDateString()}
                </Text>
            </View>

            {!item.read && (
                <View style={styles.unreadDot} />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6D9EBE" />
                    <Text style={styles.loadingText}>Cargando notificaciones...</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={renderNotification}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
                            <Text style={styles.emptyText}>No tienes notificaciones</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    listContainer: {
        padding: 16,
        flexGrow: 1,
    },
    notificationItem: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    unreadNotification: {
        backgroundColor: '#F0F7FC',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    notificationMessage: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    notificationTime: {
        fontSize: 12,
        color: '#999',
    },
    unreadDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#6D9EBE',
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#666',
        marginTop: 12,
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        marginTop: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 16,
    },
});

export default Notifications;