import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationCard } from "@/components/NotificationCard";

export default function NotificationsScreen() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const {
    notifications,
    loading,
    markAsRead,
    removeNotification,
    markAllAsRead,
    unreadCount,
    removeAllNotifications,
  } = useNotifications();
  const router = useRouter();

  // Manejar presión de notificación (navegar al detalle del producto)
  const handleNotificationPress = (notification) => {
    if (notification.product_barcode) {
      router.push({
        pathname: "/ProductDetails",
        params: { barcode: notification.product_barcode },
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
      "Eliminar notificación",
      "¿Estás seguro de que deseas eliminar esta notificación?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => removeNotification(notificationId),
        },
      ]
    );
  };

  // Efecto para controlar mejor la transición a pantalla vacía
  useEffect(() => {
    // Si terminamos la eliminación y no hay notificaciones, mostrar pantalla vacía
    if (!loading && notifications.length === 0) {
      setShowEmpty(true);
    } else {
      setShowEmpty(false);
    }
  }, [loading, notifications.length]);

  // Botón para marcar todas como leídas
  const renderMarkAllAsReadButton = () => {
    if (unreadCount === 0) return null;

    return (
      <TouchableOpacity
        style={styles.markAllButton}
        onPress={() => {
          Alert.alert(
            "Marcar todas como leídas",
            "¿Quieres marcar todas las notificaciones como leídas?",
            [
              { text: "Cancelar", style: "cancel" },
              { text: "Aceptar", onPress: markAllAsRead },
            ]
          );
        }}
      >
        <Ionicons name="checkmark-done" size={18} color="#6D9EBE" />
        <Text style={styles.markAllText}>Marcar todas como leídas</Text>
      </TouchableOpacity>
    );
  };

  // Botón para eliminar todas las notificaciones
  const renderDeleteAllButton = () => {
    if (notifications.length === 0 || isDeleting) return null;

    return (
      <TouchableOpacity
        style={[styles.markAllButton, styles.deleteAllButton]}
        onPress={() => {
          Alert.alert(
            "Eliminar todas las notificaciones",
            "¿Estás seguro de que deseas eliminar todas las notificaciones? Esta acción no se puede deshacer.",
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Eliminar todas",
                style: "destructive",
                onPress: async () => {
                  setIsDeleting(true);
                  try {
                    // Forzar inmediatamente la UI vacía para mejor UX
                    setShowEmpty(true);
                    await removeAllNotifications();
                  } catch (error) {
                    console.error(
                      "Error al eliminar todas las notificaciones:",
                      error
                    );
                    setShowEmpty(false);
                    Alert.alert(
                      "Error",
                      "No se pudieron eliminar todas las notificaciones. Inténtalo de nuevo."
                    );
                  } finally {
                    setIsDeleting(false);
                  }
                },
              },
            ]
          );
        }}
      >
        <Ionicons name="trash-outline" size={18} color="#FF5252" />
        <Text style={styles.deleteAllText}>
          Eliminar todas las notificaciones
        </Text>
      </TouchableOpacity>
    );
  };

  // Indicador de carga durante la carga inicial
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6D9EBE" />
      </View>
    );
  }

  // Pantalla durante proceso de eliminación
  if (isDeleting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6D9EBE" />
        <Text style={styles.loadingText}>Eliminando notificaciones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {notifications.length === 0 || showEmpty ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>No tienes notificaciones</Text>
        </View>
      ) : (
        <>
          <View style={styles.actionButtons}>
            {renderMarkAllAsReadButton()}
            {renderDeleteAllButton()}
          </View>
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
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
    textAlign: "center",
  },
  list: {
    padding: 16,
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    backgroundColor: "#F0F7FC",
    borderRadius: 8,
    margin: 16,
    marginBottom: 0,
  },
  markAllText: {
    color: "#6D9EBE",
    fontWeight: "600",
    marginLeft: 8,
  },
  actionButtons: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    gap: 8, // Espacio entre los botones
  },
  deleteAllButton: {
    backgroundColor: "#FFEFEF",
  },
  deleteAllText: {
    color: "#FF5252",
    fontWeight: "600",
    marginLeft: 8,
  },
  loadingText: {
    color: "#666",
    marginTop: 12,
    fontSize: 16,
  },
});
