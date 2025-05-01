import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationCard } from '@/components/NotificationCard';

export default function NotificationsScreen() {
  const { 
    notifications, 
    loading, 
    refreshing, 
    onRefresh, 
    markAsRead, 
    removeNotification,
    markAllAsRead,
    unreadCount,
  } = useNotifications();
  const router = useRouter();

  // Manejar presión de notificación (navegar al detalle del producto)
  const handleNotificationPress = (notification) => {
    if (notification.product_barcode) {
      router.push({
        pathname: '/ProductDetails',
        params: { barcode: notification.product_barcode }
      });
      
      // Marcar como leída al abrir
      if (!notification.read) {
        markAsRead(notification.id);
      }
    }
  };

  // Manejar eliminación de notificación
  const handleDeleteNotification = (notificationId) => {
    Alert.alert(
      'Eliminar notificación',
      '¿Estás seguro de que deseas eliminar esta notificación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => removeNotification(notificationId),
        }
      ]
    );
  };

  // Botón para marcar todas como leídas
  const renderMarkAllAsReadButton = () => {
    if (unreadCount === 0) return null;
    
    return (
      <TouchableOpacity 
        style={styles.markAllButton}
        onPress={() => {
          Alert.alert(
            'Marcar todas como leídas',
            '¿Quieres marcar todas las notificaciones como leídas?',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Aceptar', onPress: markAllAsRead }
            ]
          );
        }}
      >
        <Ionicons name="checkmark-done" size={18} color="#6D9EBE" />
        <Text style={styles.markAllText}>Marcar todas como leídas</Text>
      </TouchableOpacity>
    );
  };

  // Indicador de carga durante la carga inicial
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6D9EBE" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>No tienes notificaciones</Text>
        </View>
      ) : (
        <>
          {renderMarkAllAsReadButton()}
          <FlatList
            data={notifications}
            renderItem={({ item }) => (
              <NotificationCard 
                notification={item}
                onPress={handleNotificationPress}
                onMarkRead={markAsRead}
                onDelete={handleDeleteNotification}
              />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#6D9EBE']}
              />
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  list: {
    padding: 16,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#F0F7FC',
    borderRadius: 8,
    margin: 16,
    marginBottom: 0,
  },
  markAllText: {
    color: '#6D9EBE',
    fontWeight: '600',
    marginLeft: 8,
  },
});