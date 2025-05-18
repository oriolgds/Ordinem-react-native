import { Tabs } from "expo-router";
import React from "react";
import { Platform, TouchableOpacity, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { useColorScheme } from "@/hooks/useColorScheme";

// Definir el tema de Ordinem
const OrdinemColors = {
  light: {
    primary: "#6D9EBE",
    background: "#F2F2F7",
    text: "#1F1F3C",
    border: "#E1E1E8",
  },
  dark: {
    primary: "#6D9EBE",
    background: "#1E1E1E",
    text: "#F2F2F7",
    border: "#333333",
  },
};

export default function TabLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme =
    colorScheme === "dark" ? OrdinemColors.dark : OrdinemColors.light;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: colorScheme === "dark" ? "#666666" : "#8E8E93",
        headerShown: true,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        headerStyle: {
          backgroundColor: colorScheme === "dark" ? "#1E1E1E" : "#FFFFFF",
        },
        headerTintColor: theme.text,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
          },
          default: {
            backgroundColor: colorScheme === "dark" ? "#1E1E1E" : "#FFFFFF",
            borderTopColor: theme.border,
          },
        }),
      }}
    >
      <Tabs.Screen
        name="products"
        options={{
          title: "Productos",
          headerRight: () => (
            <View style={headerStyles.buttonsContainer}>
              <TouchableOpacity
                style={headerStyles.headerButton}
                onPress={() => router.push("/recipe-generator")}
              >
                <Ionicons name="restaurant-outline" size={24} color="#6D9EBE" />
              </TouchableOpacity>
              <TouchableOpacity
                style={headerStyles.headerButton}
                onPress={() => router.push("/pair-device")}
              >
                <Ionicons name="add-circle-outline" size={24} color="#6D9EBE" />
              </TouchableOpacity>
            </View>
          ),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size || 24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notificaciones",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="notifications-outline"
              size={size || 24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ajustes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const headerStyles = StyleSheet.create({
  buttonsContainer: {
    flexDirection: "row",
    marginRight: 8,
  },
  headerButton: {
    padding: 8,
    marginHorizontal: 4,
  },
});
