import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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

export default function ProductDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const productData = params.productData ? JSON.parse(params.productData as string) : null;
  const barcode = params.barcode as string;

  const [nutriScoreLoading, setNutriScoreLoading] = useState(true);
  const [ecoScoreLoading, setEcoScoreLoading] = useState(true);
  const [nutriScoreError, setNutriScoreError] = useState(false);
  const [ecoScoreError, setEcoScoreError] = useState(false);

  if (!productData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No se encontró información del producto</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const nutrients: NutrientInfo[] = [
    {
      label: 'Valor energético',
      value: productData.nutriments.energy_100g || 0,
      unit: 'kcal',
    },
    {
      label: 'Grasas',
      value: productData.nutriments.fat_100g || 0,
      unit: 'g',
    },
    {
      label: '- Saturadas',
      value: productData.nutriments.saturated_fat_100g || 0,
      unit: 'g',
    },
    {
      label: '- Trans',
      value: productData.nutriments.trans_fat_100g || 0,
      unit: 'g',
    },
    {
      label: 'Colesterol',
      value: productData.nutriments.cholesterol_100g || 0,
      unit: 'mg',
    },
    {
      label: 'Hidratos de carbono',
      value: productData.nutriments.carbohydrates_100g || 0,
      unit: 'g',
    },
    {
      label: '- Azúcares',
      value: productData.nutriments.sugars_100g || 0,
      unit: 'g',
    },
    {
      label: 'Fibra alimentaria',
      value: productData.nutriments.fiber_100g || 0,
      unit: 'g',
    },
    {
      label: 'Proteínas',
      value: productData.nutriments.proteins_100g || 0,
      unit: 'g',
    },
    {
      label: 'Sal',
      value: productData.nutriments.salt_100g || 0,
      unit: 'g',
    },
    {
      label: 'Sodio',
      value: productData.nutriments.sodium_100g || 0,
      unit: 'g',
    },
    {
      label: 'Calcio',
      value: productData.nutriments.calcium_100g || 0,
      unit: 'mg',
    },
    {
      label: 'Hierro',
      value: productData.nutriments.iron_100g || 0,
      unit: 'mg',
    },
    {
      label: 'Vitamina A',
      value: productData.nutriments.vitamin_a_100g || 0,
      unit: 'µg',
    },
    {
      label: 'Vitamina C',
      value: productData.nutriments.vitamin_c_100g || 0,
      unit: 'mg',
    },
    {
      label: 'Vitamina D',
      value: productData.nutriments.vitamin_d_100g || 0,
      unit: 'µg',
    },
  ];

  const getNutriScoreImage = (grade: string) => {
    const nutriscore = grade?.toLowerCase() || 'unknown';
    return `https://static.openfoodfacts.org/images/misc/nutriscore-${nutriscore}.png`;
  };

  const getEcoScoreImage = (grade: string) => {
    const ecoscore = grade?.toLowerCase() || 'unknown';
    return `https://static.openfoodfacts.org/images/misc/ecoscore-${ecoscore}.png`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalles del producto</Text>
      </View>

      {productData.image_url && (
        <Image
          source={{ uri: productData.image_url }}
          style={styles.productImage}
          resizeMode="contain"
        />
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.productName}>{productData.product_name}</Text>
        {productData.brands && (
          <Text style={styles.brand}>{productData.brands}</Text>
        )}

        {/* Nutri-Score y Eco-Score */}
        <View style={styles.scoresContainer}>
          {productData.nutriscore_grade && (
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Nutri-Score</Text>
              {nutriScoreLoading && (
                <ActivityIndicator size="small" color="#6D9EBE" style={styles.scoreLoader} />
              )}
              <Image
                source={{ uri: getNutriScoreImage(productData.nutriscore_grade) }}
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
          {productData.ecoscore_grade && (
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Eco-Score</Text>
              {ecoScoreLoading && (
                <ActivityIndicator size="small" color="#6D9EBE" style={styles.scoreLoader} />
              )}
              <Image
                source={{ uri: getEcoScoreImage(productData.ecoscore_grade) }}
                style={[styles.scoreImage, ecoScoreError && styles.scoreImageError]}
                resizeMode="contain"
                onLoadStart={() => setEcoScoreLoading(true)}
                onLoadEnd={() => setEcoScoreLoading(false)}
                onError={() => {
                  setEcoScoreLoading(false);
                  setEcoScoreError(true);
                }}
              />
              {ecoScoreError && (
                <Text style={styles.scoreError}>Error al cargar Eco-Score</Text>
              )}
            </View>
          )}
        </View>

        {/* Ingredientes */}
        {productData.ingredients_text && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredientes</Text>
            <Text style={styles.sectionText}>{productData.ingredients_text}</Text>
          </View>
        )}

        {/* Información nutricional */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información nutricional</Text>
          <Text style={styles.sectionSubtitle}>Valores medios por 100g:</Text>
          
          {/* Macronutrientes */}
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

          {/* Minerales */}
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

          {/* Vitaminas */}
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

        {/* Enlace a Open Food Facts */}
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => Linking.openURL(`https://world.openfoodfacts.org/product/${barcode}`)}
        >
          <Text style={styles.linkButtonText}>Ver en Open Food Facts</Text>
          <Ionicons name="open-outline" size={20} color="#6D9EBE" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
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
  scoreLabel: {
    fontSize: 14,
    marginBottom: 8,
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
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  nutrientGroup: {
    marginBottom: 16,
  },
  nutrientGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  subNutrientRow: {
    paddingLeft: 16,
  },
  nutrientLabel: {
    fontSize: 16,
    color: '#333',
  },
  subNutrientLabel: {
    fontSize: 14,
    color: '#666',
  },
  nutrientValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  linkButtonText: {
    fontSize: 16,
    color: '#6D9EBE',
    marginRight: 8,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#6D9EBE',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});