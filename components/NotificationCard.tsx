import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Notification } from '@/hooks/useNotifications';

interface NotificationCardProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationCard({ notification, onPress, onMarkRead, onDelete }: NotificationCardProps) {
  // Iconos según el tipo de notificación
  const getIcon = () => {
    switch (notification.type) {
      case 'expired':
        return <Ionicons name="alert-circle" size={24} color="#FF5252" />;
      case 'expiring_soon':
        return <Ionicons name="time" size={24} color="#F9A826" />;
      default:
        return <Ionicons name="information-circle" size={24} color="#6D9EBE" />;
    }
  };

  // Formatear fecha
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TouchableOpacity 
      style={[styles.container, !notification.read && styles.unreadContainer]} 
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>{getIcon()}</View>
        
        <View style={styles.contentContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {notification.message}
          </Text>
          <Text style={styles.time}>
            {formatDate(notification.timestamp)}
          </Text>
        </View>
      </View>

      {/* Botones de acción */}
      <View style={styles.actions}>
        {!notification.read && (
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => onMarkRead(notification.id)}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#6D9EBE" />
            <Text style={styles.actionText}>Marcar como leída</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]} 
          onPress={() => onDelete(notification.id)}
        >
          <Ionicons name="trash-outline" size={16} color="#FF5252" />
          <Text style={[styles.actionText, styles.deleteText]}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#6D9EBE',
    backgroundColor: '#F8FCFF',
  },
  header: {
    flexDirection: 'row',
  },
  iconContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F1F3C',
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    marginTop: 12,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#6D9EBE',
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: '#FFF5F5',
  },
  deleteText: {
    color: '#FF5252',
  },
}); 