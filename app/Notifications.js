import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { getUserNotifications, markNotificationAsRead } from '../services/firebase';
import { useNavigation } from '@react-navigation/native';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const auth = getAuth();
    const navigation = useNavigation();

    // Cargar notificaciones al montar el componente
    useEffect(() => {
        loadNotifications();
    }, []);

    // Función para cargar notificaciones
    const loadNotifications = async () => {
        try {
            setLoading(true);
            const currentUser = auth.currentUser;

            if (!currentUser) {
                setLoading(false);
                return;
            }

            // Obtener notificaciones del usuario
            const userNotifications = await getUserNotifications(currentUser.uid);

            if (userNotifications) {
                // Transformar el objeto de notificaciones en un array
                const notificationsArray = Object.keys(userNotifications).map(notificationId => ({
                    id: notificationId,
                    ...userNotifications[notificationId]
                }));

                // Ordenar por fecha de creación (más recientes primero)
                notificationsArray.sort((a, b) => b.created_at - a.created_at);

                setNotifications(notificationsArray);
            } else {
                setNotifications([]);
            }
        } catch (error) {
            console.error('Error al cargar notificaciones:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Función para refrescar la lista
    const onRefresh = () => {
        setRefreshing(true);
        loadNotifications();
    };

    // Función para marcar como leída una notificación
    const handleNotificationPress = async (notification) => {
        try {
            if (!notification.read) {
                await markNotificationAsRead(auth.currentUser.uid, notification.id);

                // Actualizar el estado local
                setNotifications(prevNotifications =>
                    prevNotifications.map(item =>
                        item.id === notification.id ? { ...item, read: true } : item
                    )
                );
            }

            // Si la notificación tiene un producto asociado, navegar a los detalles
            if (notification.product_barcode) {
                // Aquí habría que obtener los datos del producto y navegar a la pantalla de detalles
                // Por simplicidad, mostraremos un mensaje
                alert(`Navegando a producto con código: ${notification.product_barcode}`);
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
            {loading && !refreshing ? (
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
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#6D9EBE']}
                        />
                    }
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