import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const phrases = [
  "Mezclando los ingredientes perfectos...",
  "Buscando combinaciones deliciosas...",
  "¡Encendiendo los fogones virtuales!",
  "Consultando a chefs de todo el mundo...",
  "Removiendo la creatividad culinaria...",
  "Añadiendo un toque de magia...",
  "Probando los sabores...",
  "Afinando las proporciones...",
  "Ajustando el tiempo de cocción...",
  "Cocinando una receta a tu medida...",
  "Seleccionando las mejores combinaciones...",
  "Explorando nuevas posibilidades gastronómicas...",
  "¡Tu receta está casi lista!",
  "Reduciendo la salsa de ideas...",
  "Montando el plato perfecto para ti...",
];

interface LoadingRecipeModalProps {
  visible: boolean;
}

const LoadingRecipeModal = ({ visible }: LoadingRecipeModalProps) => {
  const [currentPhrase, setCurrentPhrase] = useState(phrases[0]);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const spinValue = React.useRef(new Animated.Value(0)).current;
  const iconSize = React.useRef(new Animated.Value(1)).current;

  // Animación de rotación continua
  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Animación de pulsación para el ícono
      Animated.loop(
        Animated.sequence([
          Animated.timing(iconSize, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.ease,
          }),
          Animated.timing(iconSize, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.ease,
          }),
        ])
      ).start();

      // Sistema para cambiar frases cada ciertos segundos con animación de fade
      let phraseInterval = setInterval(() => {
        // Fade out
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          // Cambiar frase
          setCurrentPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
          // Fade in
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        });
      }, 3500);

      // Iniciar con fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      return () => clearInterval(phraseInterval);
    }
  }, [visible]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Animated.View
            style={[
              styles.iconContainer,
              { transform: [{ rotate: spin }, { scale: iconSize }] },
            ]}
          >
            <Ionicons name="restaurant" size={50} color="#6D9EBE" />
          </Animated.View>

          <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
            {currentPhrase}
          </Animated.Text>

          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="large" color="#6D9EBE" />
          </View>

          <Text style={styles.subtitle}>
            Tu receta personalizada se está creando...
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainer: {
    backgroundColor: "#F0F7FC",
    borderRadius: 50,
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
    height: 50, // Altura fija para evitar saltos
  },
  loadingIndicator: {
    marginVertical: 15,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 5,
  },
});

export default LoadingRecipeModal;
