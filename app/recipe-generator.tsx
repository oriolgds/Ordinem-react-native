import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { generateRecipe } from "@/src/services/cloudflareAI";
import { useProducts } from "@/hooks/useProducts";
import { fetchProductWithCache } from "@/services/cacheService"; // Importar el servicio de caché
import LoadingRecipeModal from "@/components/LoadingRecipeModal";
import MarkdownRecipe from "@/components/MarkdownRecipe";

const COMMON_FRESH_PRODUCTS = [
  { id: "tomate", name: "Tomate", emoji: "🍅" },
  { id: "cebolla", name: "Cebolla", emoji: "🧅" },
  { id: "ajo", name: "Ajo", emoji: "🧄" },
  { id: "pimiento", name: "Pimiento", emoji: "🫑" },
  { id: "zanahoria", name: "Zanahoria", emoji: "🥕" },
  { id: "patata", name: "Patata", emoji: "🥔" },
  { id: "lechuga", name: "Lechuga", emoji: "🥬" },
  { id: "pepino", name: "Pepino", emoji: "🥒" },
  { id: "limon", name: "Limón", emoji: "🍋" },
  { id: "manzana", name: "Manzana", emoji: "🍎" },
  { id: "naranja", name: "Naranja", emoji: "🍊" },
  { id: "platano", name: "Plátano", emoji: "🍌" },
  { id: "fresa", name: "Fresa", emoji: "🍓" },
  { id: "leche", name: "Leche", emoji: "🥛" },
  { id: "huevo", name: "Huevo", emoji: "🥚" },
  { id: "pan", name: "Pan", emoji: "🍞" },
  { id: "aceite", name: "Aceite", emoji: "🫒" },
  { id: "arroz", name: "Arroz", emoji: "🍚" },
  { id: "pasta", name: "Pasta", emoji: "🍝" },
  { id: "queso", name: "Queso", emoji: "🧀" },
];

