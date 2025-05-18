import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Share,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import MarkdownRecipe from "@/components/MarkdownRecipe";

export default function RecipeViewerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [recipe, setRecipe] = useState<string>("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [timeAvailable, setTimeAvailable] = useState<string>("");
  const [isVegan, setIsVegan] = useState<boolean>(false);
  const [mealType, setMealType] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Extraer y decodificar los datos de la receta
  useEffect(() => {
    // Asegurarse de que esto se ejecute solo una vez cuando el componente se monta
    // o cuando params cambia
    if (params.recipe) {
      const decodedRecipe = decodeURIComponent(params.recipe as string);

      // Inicializar los estados una sola vez y no volver a cambiarlos
      const initialIngredients = params.ingredients
        ? JSON.parse(decodeURIComponent(params.ingredients as string))
        : [];
      const initialTimeAvailable = (params.timeAvailable as string) || "";
      const initialIsVegan = params.isVegan === "1";
      const initialMealType = (params.mealType as string) || "";

      setRecipe(decodedRecipe);
      setIngredients(initialIngredients);
      setTimeAvailable(initialTimeAvailable);
      setIsVegan(initialIsVegan);
      setMealType(initialMealType);
    }

    setLoading(false);
  }, [
    params.recipe,
    params.ingredients,
    params.timeAvailable,
    params.isVegan,
    params.mealType,
  ]); // Lista de dependencias específicas

  // Función para compartir la receta
  const handleShareRecipe = async () => {
    try {
      const title = recipe.split("\n")[0].replace(/[#\s]/g, "").trim();
      await Share.share({
        message: `${title}\n\n${recipe}\n\nGenerado con Ordinem`,
        title: "Receta generada con Ordinem",
      });
    } catch (error) {
      console.error("Error al compartir la receta:", error);
    }
  };

  // Mapeo de tipos de comida para mostrar en español
  const getMealTypeText = () => {
    const mealTypeMap = {
      breakfast: "Desayuno",
      lunch: "Almuerzo",
      dinner: "Cena",
      snack: "Snack",
      dessert: "Postre",
    };
    return mealTypeMap[mealType] || mealType;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6D9EBE" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receta Generada</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShareRecipe}
        >
          <Ionicons name="share-outline" size={24} color="#6D9EBE" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Info de la receta */}
          <View style={styles.recipeInfo}>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={18} color="#6D9EBE" />
              <Text style={styles.infoText}>
                Tiempo: {timeAvailable} minutos
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons
                name={isVegan ? "leaf-outline" : "restaurant-outline"}
                size={18}
                color="#6D9EBE"
              />
              <Text style={styles.infoText}>
                {isVegan ? "Vegano" : "Regular"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="fast-food-outline" size={18} color="#6D9EBE" />
              <Text style={styles.infoText}>{getMealTypeText()}</Text>
            </View>
          </View>

          {/* Ingredientes utilizados */}
          <View style={styles.ingredientsSection}>
            <Text style={styles.sectionTitle}>Ingredientes utilizados</Text>
            <View style={styles.ingredientsList}>
              {ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={styles.ingredientText}>{ingredient}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Receta */}
          <View style={styles.recipeSection}>
            <Text style={styles.sectionTitle}>Preparación</Text>
            <MarkdownRecipe content={recipe} />
          </View>

          {/* Nota */}
          <View style={styles.noteSection}>
            <Ionicons name="information-circle" size={18} color="#6D9EBE" />
            <Text style={styles.noteText}>
              Receta generada por IA basada en los ingredientes seleccionados.
              Ajusta las cantidades y preparación según sea necesario.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  backButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  recipeInfo: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#333",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  ingredientsSection: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ingredientsList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f8e9",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    margin: 4,
  },
  ingredientText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 6,
  },
  recipeSection: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noteSection: {
    flexDirection: "row",
    backgroundColor: "#E6F2F8",
    padding: 16,
    borderRadius: 10,
    marginVertical: 20,
    alignItems: "flex-start",
  },
  noteText: {
    flex: 1,
    marginLeft: 10,
    color: "#555",
    fontSize: 14,
    lineHeight: 20,
  },
});
