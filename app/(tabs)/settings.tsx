import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getUserProfile,
  updateUserSettings,
  signOut,
} from "@/services/firebase";

// Componente para opciones de configuración
const SettingItem = ({ icon, title, subtitle, onPress, rightComponent }) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <View style={styles.settingIconContainer}>
      <Ionicons name={icon} size={22} color="#6D9EBE" />
    </View>
    <View style={styles.settingContent}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    <View style={styles.settingAction}>
      {rightComponent || (
        <Ionicons name="chevron-forward" size={20} color="#CCC" />
      )}
    </View>
  </TouchableOpacity>
);

// Componente para secciones
const SettingSection = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

export default function SettingsScreen() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    notifyExpiringSoon: true,
    notifyExpired: true,
    notifyNewDevice: true,
  });
  const router = useRouter();

  // Cargar perfil de usuario
  const loadUserProfile = async () => {
    try {
      const userProfile = await getUserProfile();
      setUser(userProfile);

      // Cargar configuración de notificaciones
      const storedSettings = await AsyncStorage.getItem("userSettings");
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }

      setLoading(false);
    } catch (error) {
      console.error("Error al cargar perfil de usuario:", error);
      setLoading(false);
    }
  };

  // Efecto para cargar perfil al inicio
  useEffect(() => {
    loadUserProfile();
  }, []);

  // Actualizar configuración de notificaciones
  const updateNotificationSettings = async (key, value) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await AsyncStorage.setItem("userSettings", JSON.stringify(newSettings));
      await updateUserSettings(newSettings);
    } catch (error) {
      console.error("Error al actualizar configuración:", error);
      Alert.alert("Error", "No se pudo actualizar la configuración");
    }
  };

  // Manejar cierre de sesión
  const handleSignOut = () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro de que deseas cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/");
          } catch (error) {
            console.error("Error al cerrar sesión:", error);
            Alert.alert("Error", "No se pudo cerrar sesión");
          }
        },
      },
    ]);
  };

  // Navegación a perfil
  const navigateToProfile = () => {
    router.push("/profile");
  };

  // Navegación a dispositivos
  const navigateToDevices = () => {
    router.push("/devices");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6D9EBE" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Perfil del usuario */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          {user?.photoURL ? (
            <Image
              source={{ uri: user.photoURL }}
              style={styles.profileImage}
            />
          ) : (
            <Ionicons name="person" size={36} color="#6D9EBE" />
          )}
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {user?.displayName || "Usuario"}
          </Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={navigateToProfile}>
          <Ionicons name="create-outline" size={20} color="#6D9EBE" />
        </TouchableOpacity>
      </View>

      {/* Sección de Notificaciones */}
      <SettingSection title="Notificaciones">
        <SettingItem
          icon="notifications-outline"
          title="Productos próximos a expirar"
          subtitle="Recibe alertas cuando tus productos estén próximos a expirar"
          rightComponent={
            <Switch
              value={settings.notifyExpiringSoon}
              onValueChange={(value) =>
                updateNotificationSettings("notifyExpiringSoon", value)
              }
              trackColor={{ false: "#E1E1E8", true: "#A7C7DC" }}
              thumbColor={settings.notifyExpiringSoon ? "#6D9EBE" : "#FFF"}
            />
          }
        />
        <SettingItem
          icon="alert-circle-outline"
          title="Productos expirados"
          subtitle="Recibe alertas cuando tus productos hayan expirado"
          rightComponent={
            <Switch
              value={settings.notifyExpired}
              onValueChange={(value) =>
                updateNotificationSettings("notifyExpired", value)
              }
              trackColor={{ false: "#E1E1E8", true: "#A7C7DC" }}
              thumbColor={settings.notifyExpired ? "#6D9EBE" : "#FFF"}
            />
          }
        />
        <SettingItem
          icon="phone-portrait-outline"
          title="Nuevos dispositivos"
          subtitle="Recibe alertas cuando se inicie sesión desde un nuevo dispositivo"
          rightComponent={
            <Switch
              value={settings.notifyNewDevice}
              onValueChange={(value) =>
                updateNotificationSettings("notifyNewDevice", value)
              }
              trackColor={{ false: "#E1E1E8", true: "#A7C7DC" }}
              thumbColor={settings.notifyNewDevice ? "#6D9EBE" : "#FFF"}
            />
          }
        />
      </SettingSection>

      {/* Sección de Dispositivos */}
      <SettingSection title="Dispositivos">
        <SettingItem
          icon="hardware-chip-outline"
          title="Dispositivos vinculados"
          subtitle="Gestiona los dispositivos conectados a tu cuenta"
          onPress={navigateToDevices}
        />
      </SettingSection>

      {/* Sección de Cuenta */}
      <SettingSection title="Cuenta">
        <SettingItem
          icon="log-out-outline"
          title="Cerrar sesión"
          subtitle="Salir de tu cuenta actual"
          onPress={handleSignOut}
        />
      </SettingSection>

      {/* Información de la app */}
      <View style={styles.appInfo}>
        <Text style={styles.version}>Ordinem v1.0.0</Text>
      </View>
    </ScrollView>
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
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E1E1E8",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F1F3C",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#666",
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    color: "#6D9EBE",
    fontWeight: "600",
    marginLeft: 16,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: "#1F1F3C",
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 12,
    color: "#999",
  },
  settingAction: {
    marginLeft: 16,
  },
  appInfo: {
    alignItems: "center",
    marginVertical: 30,
  },
  version: {
    fontSize: 12,
    color: "#999",
  },
});
