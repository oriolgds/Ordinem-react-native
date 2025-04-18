import { useState, useEffect } from "react";
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
} from "@/services/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "expired" | "expiring_soon" | "info";
  read: boolean;
  timestamp: number;
  productId?: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Cargar notificaciones
  const fetchNotifications = async () => {
    try {
      const notificationsData = await getNotifications();
      setNotifications(notificationsData);

      // Contar notificaciones no leídas
      const unread = notificationsData.filter(
        (notification) => !notification.read
      ).length;
      setUnreadCount(unread);

      // Guardar contador en AsyncStorage para uso en otras partes de la app
      await AsyncStorage.setItem("unreadNotifications", unread.toString());
    } catch (error) {
      console.error("Error al obtener notificaciones:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Cargar notificaciones al inicio
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Refrescar notificaciones
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
  };

  // Marcar como leída
  const markAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);

      // Actualizar estado local
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );

      // Actualizar contador
      setUnreadCount((prev) => Math.max(0, prev - 1));
      await AsyncStorage.setItem(
        "unreadNotifications",
        (unreadCount - 1).toString()
      );

      return true;
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error);
      return false;
    }
  };

  // Eliminar notificación
  const removeNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);

      // Comprobar si la notificación eliminada era no leída
      const wasUnread =
        notifications.find((n) => n.id === notificationId)?.read === false;

      // Actualizar estado local
      setNotifications((prevNotifications) =>
        prevNotifications.filter(
          (notification) => notification.id !== notificationId
        )
      );

      // Actualizar contador si era no leída
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
        await AsyncStorage.setItem(
          "unreadNotifications",
          (unreadCount - 1).toString()
        );
      }

      return true;
    } catch (error) {
      console.error("Error al eliminar notificación:", error);
      return false;
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      // Para cada notificación no leída, marcarla como leída
      const promises = notifications
        .filter((notification) => !notification.read)
        .map((notification) => markNotificationAsRead(notification.id));

      await Promise.all(promises);

      // Actualizar estado local
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => ({
          ...notification,
          read: true,
        }))
      );

      // Actualizar contador
      setUnreadCount(0);
      await AsyncStorage.setItem("unreadNotifications", "0");

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
