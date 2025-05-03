import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Dimensions,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { clearProductCache } from "@/services/cacheService";

// Nuevas interfaces para el sistema de puntuación
interface AdditiveRisk {
  code: string;
  name: string;
  risk: "none" | "low" | "moderate" | "high";
}

interface ProductScore {
  total: number; // 0-100
  nutritional: number; // 0-60
  additives: number; // 0-30
  organic: number; // 0-10
}

interface NutrientInfo {
  label: string;
  value: number;
  unit: string;
}

interface ProductData {
  product: {
    product_name: string;
    brands: string;
    image_url: string;
    nutriscore_grade?: string;
    ecoscore_grade?: string;
    ingredients_text: string;
    additives_tags?: string[]; // Para los códigos de aditivos
    additives_original_tags?: string[]; // Nombres originales de aditivos
    labels_tags?: string[]; // Para detectar si es orgánico
    nutriments: {
      energy_100g: number;
      proteins_100g: number;
      carbohydrates_100g: number;
      fat_100g: number;
      fiber_100g: number;
      salt_100g: number;
      sugars_100g: number;
      saturated_fat_100g: number;
      sodium_100g: number;
      calcium_100g: number;
      iron_100g: number;
      trans_fat_100g: number;
      cholesterol_100g: number;
      vitamin_a_100g: number;
      vitamin_c_100g: number;
      vitamin_d_100g: number;
    };
  };
  status: number;
  source?: "cache" | "api";
}

interface ProductDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  productData: ProductData | null;
  barcode: string;
}

// Lista de ejemplo de aditivos comunes y su nivel de riesgo
const ADDITIVES_RISK: Record<string, "none" | "low" | "moderate" | "high"> = {
  // Colorantes
  e100: "none", // Curcumina
  e104: "moderate", // Amarillo quinoleína
  e110: "moderate", // Amarillo ocaso FCF
  e120: "low", // Cochinilla
  e122: "moderate", // Azorrubina
  e123: "high", // Amaranto
  e124: "moderate", // Ponceau 4R
  e127: "moderate", // Eritrosina
  e129: "moderate", // Rojo allura AC
  e131: "moderate", // Azul patente V
  e132: "low", // Indigotina
  e133: "low", // Azul brillante FCF
  e150: "low", // Caramelo
  e151: "moderate", // Negro brillante BN
  e155: "moderate", // Marrón HT
  e160: "none", // Carotenoides
  e163: "none", // Antocianinas

  // Conservantes
  e200: "low", // Ácido sórbico
  e202: "low", // Sorbato potásico
  e210: "moderate", // Ácido benzoico
  e211: "moderate", // Benzoato de sodio
  e220: "moderate", // Dióxido de azufre
  e250: "high", // Nitrito de sodio
  e251: "high", // Nitrato de sodio

  // Antioxidantes
  e300: "none", // Ácido ascórbico
  e320: "moderate", // Butilhidroxianisol (BHA)
  e321: "high", // Butilhidroxitolueno (BHT)

  // Potenciadores del sabor
  e621: "moderate", // Glutamato monosódico

  // Edulcorantes
  e950: "low", // Acesulfamo K
  e951: "moderate", // Aspartamo
  e954: "moderate", // Sacarina
  e955: "low", // Sucralosa

  // Espesantes y estabilizantes
  e407: "moderate", // Carragenanos
  e412: "none", // Goma guar
  e415: "none", // Goma xantana
  e466: "low", // Carboximetilcelulosa

  // Otros
  e500: "none", // Carbonatos de sodio
  e501: "none", // Carbonatos de potasio
};

