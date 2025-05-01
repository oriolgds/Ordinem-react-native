import { useState, useEffect } from "react";
import {
  subscribeToDeviceNotifications,
  markNotificationAsRead,
  deleteNotification,
} from "@/services/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Notification {
  id: string;
  deviceId: string;
  type: string;
  title: string;
  message: string;
  product_barcode?: string;
  productId?: string;
  expiration_date?: string;
  priority: number;
  created_at: string;
  read: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Configurar el listener de notificaciones en tiempo real
  useEffect(() => {
    setLoading(true);

    // Iniciar la suscripción a notificaciones
    const unsubscribe = subscribeToDeviceNotifications((newNotifications) => {
      setNotifications(newNotifications);

      // Actualizar contador de notificaciones no leídas
      const unread = newNotifications.filter((n) => !n.read).length;
      setUnreadCount(unread);

      // Guardar contador en AsyncStorage
      AsyncStorage.setItem("unreadNotifications", unread.toString());

      setLoading(false);
      setRefreshing(false);
    });

    // Limpiar el listener cuando el componente se desmonte
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Refrescar notificaciones manualmente
  const onRefresh = async () => {
    setRefreshing(true);
    // El listener se actualizará automáticamente cuando hay cambios
    // Pero podemos forzar una re-lectura espetando un momento
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // Marcar como leída
  const markAsRead = async (notificationId: string) => {
    try {
      // Encontrar la notificación y su deviceId
      const notification = notifications.find((n) => n.id === notificationId);
      if (!notification) return false;

      await markNotificationAsRead(notificationId, notification.deviceId);

      // La actualización del estado se hará automáticamente a través del listener
      return true;
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error);
      return false;
    }
  };

  // Eliminar notificación
  const removeNotification = async (notificationId: string) => {
    try {
      // Encontrar la notificación y su deviceId
      const notification = notifications.find((n) => n.id === notificationId);
      if (!notification) return false;

      await deleteNotification(notificationId, notification.deviceId);

      // La actualización del estado se hará automáticamente a través del listener
      return true;
    } catch (error) {
      console.error("Error al eliminar notificación:", error);
      return false;
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      // Marcar cada notificación no leída como leída
      const promises = notifications
        .filter((notification) => !notification.read)
        .map((notification) =>
          markNotificationAsRead(notification.id, notification.deviceId)
        );

      await Promise.all(promises);

      // La actualización del estado se hará automáticamente a través del listener
      return true;
    } catch (error) {
      console.error(
        "Error al marcar todas las notificaciones como leídas:",
        error
      );
      return false;
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    refreshing,
    onRefresh,
    markAsRead,
    removeNotification,
    markAllAsRead,
  };
}
