import React, { useCallback, useMemo, useRef, useState } from 'react';
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
  const [nutriScoreLoading, setNutriScoreLoading] = useState(true);
  const [ecoScoreLoading, setEcoScoreLoading] = useState(true);
  const [nutriScoreError, setNutriScoreError] = useState(false);
  const [ecoScoreError, setEcoScoreError] = useState(false);
  const [useEcoScoreFallback, setUseEcoScoreFallback] = useState(false);

  const bottomSheetRef = useRef<BottomSheet>(null);

  const snapPoints = useMemo(() => ['50%', '90%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) onClose();
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    []
  );

  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  if (!productData) return null;

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

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
        >
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalles del producto</Text>
      </View>

      <BottomSheetScrollView contentContainerStyle={styles.contentContainer}>
        {productData.product.image_url && (
          <Image
            source={{ uri: productData.product.image_url }}
            style={styles.productImage}
            resizeMode="contain"
          />
        )}

        <View style={styles.infoContainer}>
          <Text style={styles.productName}>{productData.product.product_name}</Text>
          {productData.product.brands && (
            <Text style={styles.brand}>{productData.product.brands}</Text>
          )}

          <View style={styles.scoresContainer}>
            {productData.product.nutriscore_grade && (
              <View style={styles.scoreItem}>
                {nutriScoreLoading && (
                  <ActivityIndicator size="small" color="#6D9EBE" style={styles.scoreLoader} />
                )}
                <Image
                  source={{ uri: getNutriScoreImage(productData.product.nutriscore_grade) }}
                  style={[styles.scoreImage, nutriScoreError && styles.scoreImageError]}
                  resizeMode="contain"
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
            )}
            
            {productData.product.ecoscore_grade && (
              <View style={styles.scoreItem}>
                {ecoScoreLoading && (
                  <ActivityIndicator size="small" color="#6D9EBE" style={styles.scoreLoader} />
                )}
                <Image
                  source={{ uri: getEcoScoreImage(productData.product.ecoscore_grade) }}
                  style={[styles.scoreImage, ecoScoreError && styles.scoreImageError]}
                  resizeMode="contain"
                  onLoadStart={() => setEcoScoreLoading(true)}
                  onLoadEnd={() => setEcoScoreLoading(false)}
                  onError={() => {
                    if (!useEcoScoreFallback) {
                      setUseEcoScoreFallback(true);
                      setEcoScoreLoading(true);
                      setEcoScoreError(false);
                    } else {
                      setEcoScoreLoading(false);
                      setEcoScoreError(true);
                    }
                  }}
                />
                {ecoScoreError && (
                  <Text style={styles.scoreError}>Error al cargar Eco-Score</Text>
                )}
              </View>
            )}
          </View>

          {productData.product.ingredients_text && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredientes</Text>
              <Text style={styles.sectionText}>{productData.product.ingredients_text}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información nutricional</Text>
            <Text style={styles.sectionSubtitle}>Valores medios por 100g:</Text>
            
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

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => Linking.openURL(`https://world.openfoodfacts.org/product/${barcode}`)}
          >
            <Text style={styles.linkButtonText}>Ver en Open Food Facts</Text>
            <Ionicons name="open-outline" size={20} color="#6D9EBE" />
          </TouchableOpacity>
        </View>
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