export function ProductDetailsModal({
  visible,
  onClose,
  productData,
  barcode,
}: ProductDetailsModalProps) {
  const [useEcoScoreFallback, setUseEcoScoreFallback] = useState(false);
  const [clearCacheModalVisible, setClearCacheModalVisible] = useState(false);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(true);
  const [productScore, setProductScore] = useState<ProductScore | null>(null);
  const [productAdditives, setProductAdditives] = useState<AdditiveRisk[]>([]);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["75%"], []);

  // Estado para seguir el estado de carga de las imágenes de score
  const [nutriScoreLoading, setNutriScoreLoading] = useState(true);
  const [ecoScoreLoading, setEcoScoreLoading] = useState(true);

  // Estado para manejar errores de carga
  const [nutriScoreError, setNutriScoreError] = useState(false);
  const [ecoScoreError, setEcoScoreError] = useState(false);

  // Calcular la puntuación del producto
  useEffect(() => {
    if (visible && productData) {
      // Calcular puntuación basada en Nutri-Score
      const calcNutritionalScore = () => {
        const nutriscore = productData.product.nutriscore_grade?.toLowerCase();
        if (!nutriscore) return 30; // Neutral si no hay datos

        // Mapear letras a puntuaciones aproximadas (0-60)
        switch (nutriscore) {
          case "a":
            return 60;
          case "b":
            return 45;
          case "c":
            return 30;
          case "d":
            return 15;
          case "e":
            return 0;
          default:
            return 30;
        }
      };

      // Calcular puntuación de aditivos
      const calcAdditivesScore = () => {
        if (!productData.product.additives_tags?.length) {
          return 30; // Puntuación máxima si no hay aditivos o no se detectan
        }

        let hasHighRisk = false;
        let score = 30; // Comenzar con puntuación máxima

        // Procesar aditivos y detectar niveles de riesgo
        const additives: AdditiveRisk[] =
          productData.product.additives_tags.map((additive) => {
            // Extraer el código E (e100, e202, etc.)
            const code = additive.toLowerCase().replace(/[^a-z0-9]/g, "");
            const name = additive;
            const risk = ADDITIVES_RISK[code] || "none";

            if (risk === "high") hasHighRisk = true;

            // Reducir puntuación según nivel de riesgo
            if (risk === "moderate") score -= 3;
            else if (risk === "high") score -= 10;
            else if (risk === "low") score -= 2;

            return { code, name, risk };
          });

        setProductAdditives(additives);

        // Limitar a 0 como mínimo
        return Math.max(0, hasHighRisk ? Math.min(score, 19) : score); // Max 49/100 si hay aditivo de alto riesgo
      };

      // Calcular si es orgánico
      const calcOrganicScore = () => {
        const labels = productData.product.labels_tags || [];

        // Buscar etiquetas orgánicas comunes
        const isOrganic = labels.some((label) => {
          const lowerLabel = label.toLowerCase();
          return (
            lowerLabel.includes("organic") ||
            lowerLabel.includes("bio") ||
            lowerLabel.includes("ecologic") ||
            lowerLabel.includes("orgánico") ||
            lowerLabel.includes("biológico") ||
            lowerLabel.includes("ecológico") ||
            lowerLabel.includes("organic")
          );
        });

        return isOrganic ? 10 : 0;
      };

      // Calcular puntuación total
      const nutritionalScore = calcNutritionalScore();
      const additivesScore = calcAdditivesScore();
      const organicScore = calcOrganicScore();

      const totalScore = nutritionalScore + additivesScore + organicScore;

      setProductScore({
        total: totalScore,
        nutritional: nutritionalScore,
        additives: additivesScore,
        organic: organicScore,
      });
    }
  }, [visible, productData]);

  // Resto de useEffects para manejo de modal
  useEffect(() => {
    if (visible) {
      setNutriScoreLoading(true);
      setEcoScoreLoading(true);
      setNutriScoreError(false);
      setEcoScoreError(false);
      setUseEcoScoreFallback(false);
      setBottomSheetVisible(true);
    }
  }, [visible]);

  useEffect(() => {
    if (ecoScoreError && !useEcoScoreFallback) {
      setUseEcoScoreFallback(true);
      setEcoScoreError(false);
      setEcoScoreLoading(true);
    }
  }, [ecoScoreError, useEcoScoreFallback]);

  useEffect(() => {
    if (visible && bottomSheetRef.current && bottomSheetVisible) {
      bottomSheetRef.current.snapToIndex(0);
    }
  }, [visible, bottomSheetVisible]);

  useEffect(() => {
    setBottomSheetVisible(!clearCacheModalVisible);
  }, [clearCacheModalVisible]);

  if (!productData || !visible) return null;

  // Obtener color según puntuación
  const getScoreColor = (score: number): string => {
    if (score >= 75) return "#4CAF50"; // Verde (excelente)
    if (score >= 50) return "#8BC34A"; // Verde claro (bueno)
    if (score >= 25) return "#FF9800"; // Naranja (medio)
    return "#F44336"; // Rojo (malo)
  };

  // Obtener calificación según puntuación
  const getScoreRating = (score: number): string => {
    if (score >= 75) return "Excelente";
    if (score >= 50) return "Bueno";
    if (score >= 25) return "Regular";
    return "Malo";
  };

  // Obtener color según riesgo de aditivo
  const getAdditiveRiskColor = (risk: string): string => {
    switch (risk) {
      case "high":
        return "#F44336"; // Rojo
      case "moderate":
        return "#FF9800"; // Naranja
      case "low":
        return "#FFEB3B"; // Amarillo
      default:
        return "#4CAF50"; // Verde
    }
  };

  // Obtener texto según riesgo de aditivo
  const getAdditiveRiskText = (risk: string): string => {
    switch (risk) {
      case "high":
        return "Riesgo alto";
      case "moderate":
        return "Riesgo moderado";
      case "low":
        return "Riesgo bajo";
      default:
        return "Sin riesgo";
    }
  };

  const getNutriScoreImage = (grade: string) => {
    const nutriscore = grade?.toLowerCase() || "unknown";
    return `https://static.openfoodfacts.org/images/misc/nutriscore-${nutriscore}.png`;
  };

  const getEcoScoreImage = (grade: string) => {
    const ecoscore = grade?.toLowerCase() || "unknown";
    return useEcoScoreFallback
      ? `https://static.openfoodfacts.org/images/misc/ecoscore-${ecoscore}.png`
      : `https://static.openfoodfacts.org/images/attributes/ecoscore-${ecoscore}.png`;
  };

  // Resto del código para nutrientes y funciones auxiliares
  const nutrients: NutrientInfo[] = [
    {
      label: "Valor energético",
      value: productData.product.nutriments.energy_100g || 0,
      unit: "kcal",
    },
    {
      label: "Grasas",
      value: productData.product.nutriments.fat_100g || 0,
      unit: "g",
    },
    {
      label: "- Saturadas",
      value: productData.product.nutriments.saturated_fat_100g || 0,
      unit: "g",
    },
    {
      label: "- Trans",
      value: productData.product.nutriments.trans_fat_100g || 0,
      unit: "g",
    },
    {
      label: "Colesterol",
      value: productData.product.nutriments.cholesterol_100g || 0,
      unit: "mg",
    },
    {
      label: "Hidratos de carbono",
      value: productData.product.nutriments.carbohydrates_100g || 0,
      unit: "g",
    },
    {
      label: "- Azúcares",
      value: productData.product.nutriments.sugars_100g || 0,
      unit: "g",
    },
    {
      label: "Fibra alimentaria",
      value: productData.product.nutriments.fiber_100g || 0,
      unit: "g",
    },
    {
      label: "Proteínas",
      value: productData.product.nutriments.proteins_100g || 0,
      unit: "g",
    },
    {
      label: "Sal",
      value: productData.product.nutriments.salt_100g || 0,
      unit: "g",
    },
    {
      label: "Sodio",
      value: productData.product.nutriments.sodium_100g || 0,
      unit: "g",
    },
    {
      label: "Calcio",
      value: productData.product.nutriments.calcium_100g || 0,
      unit: "mg",
    },
    {
      label: "Hierro",
      value: productData.product.nutriments.iron_100g || 0,
      unit: "mg",
    },
    {
      label: "Vitamina A",
      value: productData.product.nutriments.vitamin_a_100g || 0,
      unit: "µg",
    },
    {
      label: "Vitamina C",
      value: productData.product.nutriments.vitamin_c_100g || 0,
      unit: "mg",
    },
    {
      label: "Vitamina D",
      value: productData.product.nutriments.vitamin_d_100g || 0,
      unit: "µg",
    },
  ];

  // Obtener URL de la imagen de OpenFoodFacts basada en el código de barras
  const getProductImage = () => {
    if (productData.product.image_url) {
      return productData.product.image_url;
    }

    if (barcode) {
      return `https://images.openfoodfacts.org/images/products/${barcode}/front_es.400.jpg`;
    }

    return null;
  };

  const productImage = getProductImage();

  const handleClearCache = async () => {
    try {
      await clearProductCache();
      Alert.alert(
        "Caché borrada",
        "La caché de productos se ha borrado correctamente",
        [{ text: "OK" }]
      );
      setClearCacheModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "No se pudo borrar la caché de productos", [
        { text: "OK" },
      ]);
      setClearCacheModalVisible(false);
    }
  };

  const showClearCacheModal = () => {
    setClearCacheModalVisible(true);
  };

  return (
    <>
      {/* Modal para confirmar borrar caché - Fuera del BottomSheet y con estilo mejorado */}
      <Modal
        visible={clearCacheModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setClearCacheModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Borrar caché</Text>
              <Ionicons name="trash-outline" size={24} color="#FF5252" />
            </View>
            <Text style={styles.modalText}>
              ¿Estás seguro de que quieres borrar toda la caché de productos?
              Esta acción no se puede deshacer.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setClearCacheModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleClearCache}
              >
                <Text style={styles.confirmButtonText}>Borrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {bottomSheetVisible && (
        <BottomSheet
          ref={bottomSheetRef}
          index={visible ? 0 : -1}
          snapPoints={snapPoints}
          enablePanDownToClose
          onClose={onClose}
          backgroundStyle={{ backgroundColor: "white" }}
          handleIndicatorStyle={{ backgroundColor: "#999" }}
        >
          <BottomSheetScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.header}>
              <Text style={styles.productName}>
                {productData.product.product_name}
              </Text>
              {productData.product.brands && (
                <Text style={styles.brandName}>
                  {productData.product.brands}
                </Text>
              )}
            </View>

            {productImage ? (
              <Image
                source={{ uri: productImage }}
                style={styles.productImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={60} color="#ccc" />
              </View>
            )}

            <View style={styles.barcodeContainer}>
              <Ionicons name="barcode-outline" size={16} color="#666" />
              <Text style={styles.barcode}>{barcode}</Text>
            </View>

            {/* Puntuación general del producto */}
            {productScore && (
              <View style={styles.productScoreContainer}>
                <Text style={styles.sectionTitle}>Evaluación del producto</Text>

                <View style={styles.scoreCircleContainer}>
                  <View
                    style={[
                      styles.scoreCircle,
                      { backgroundColor: getScoreColor(productScore.total) },
                    ]}
                  >
                    <Text style={styles.scoreValue}>{productScore.total}</Text>
                  </View>
                  <Text style={styles.scoreRating}>
                    {getScoreRating(productScore.total)}
                  </Text>
                </View>

                <View style={styles.scoreDetailContainer}>
                  <View style={styles.scoreDetailItem}>
                    <Text style={styles.scoreDetailLabel}>
                      Valor nutricional
                    </Text>
                    <Text style={styles.scoreDetailValue}>
                      {productScore.nutritional}/60
                    </Text>
                  </View>
                  <View style={styles.scoreDetailItem}>
                    <Text style={styles.scoreDetailLabel}>Aditivos</Text>
                    <Text style={styles.scoreDetailValue}>
                      {productScore.additives}/30
                    </Text>
                  </View>
                  <View style={styles.scoreDetailItem}>
                    <Text style={styles.scoreDetailLabel}>Orgánico</Text>
                    <Text style={styles.scoreDetailValue}>
                      {productScore.organic}/10
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* NutriScore y EcoScore */}
            <View style={styles.scoresContainer}>
              {productData.product.nutriscore_grade && (
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreLabel}>Nutri-Score</Text>
                  <View style={styles.scoreImageContainer}>
                    {nutriScoreLoading && (
                      <ActivityIndicator size="small" color="#999" />
                    )}
                    <Image
                      source={{
                        uri: getNutriScoreImage(
                          productData.product.nutriscore_grade
                        ),
                      }}
                      style={styles.scoreImage}
                      resizeMode="contain"
                      onLoadStart={() => setNutriScoreLoading(true)}
                      onLoadEnd={() => setNutriScoreLoading(false)}
                      onError={() => {
                        setNutriScoreLoading(false);
                        setNutriScoreError(true);
                      }}
                    />
                    {nutriScoreError && (
                      <Text style={styles.scoreError}>
                        Error al cargar Nutri-Score
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {productData.product.ecoscore_grade && (
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreLabel}>Eco-Score</Text>
                  <View style={styles.scoreImageContainer}>
                    {ecoScoreLoading && (
                      <ActivityIndicator size="small" color="#999" />
                    )}
                    <Image
                      source={{
                        uri: getEcoScoreImage(
                          productData.product.ecoscore_grade
                        ),
                      }}
                      style={styles.scoreImage}
                      resizeMode="contain"
                      onLoadStart={() => setEcoScoreLoading(true)}
                      onLoadEnd={() => setEcoScoreLoading(false)}
                      onError={() => {
                        setEcoScoreLoading(false);
                        setEcoScoreError(true);
                      }}
                    />
                    {ecoScoreError && !useEcoScoreFallback && (
                      <ActivityIndicator size="small" color="#999" />
                    )}
                    {ecoScoreError && useEcoScoreFallback && (
                      <Text style={styles.scoreError}>
                        Error al cargar Eco-Score
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Sección de aditivos */}
            {productAdditives.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Aditivos</Text>
                <Text style={styles.sectionSubtitle}>
                  {productAdditives.length} aditivos detectados
                </Text>

                <View style={styles.additivesContainer}>
                  {productAdditives.map((additive, index) => (
                    <View key={index} style={styles.additiveItem}>
                      <View
                        style={[
                          styles.additiveRiskIndicator,
                          {
                            backgroundColor: getAdditiveRiskColor(
                              additive.risk
                            ),
                          },
                        ]}
                      />
                      <View style={styles.additiveInfo}>
                        <Text style={styles.additiveCode}>
                          {additive.code.toUpperCase()}
                        </Text>
                        <Text style={styles.additiveRiskText}>
                          {getAdditiveRiskText(additive.risk)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Ingredientes */}
            {productData.product.ingredients_text &&
              productData.product.ingredients_text.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Ingredientes</Text>
                  <Text style={styles.ingredients}>
                    {productData.product.ingredients_text}
                  </Text>
                </View>
              )}

            {/* Información nutricional */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Información nutricional</Text>
              <Text style={styles.nutritionalInfo}>
                Valores medios por 100g:
              </Text>

              <View style={styles.nutrientGroup}>
                <Text style={styles.nutrientGroupTitle}>Macronutrientes</Text>
                {nutrients.slice(0, 9).map((nutrient, index) => (
                  <View
                    key={index}
                    style={[
                      styles.nutrientRow,
                      nutrient.label.startsWith("-") && styles.subNutrientRow,
                    ]}
                  >
                    <Text
                      style={[
                        styles.nutrientLabel,
                        nutrient.label.startsWith("-") &&
                          styles.subNutrientLabel,
                      ]}
                    >
                      {nutrient.label}
                    </Text>
                    <Text style={styles.nutrientValue}>
                      {nutrient.value.toFixed(1)} {nutrient.unit}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.nutrientGroup}>
                <Text style={styles.nutrientGroupTitle}>Minerales</Text>
                {nutrients.slice(9, 13).map((nutrient, index) => (
                  <View key={index} style={styles.nutrientRow}>
                    <Text style={styles.nutrientLabel}>{nutrient.label}</Text>
                    <Text style={styles.nutrientValue}>
                      {nutrient.value.toFixed(1)} {nutrient.unit}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.nutrientGroup}>
                <Text style={styles.nutrientGroupTitle}>Vitaminas</Text>
                {nutrients.slice(13).map((nutrient, index) => (
                  <View key={index} style={styles.nutrientRow}>
                    <Text style={styles.nutrientLabel}>{nutrient.label}</Text>
                    <Text style={styles.nutrientValue}>
                      {nutrient.value.toFixed(1)} {nutrient.unit}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Botón para ver más detalles */}
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() =>
                Linking.openURL(
                  `https://world.openfoodfacts.org/product/${barcode}`
                )
              }
            >
              <Text style={styles.linkButtonText}>Ver en Open Food Facts</Text>
              <Ionicons name="open-outline" size={20} color="#6D9EBE" />
            </TouchableOpacity>
          </BottomSheetScrollView>
        </BottomSheet>
      )}
    </>
  );
}

const windowHeight = Dimensions.get("window").height;

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 16,
  },
  header: {
    flexDirection: "column",
    alignItems: "flex-start",
    padding: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    position: "relative",
    marginBottom: 16,
  },
  handleIndicator: {
    backgroundColor: "#E0E0E0",
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  closeButton: {
    position: "absolute",
    left: 16,
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  contentContainer: {
    backgroundColor: "#fff",
  },
  productImage: {
    width: "100%",
    height: 300,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    marginBottom: 16,
  },
  imagePlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    marginBottom: 16,
  },
  barcodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  barcode: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  scoresContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
    paddingVertical: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
  },
  scoreItem: {
    alignItems: "center",
  },
  scoreImageContainer: {
    width: 120,
    height: 85, // Igual para ambos scores
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  scoreImage: {
    width: 120,
    height: 80, // Igual para ambos scores
    marginBottom: 10,
    resizeMode: "contain",
  },
  scoreLoader: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -10,
    marginTop: -10,
  },
  scoreError: {
    color: "#FF5252",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  scoreImageError: {
    opacity: 0.3,
  },
  section: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#444",
  },
  nutrientGroup: {
    marginBottom: 24,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  nutrientGroupTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  nutrientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  subNutrientRow: {
    paddingLeft: 20,
  },
  nutrientLabel: {
    fontSize: 16,
    color: "#444",
  },
  subNutrientLabel: {
    color: "#666",
  },
  nutrientValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  ingredients: {
    fontSize: 16,
    lineHeight: 24,
    color: "#444",
  },
  nutritionalInfo: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#f0f7fc",
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#d0e6f7",
  },
  linkButtonText: {
    fontSize: 16,
    color: "#6D9EBE",
    fontWeight: "500",
  },
  productName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  brandName: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
  modalText: {
    fontSize: 16,
    color: "#444",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  confirmButton: {
    backgroundColor: "#FF5252",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
  },
  confirmButtonText: {
    fontSize: 16,
    color: "#fff",
  },
  // Nuevos estilos para la puntuación del producto
  productScoreContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    alignItems: "center",
  },
  scoreCircleContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  scoreValue: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  scoreRating: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  scoreDetailContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  scoreDetailItem: {
    flex: 1,
    alignItems: "center",
  },
  scoreDetailLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  scoreDetailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  // Nuevos estilos para la sección de aditivos
  additivesContainer: {
    marginTop: 8,
  },
  additiveItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  additiveRiskIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  additiveInfo: {
    flex: 1,
  },
  additiveCode: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  additiveRiskText: {
    fontSize: 14,
    color: "#666",
  },
});