export default function RecipeGeneratorScreen() {
  const router = useRouter();
  const { products } = useProducts();
  const [enrichedProducts, setEnrichedProducts] = useState<Product[]>([]); // Nuevo estado para productos enriquecidos

  // Estado para los productos seleccionados del armario
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  // Estado para los productos frescos adicionales
  const [freshIngredients, setFreshIngredients] = useState("");

  const [timeAvailable, setTimeAvailable] = useState("30");
  const [isVegan, setIsVegan] = useState(false);
  const [mealType, setMealType] = useState("dinner");
  const [recipeResult, setRecipeResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Nuevo estado para productos frescos comunes seleccionados
  const [selectedFreshProducts, setSelectedFreshProducts] = useState<string[]>(
    []
  );

  // Estado adicional para controlar el modal de carga
  const [showLoadingModal, setShowLoadingModal] = useState(false);

  // Opciones de tiempo
  const timeOptions = [
    { label: "15 minutos", value: "15" },
    { label: "30 minutos", value: "30" },
    { label: "45 minutos", value: "45" },
    { label: "60 minutos", value: "60" },
    { label: "90 minutos", value: "90" },
  ];

  // Opciones de tipo de comida
  const mealOptions = [
    { label: "Desayuno", value: "breakfast" },
    { label: "Almuerzo", value: "lunch" },
    { label: "Cena", value: "dinner" },
    { label: "Snack", value: "snack" },
    { label: "Postre", value: "dessert" },
  ];

  // Manejar la selección/deselección de un producto
  const toggleProductSelection = (productName: string) => {
    setSelectedProducts((prevSelected) => {
      if (prevSelected.includes(productName)) {
        return prevSelected.filter((name) => name !== productName);
      } else {
        return [...prevSelected, productName];
      }
    });
  };

  // Manejar la selección/deselección de un producto fresco común
  const toggleFreshProduct = (productId: string) => {
    setSelectedFreshProducts((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  // Generar receta
  const handleGenerateRecipe = async () => {
    // Validar que haya ingredientes seleccionados o frescos
    if (
      selectedProducts.length === 0 &&
      !freshIngredients.trim() &&
      selectedFreshProducts.length === 0
    ) {
      setError(
        "Por favor, selecciona algunos productos o añade ingredientes frescos"
      );
      return;
    }

    setIsLoading(true);
    setError("");
    setRecipeResult("");
    setShowLoadingModal(true); // Mostrar modal de carga

    try {
      // Procesar la lista de ingredientes
      const armarioIngredients = [...selectedProducts];

      // Obtener productos frescos seleccionados
      const commonFreshProducts = selectedFreshProducts.map(
        (id) => COMMON_FRESH_PRODUCTS.find((p) => p.id === id)?.name || id
      );

      // Procesar los ingredientes frescos adicionales
      const freshIngredientsList = freshIngredients
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      // Combinar todas las listas
      const allIngredients = [
        ...armarioIngredients,
        ...commonFreshProducts,
        ...freshIngredientsList,
      ];

      if (allIngredients.length === 0) {
        setError(
          "Por favor, selecciona algunos productos o añade ingredientes frescos"
        );
        setIsLoading(false);
        setShowLoadingModal(false);
        return;
      }

      const preferences = {
        timeAvailable,
        isVegan,
        mealType,
      };

      const result = await generateRecipe(allIngredients, preferences);
      setRecipeResult(result);
    } catch (error) {
      setError(`Error al generar la receta: ${error.message}`);
    } finally {
      setIsLoading(false);
      setShowLoadingModal(false);
    }
  };

  // Función para enriquecer los productos con datos de OpenFoodFacts
  const enrichProductsWithOFFData = async () => {
    const enriched = await Promise.all(
      products.map(async (product) => {
        if (product.barcode) {
          try {
            const result = await fetchProductWithCache(product.barcode);
            if (result.product) {
              return {
                ...product,
                name: result.product.product_name || product.name,
              };
            }
          } catch (error) {
            console.error(
              `Error al enriquecer el producto ${product.barcode}:`,
              error
            );
          }
        }
        return product;
      })
    );
    setEnrichedProducts(enriched);
  };

  useEffect(() => {
    enrichProductsWithOFFData(); // Enriquecer productos al cargar
  }, [products]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Generador de Recetas AI</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {/* Sección de ingredientes del armario */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Ingredientes disponibles en el armario
              </Text>
              <Text style={styles.sublabel}>
                Aprovecha los productos que ya tienes en tu armario Ordinem para
                crear recetas sin necesidad de comprar más ingredientes.
              </Text>

              {products.length > 0 ? (
                <View>
                  <View style={styles.productListHeader}>
                    <Text style={styles.productListTitle}>
                      Selecciona los ingredientes a utilizar
                    </Text>
                    <Text style={styles.selectedCount}>
                      {selectedProducts.length} seleccionados
                    </Text>
                  </View>
                  <View style={styles.productList}>
                    {enrichedProducts.map((product) => (
                      <TouchableOpacity
                        key={product.id}
                        style={[
                          styles.productItem,
                          selectedProducts.includes(product.name) &&
                            styles.productItemSelected,
                        ]}
                        onPress={() => toggleProductSelection(product.name)}
                      >
                        <Ionicons
                          name={
                            selectedProducts.includes(product.name)
                              ? "checkmark-circle"
                              : "ellipse-outline"
                          }
                          size={20}
                          color={
                            selectedProducts.includes(product.name)
                              ? "#6D9EBE"
                              : "#999"
                          }
                          style={styles.checkIcon}
                        />
                        <Text style={styles.productName}>{product.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.emptyProductsContainer}>
                  <Ionicons name="cube-outline" size={36} color="#999" />
                  <Text style={styles.emptyProductsText}>
                    No hay productos en el armario
                  </Text>
                </View>
              )}
            </View>

            {/* Sección de productos frescos comunes */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Productos frescos populares</Text>
              <Text style={styles.sublabel}>
                Selecciona los productos frescos que tengas disponibles
              </Text>

              <View style={styles.freshProductsGrid}>
                {COMMON_FRESH_PRODUCTS.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={[
                      styles.freshProductItem,
                      selectedFreshProducts.includes(product.id) &&
                        styles.freshProductItemSelected,
                    ]}
                    onPress={() => toggleFreshProduct(product.id)}
                  >
                    <Text
                      style={[
                        styles.freshProductEmoji,
                        selectedFreshProducts.includes(product.id) &&
                          styles.freshProductEmojiSelected,
                      ]}
                    >
                      {product.emoji}
                    </Text>
                    <Text
                      style={[
                        styles.freshProductName,
                        selectedFreshProducts.includes(product.id) &&
                          styles.freshProductNameSelected,
                      ]}
                    >
                      {product.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sección de ingredientes frescos */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Añade ingredientes frescos</Text>
              <Text style={styles.sublabel}>
                Frutas, verduras y otros productos que no están en el armario
              </Text>
              <TextInput
                style={styles.input}
                value={freshIngredients}
                onChangeText={setFreshIngredients}
                placeholder="Ej: tomates, lechuga, cebolla (separados por comas)"
                multiline
              />
            </View>

            {/* Lista de ingredientes seleccionados */}
            {(selectedProducts.length > 0 ||
              freshIngredients.trim() ||
              selectedFreshProducts.length > 0) && (
              <View style={styles.selectedIngredientsContainer}>
                <Text style={styles.selectedIngredientsTitle}>
                  Ingredientes para tu receta:
                </Text>
                <View style={styles.selectedIngredientsList}>
                  {selectedProducts.map((product, index) => (
                    <View
                      key={`armario-${index}`}
                      style={styles.ingredientChip}
                    >
                      <Text style={styles.ingredientChipText}>{product}</Text>
                      <TouchableOpacity
                        onPress={() => toggleProductSelection(product)}
                      >
                        <Ionicons name="close-circle" size={18} color="#999" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {selectedFreshProducts.map((productId) => {
                    const product = COMMON_FRESH_PRODUCTS.find(
                      (p) => p.id === productId
                    );
                    if (!product) return null;
                    return (
                      <View
                        key={`fresh-common-${productId}`}
                        style={styles.ingredientChip}
                      >
                        <Text style={styles.ingredientEmoji}>
                          {product.emoji}
                        </Text>
                        <Text style={styles.ingredientChipText}>
                          {product.name}
                        </Text>
                        <TouchableOpacity
                          onPress={() => toggleFreshProduct(productId)}
                        >
                          <Ionicons
                            name="close-circle"
                            size={18}
                            color="#999"
                          />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                  {freshIngredients.split(",").map((ingredient, index) => {
                    const trimmed = ingredient.trim();
                    if (!trimmed) return null;
                    return (
                      <View
                        key={`fresh-${index}`}
                        style={[
                          styles.ingredientChip,
                          styles.freshIngredientChip,
                        ]}
                      >
                        <Text style={styles.ingredientChipText}>{trimmed}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tiempo Disponible</Text>
              <View style={styles.optionsContainer}>
                {timeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      timeAvailable === option.value &&
                        styles.optionButtonActive,
                    ]}
                    onPress={() => setTimeAvailable(option.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        timeAvailable === option.value &&
                          styles.optionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Preferencia Dietética</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    !isVegan && styles.toggleButtonActive,
                  ]}
                  onPress={() => setIsVegan(false)}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      !isVegan && styles.toggleTextActive,
                    ]}
                  >
                    Regular
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    isVegan && styles.toggleButtonActive,
                  ]}
                  onPress={() => setIsVegan(true)}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      isVegan && styles.toggleTextActive,
                    ]}
                  >
                    Vegano
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tipo de Comida</Text>
              <View style={styles.optionsContainer}>
                {mealOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      mealType === option.value && styles.optionButtonActive,
                    ]}
                    onPress={() => setMealType(option.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        mealType === option.value && styles.optionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleGenerateRecipe}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.generateButtonText}>Generar Receta</Text>
              )}
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Modal de carga con frases aleatorias */}
            <LoadingRecipeModal visible={showLoadingModal} />

            {recipeResult ? (
              <View style={styles.resultContainer}>
                <Text style={styles.resultTitle}>Tu Receta</Text>
                {/* Usar nuestro componente de Markdown para mostrar la receta */}
                <MarkdownRecipe content={recipeResult} />
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Actualizar los estilos si es necesario
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 16,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
    color: "#555",
  },
  sublabel: {
    fontSize: 14,
    marginBottom: 12,
    color: "#888",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  optionButton: {
    margin: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  optionButtonActive: {
    backgroundColor: "#6D9EBE",
    borderColor: "#6D9EBE",
  },
  optionText: {
    color: "#555",
  },
  optionTextActive: {
    color: "#fff",
    fontWeight: "500",
  },
  toggleContainer: {
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  toggleButton: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  toggleButtonActive: {
    backgroundColor: "#6D9EBE",
  },
  toggleText: {
    fontSize: 16,
    color: "#555",
  },
  toggleTextActive: {
    color: "#fff",
    fontWeight: "500",
  },
  generateButton: {
    backgroundColor: "#6D9EBE",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  generateButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },
  errorText: {
    color: "red",
    marginTop: 10,
    textAlign: "center",
  },
  resultContainer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  recipeText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  productList: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 8,
    maxHeight: 200,
    overflow: "hidden",
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  productItemSelected: {
    backgroundColor: "#E6F2F8",
  },
  checkIcon: {
    marginRight: 8,
  },
  productName: {
    fontSize: 15,
    color: "#333",
  },
  productCategory: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
  },
  productListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  productListTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  selectedCount: {
    fontSize: 14,
    color: "#6D9EBE",
  },
  emptyProductsContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  emptyProductsText: {
    marginTop: 10,
    color: "#999",
    fontSize: 15,
  },
  selectedIngredientsContainer: {
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 15,
  },
  selectedIngredientsTitle: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 10,
    color: "#666",
  },
  selectedIngredientsList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  ingredientChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F2F8",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
  },
  freshIngredientChip: {
    backgroundColor: "#E8F5E9",
  },
  ingredientChipText: {
    fontSize: 14,
    color: "#333",
    marginRight: 4,
  },
  freshProductsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    justifyContent: "space-between",
  },
  freshProductEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  freshProductEmojiSelected: {
    transform: [{ scale: 1.1 }],
  },
  freshProductItem: {
    width: "30%",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
  },
  freshProductItemSelected: {
    backgroundColor: "#6D9EBE",
    borderColor: "#5a8ca9",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  freshProductName: {
    fontSize: 12,
    textAlign: "center",
    color: "#333",
  },
  freshProductNameSelected: {
    color: "#fff",
    fontWeight: "500",
  },
});
