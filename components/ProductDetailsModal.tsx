import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';

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
}

interface ProductDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  productData: ProductData | null;
  barcode: string;
}

export function ProductDetailsModal({ visible, onClose, productData, barcode }: ProductDetailsModalProps) {
  const [useEcoScoreFallback, setUseEcoScoreFallback] = useState(false);
  
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['75%'], []);
  
  // Estado para seguir el estado de carga de las imágenes de score
  const [nutriScoreLoading, setNutriScoreLoading] = useState(true);
  const [ecoScoreLoading, setEcoScoreLoading] = useState(true);
  
  // Estado para manejar errores de carga
  const [nutriScoreError, setNutriScoreError] = useState(false);
  const [ecoScoreError, setEcoScoreError] = useState(false);
  
  // Intentar la URL alternativa para ecoscore si la primera falla
  useEffect(() => {
    if (ecoScoreError && !useEcoScoreFallback) {
      setUseEcoScoreFallback(true);
      setEcoScoreError(false);
      setEcoScoreLoading(true);
    }
  }, [ecoScoreError, useEcoScoreFallback]);

  React.useEffect(() => {
    if (visible && bottomSheetRef.current) {
      bottomSheetRef.current.snapToIndex(0);
    }
  }, [visible]);

  if (!productData || !visible) return null;

  const getNutriScoreImage = (grade: string) => {
    const nutriscore = grade?.toLowerCase() || 'unknown';
    return `https://static.openfoodfacts.org/images/misc/nutriscore-${nutriscore}.png`;
  };

  const getEcoScoreImage = (grade: string) => {
    const ecoscore = grade?.toLowerCase() || 'unknown';
    return useEcoScoreFallback 
      ? `https://static.openfoodfacts.org/images/misc/ecoscore-${ecoscore}.png`
      : `https://static.openfoodfacts.org/images/attributes/ecoscore-${ecoscore}.png`;
  };

  const nutrients: NutrientInfo[] = [
    {
      label: 'Valor energético',
      value: productData.product.nutriments.energy_100g || 0,
      unit: 'kcal',
    },
    {
      label: 'Grasas',
      value: productData.product.nutriments.fat_100g || 0,
      unit: 'g',
    },
    {
      label: '- Saturadas',
      value: productData.product.nutriments.saturated_fat_100g || 0,
      unit: 'g',
    },
    {
      label: '- Trans',
      value: productData.product.nutriments.trans_fat_100g || 0,
      unit: 'g',
    },
    {
      label: 'Colesterol',
      value: productData.product.nutriments.cholesterol_100g || 0,
      unit: 'mg',
    },
    {
      label: 'Hidratos de carbono',
      value: productData.product.nutriments.carbohydrates_100g || 0,
      unit: 'g',
    },
    {
      label: '- Azúcares',
      value: productData.product.nutriments.sugars_100g || 0,
      unit: 'g',
    },
    {
      label: 'Fibra alimentaria',
      value: productData.product.nutriments.fiber_100g || 0,
      unit: 'g',
    },
    {
      label: 'Proteínas',
      value: productData.product.nutriments.proteins_100g || 0,
      unit: 'g',
    },
    {
      label: 'Sal',
      value: productData.product.nutriments.salt_100g || 0,
      unit: 'g',
    },
    {
      label: 'Sodio',
      value: productData.product.nutriments.sodium_100g || 0,
      unit: 'g',
    },
    {
      label: 'Calcio',
      value: productData.product.nutriments.calcium_100g || 0,
      unit: 'mg',
    },
    {
      label: 'Hierro',
      value: productData.product.nutriments.iron_100g || 0,
      unit: 'mg',
    },
    {
      label: 'Vitamina A',
      value: productData.product.nutriments.vitamin_a_100g || 0,
      unit: 'µg',
    },
    {
      label: 'Vitamina C',
      value: productData.product.nutriments.vitamin_c_100g || 0,
      unit: 'mg',
    },
    {
      label: 'Vitamina D',
      value: productData.product.nutriments.vitamin_d_100g || 0,
      unit: 'µg',
    },
  ];

  // Obtener URL de la imagen de OpenFoodFacts basada en el código de barras
  const getProductImage = () => {
    if (productData.product.image_url) {
      return productData.product.image_url;
    }
    
    if (barcode) {
      // Formato correcto según la documentación de OpenFoodFacts API v2
      return `https://images.openfoodfacts.org/images/products/${barcode}/front_es.400.jpg`;
    }
    
    return null;
  };
  
  const productImage = getProductImage();

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={visible ? 0 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{ backgroundColor: 'white' }}
      handleIndicatorStyle={{ backgroundColor: '#999' }}
    >
      <BottomSheetScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.productName}>{productData.product.product_name}</Text>
          {productData.product.brands && (
            <Text style={styles.brandName}>{productData.product.brands}</Text>
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

        {/* NutriScore y EcoScore */}
        <View style={styles.scoresContainer}>
          {productData.product.nutriscore_grade && (
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Nutri-Score</Text>
              <View style={styles.scoreImageContainer}>
                {nutriScoreLoading && <ActivityIndicator size="small" color="#999" />}
                <Image 
                  source={{ uri: getNutriScoreImage(productData.product.nutriscore_grade) }}
                  style={[
                    styles.scoreImage, 
                    { display: nutriScoreLoading ? 'none' : 'flex' }
                  ]}
                  onLoadStart={() => setNutriScoreLoading(true)}
                  onLoadEnd={() => setNutriScoreLoading(false)}
                  onError={() => {
                    setNutriScoreLoading(false);
                    setNutriScoreError(true);
                  }}
                />
                {nutriScoreError && (
                  <Text style={styles.scoreError}>Error al cargar Nutri-Score</Text>
                )}
              </View>
            </View>
          )}

          {productData.product.ecoscore_grade && (
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Eco-Score</Text>
              <View style={styles.scoreImageContainer}>
                {ecoScoreLoading && <ActivityIndicator size="small" color="#999" />}
                <Image 
                  source={{ uri: getEcoScoreImage(productData.product.ecoscore_grade) }}
                  style={[
                    styles.scoreImage, 
                    { display: ecoScoreLoading ? 'none' : 'flex' }
                  ]}
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
                  <Text style={styles.scoreError}>Error al cargar Eco-Score</Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Ingredientes */}
        {productData.product.ingredients_text && productData.product.ingredients_text.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredientes</Text>
            <Text style={styles.ingredients}>{productData.product.ingredients_text}</Text>
          </View>
        )}

        {/* Información nutricional */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información nutricional</Text>
          <Text style={styles.nutritionalInfo}>Valores medios por 100g:</Text>

          <View style={styles.nutrientGroup}>
            <Text style={styles.nutrientGroupTitle}>Macronutrientes</Text>
            {nutrients.slice(0, 9).map((nutrient, index) => (
              <View key={index} style={[
                styles.nutrientRow,
                nutrient.label.startsWith('-') && styles.subNutrientRow
              ]}>
                <Text style={[
                  styles.nutrientLabel,
                  nutrient.label.startsWith('-') && styles.subNutrientLabel
                ]}>{nutrient.label}</Text>
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
          onPress={() => Linking.openURL(`https://world.openfoodfacts.org/product/${barcode}`)}
        >
          <Text style={styles.linkButtonText}>Ver en Open Food Facts</Text>
          <Ionicons name="open-outline" size={20} color="#6D9EBE" />
        </TouchableOpacity>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const windowHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    position: 'relative',
    justifyContent: 'center',
  },
  handleIndicator: {
    backgroundColor: '#E0E0E0',
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  closeButton: {
    position: 'absolute',
    left: 16,
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  contentContainer: {
    backgroundColor: '#fff',
  },
  productImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f5f5f5',
  },
  infoContainer: {
    padding: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  brand: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreImage: {
    width: 120,
    height: 70,
    marginBottom: 10,
  },
  scoreLoader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -10,
    marginTop: -10,
  },
  scoreError: {
    color: '#FF5252',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  scoreImageError: {
    opacity: 0.3,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
  nutrientGroup: {
    marginBottom: 24,
  },
  nutrientGroupTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  subNutrientRow: {
    paddingLeft: 20,
  },
  nutrientLabel: {
    fontSize: 16,
    color: '#444',
  },
  subNutrientLabel: {
    color: '#666',
  },
  nutrientValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    gap: 8,
  },
  linkButtonText: {
    fontSize: 16,
    color: '#6D9EBE',
    fontWeight: '500',
  },
});