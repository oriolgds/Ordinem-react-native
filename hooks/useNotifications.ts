import { useState, useEffect, useRef } from "react";
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
  const unsubscribeRef = useRef<() => void | null>(null);

  // Configurar el listener de notificaciones en tiempo real
  useEffect(() => {
    setLoading(true);
    console.log("Configurando listener de notificaciones...");

    // Iniciar la suscripción a notificaciones
    const unsubscribe = subscribeToDeviceNotifications((newNotifications) => {
      console.log(
        `Recibidas ${newNotifications.length} notificaciones en tiempo real`
      );
      setNotifications(newNotifications);

      // Actualizar contador de notificaciones no leídas
      const unread = newNotifications.filter((n) => !n.read).length;
      setUnreadCount(unread);

      // Guardar contador en AsyncStorage
      AsyncStorage.setItem("unreadNotifications", unread.toString());

      setLoading(false);
      setRefreshing(false);
    });

    // Guardar la función para cancelar listener
    unsubscribeRef.current = unsubscribe;

    // Limpiar el listener cuando el componente se desmonte
    return () => {
      console.log("Limpiando listener de notificaciones");
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
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

  // Eliminar notificación - Verificar implementación
  const removeNotification = async (notificationId: string) => {
    try {
      // Encontrar la notificación y su deviceId
      const notification = notifications.find((n) => n.id === notificationId);
      if (!notification) return false;

      console.log(
        `Eliminando notificación ${notificationId} del dispositivo ${notification.deviceId}`
      );

      // Asegurar que se pasa correctamente el deviceId
      await deleteNotification(notificationId, notification.deviceId);

      // La actualización del estado se hará automáticamente a través del listener
      return true;
    } catch (error) {
      console.error("Error al eliminar notificación:", error);
      return false;
    }
  };

  // Añadir función para eliminar todas las notificaciones
  const removeAllNotifications = async () => {
    try {
      if (notifications.length === 0) return true;

      console.log(`Eliminando ${notifications.length} notificaciones...`);

      // Crear un array de promesas para eliminar cada notificación
      const promises = notifications.map((notification) => {
        console.log(
          `Preparando eliminación de notificación ${notification.id} del dispositivo ${notification.deviceId}`
        );
        return deleteNotification(notification.id, notification.deviceId);
      });

      // Ejecutar todas las promesas
      await Promise.all(promises);
      console.log("Todas las notificaciones eliminadas correctamente");

      // Ya no necesitamos actualizar el estado manualmente,
      // el listener detectará los cambios automáticamente

      return true;
    } catch (error) {
      console.error("Error al eliminar todas las notificaciones:", error);
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
    removeAllNotifications,
  };
}
