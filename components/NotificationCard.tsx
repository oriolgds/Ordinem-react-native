import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Notification } from "@/hooks/useNotifications";
import { Swipeable } from "react-native-gesture-handler";

interface NotificationCardProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationCard({
  notification,
  onPress,
  onMarkRead,
  onDelete,
}: NotificationCardProps) {
  const swipeableRef = useRef<Swipeable>(null);

  // Iconos según el tipo de notificación
  const getIcon = () => {
    switch (notification.type) {
      case "expired":
        return <Ionicons name="alert-circle" size={24} color="#FF5252" />;
      case "expiring_soon":
        return <Ionicons name="time" size={24} color="#F9A826" />;
      default:
        return <Ionicons name="information-circle" size={24} color="#6D9EBE" />;
    }
  };

  // Formatear fecha
  const formatDate = (timestamp: number | string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Renderizar acciones en el lado derecho (estilo iOS)
  const renderRightActions = () => {
    return (
      <View style={styles.actionsContainer}>
        {/* Separador invisible entre la card y el primer botón */}
        <View style={styles.actionOuterSpacing} />
        {!notification.read && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.readButton,
              styles.actionButtonSpacing,
            ]}
            onPress={() => {
              swipeableRef.current?.close();
              onMarkRead(notification.id);
            }}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFF" />
            <Text style={styles.actionText}>Leída</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => {
            swipeableRef.current?.close();
            onDelete(notification.id);
          }}
        >
          <Ionicons name="trash" size={20} color="#FFF" />
          <Text style={styles.actionText}>Eliminar</Text>
        </TouchableOpacity>
        {/* Separador invisible al final para simetría */}
        <View style={styles.actionOuterSpacing} />
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      friction={1.5} // Ajustado para un deslizamiento más suave
      overshootRight={false} // No permitir que se estire demasiado
      containerStyle={styles.swipeableContainer}
      rightThreshold={40} // Umbral más bajo para activar la acción
    >
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
              {formatDate(notification.created_at)}
            </Text>
          </View>

          {!notification.read && <View style={styles.unreadIndicator} />}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  swipeableContainer: {
    backgroundColor: "transparent",
    marginBottom: 12,
  },
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadContainer: {
    borderLeftWidth: 4,
    borderLeftColor: "#6D9EBE",
    backgroundColor: "#F8FCFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  time: {
    fontSize: 12,
    color: "#999",
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#6D9EBE",
    marginLeft: 8,
  },
  // Estilos mejorados para los botones de acción (estilo iOS/Cupertino)
  actionsContainer: {
    flexDirection: "row",
    alignItems: "stretch",
    height: "100%",
    backgroundColor: "transparent",
  },
  actionOuterSpacing: {
    width: 8, // Separación entre la card y el primer botón (y al final)
  },
  actionButton: {
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  actionButtonSpacing: {
    marginRight: 2, // Separación mínima entre botones
  },
  readButton: {
    backgroundColor: "#64D2FF",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
  },
  actionText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 4,
  },
});
