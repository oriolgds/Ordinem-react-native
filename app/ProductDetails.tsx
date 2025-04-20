import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface NutrientInfo {
  label: string;
  value: number;
  unit: string;
}

export default function ProductDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const productData = params.productData ? JSON.parse(params.productData as string) : null;
  const barcode = params.barcode as string;

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
      label: 'Energía',
      value: productData.nutriments.energy_100g || 0,
      unit: 'kcal',
    },
    {
      label: 'Proteínas',
      value: productData.nutriments.proteins_100g || 0,
      unit: 'g',
    },
    {
      label: 'Carbohidratos',
      value: productData.nutriments.carbohydrates_100g || 0,
      unit: 'g',
    },
    {
      label: 'Grasas',
      value: productData.nutriments.fat_100g || 0,
      unit: 'g',
    },
  ];

  const getNutriScoreImage = (grade: string) => {
    return `https://static.openfoodfacts.org/images/attributes/nutriscore-${grade?.toLowerCase()}.svg`;
  };

  const getEcoScoreImage = (grade: string) => {
    return `https://static.openfoodfacts.org/images/attributes/ecoscore-${grade?.toLowerCase()}.svg`;
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
        <Text style={styles.barcode}>Código de barras: {barcode}</Text>

        {/* Nutri-Score y Eco-Score */}
        <View style={styles.scoresContainer}>
          {productData.nutriscore_grade && (
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Nutri-Score</Text>
              <Image
                source={{ uri: getNutriScoreImage(productData.nutriscore_grade) }}
                style={styles.scoreImage}
                resizeMode="contain"
              />
            </View>
          )}
          {productData.ecoscore_grade && (
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Eco-Score</Text>
              <Image
                source={{ uri: getEcoScoreImage(productData.ecoscore_grade) }}
                style={styles.scoreImage}
                resizeMode="contain"
              />
            </View>
          )}
        </View>

        {/* Categorías */}
        {productData.categories && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categorías</Text>
            <Text style={styles.sectionText}>{productData.categories}</Text>
          </View>
        )}

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
          <Text style={styles.sectionSubtitle}>Por 100g:</Text>
          {nutrients.map((nutrient, index) => (
            <View key={index} style={styles.nutrientRow}>
              <Text style={styles.nutrientLabel}>{nutrient.label}</Text>
              <Text style={styles.nutrientValue}>
                {nutrient.value} {nutrient.unit}
              </Text>
            </View>
          ))}
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
  barcode: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
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
    width: 100,
    height: 60,
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
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  nutrientLabel: {
    fontSize: 16,
    color: '#333',
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