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
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { fetchProductWithCache } from "@/services/cacheService";
import { ProductDetailsModal } from "@/components/ProductDetailsModal";

export default function NotificationsScreen() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productBarcode, setProductBarcode] = useState<string>("");

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

  const handleNotificationPress = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    if (notification.product_barcode) {
      try {
        setProductBarcode(notification.product_barcode);

        const result = await fetchProductWithCache(
          notification.product_barcode
        );

        if (result.product) {
          setSelectedProduct({
            product: result.product,
            status: 1,
            source: result.source,
          });
          setModalVisible(true);
        } else {
          Alert.alert(
            "Producto no encontrado",
            "No se pudo encontrar información para este producto."
          );
        }
      } catch (error) {
        console.error("Error al cargar información del producto:", error);
        Alert.alert(
          "Error",
          "Ocurrió un error al cargar la información del producto."
        );
      }
    }
  };

  useEffect(() => {
    if (!loading && notifications.length === 0) {
      setShowEmpty(true);
    } else {
      setShowEmpty(false);
    }
  }, [loading, notifications.length]);

  const renderMarkAllAsReadButton = () => {
    if (unreadCount === 0) return null;

    return (
      <TouchableOpacity
        style={styles.actionChip}
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
        <Text style={styles.chipText}>Marcar todas como leídas</Text>
      </TouchableOpacity>
    );
  };

  const renderDeleteAllButton = () => {
    if (notifications.length === 0 || isDeleting) return null;

    return (
      <TouchableOpacity
        style={[styles.actionChip, styles.deleteChip]}
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
                      "No se pudieron eliminar todas las notificaciones."
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
        <Text style={[styles.chipText, styles.deleteText]}>Eliminar todas</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6D9EBE" />
      </View>
    );
  }

  if (isDeleting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6D9EBE" />
        <Text style={styles.loadingText}>Eliminando notificaciones...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {notifications.length > 0 && !showEmpty && (
          <View style={styles.gestureHintContainer}>
            <View style={styles.gestureHint}>
              <Ionicons name="swap-horizontal" size={16} color="#999" />
              <Text style={styles.hintText}>Desliza para acciones</Text>
            </View>
          </View>
        )}

        {notifications.length === 0 || showEmpty ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No tienes notificaciones</Text>
          </View>
        ) : (
          <>
            <View style={styles.chipsContainer}>
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
                  onDelete={removeNotification}
                />
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
            />
          </>
        )}

        <ProductDetailsModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          productData={selectedProduct}
          barcode={productBarcode}
        />
      </View>
    </GestureHandlerRootView>
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
    paddingTop: 8,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F0F7FC",
    borderRadius: 20,
  },
  chipText: {
    color: "#6D9EBE",
    fontWeight: "600",
    marginLeft: 6,
    fontSize: 13,
  },
  deleteChip: {
    backgroundColor: "#FFEFEF",
  },
  deleteText: {
    color: "#FF5252",
  },
  loadingText: {
    color: "#666",
    marginTop: 12,
    fontSize: 16,
  },
  gestureHintContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  gestureHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hintText: {
    fontSize: 12,
    color: "#999",
  },
});
