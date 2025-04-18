import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getProductFromCache } from '../services/firebase';

const ProductDetails = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { product, deviceId, daysUntilExpiry, expiryStatus } = route.params;
    const [productDetails, setProductDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    // Cargar información adicional del producto desde la caché
    useEffect(() => {
        const fetchProductDetails = async () => {
            try {
                setLoading(true);
                const cachedData = await getProductFromCache(product.barcode);
                if (cachedData && cachedData.data) {
                    setProductDetails(cachedData.data);
                }
            } catch (error) {
                console.error('Error al cargar detalles del producto:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProductDetails();
    }, [product.barcode]);

    // Renderizar nutrientes si existen
    const renderNutrients = () => {
        if (!productDetails?.nutriments) return null;

        const nutrients = [
            { name: 'Energía', value: productDetails.nutriments.energy_100g, unit: 'kcal' },
            { name: 'Grasas', value: productDetails.nutriments.fat_100g, unit: 'g' },
            { name: 'Grasas saturadas', value: productDetails.nutriments.saturated_fat_100g, unit: 'g' },
            { name: 'Hidratos de carbono', value: productDetails.nutriments.carbohydrates_100g, unit: 'g' },
            { name: 'Azúcares', value: productDetails.nutriments.sugars_100g, unit: 'g' },
            { name: 'Fibra', value: productDetails.nutriments.fiber_100g, unit: 'g' },
            { name: 'Proteínas', value: productDetails.nutriments.proteins_100g, unit: 'g' },
            { name: 'Sal', value: productDetails.nutriments.salt_100g, unit: 'g' },
        ];

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Información nutricional</Text>
                <Text style={styles.sectionSubtitle}>Valores por 100g/100ml</Text>

                <View style={styles.nutrientsContainer}>
                    {nutrients.map((nutrient, index) => (
                        nutrient.value !== undefined && (
                            <View key={index} style={styles.nutrientRow}>
                                <Text style={styles.nutrientName}>{nutrient.name}</Text>
                                <Text style={styles.nutrientValue}>
                                    {nutrient.value.toFixed(1)} {nutrient.unit}
                                </Text>
                            </View>
                        )
                    ))}
                </View>
            </View>
        );
    };

    // Función para formatear la fecha
    const formatDate = (dateStr) => {
        const [day, month, year] = dateStr.split('/');
        return `${day}/${month}/${year}`;
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.imageContainer}>
                <Image
                    source={{
                        uri: productDetails?.image_url ||
                            product.image_url ||
                            'https://via.placeholder.com/400?text=Sin+imagen'
                    }}
                    style={styles.productImage}
                    resizeMode="contain"
                />
            </View>

            <View style={styles.contentContainer}>
                {/* Información básica */}
                <Text style={styles.productName}>{product.product_name}</Text>
                <View style={styles.categoryContainer}>
                    <Text style={styles.categoryText}>{product.category}</Text>
                </View>

                {/* Información de caducidad */}
                <View style={[styles.expiryBadge, { backgroundColor: expiryStatus.color }]}>
                    <Text style={styles.expiryText}>{expiryStatus.text}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información de caducidad</Text>
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={20} color="#666" />
                        <Text style={styles.infoText}>
                            Fecha de caducidad: <Text style={styles.infoHighlight}>{formatDate(product.expiry_date)}</Text>
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={20} color="#666" />
                        <Text style={styles.infoText}>
                            Días restantes: <Text style={styles.infoHighlight}>{daysUntilExpiry}</Text>
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="eye-outline" size={20} color="#666" />
                        <Text style={styles.infoText}>
                            Última detección: <Text style={styles.infoHighlight}>
                                {new Date(product.last_detected).toLocaleDateString()}
                            </Text>
                        </Text>
                    </View>
                </View>

                {/* Información del producto */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información del producto</Text>
                    <View style={styles.infoRow}>
                        <Ionicons name="barcode-outline" size={20} color="#666" />
                        <Text style={styles.infoText}>
                            Código de barras: <Text style={styles.infoHighlight}>{product.barcode}</Text>
                        </Text>
                    </View>
                    {productDetails?.brands && (
                        <View style={styles.infoRow}>
                            <Ionicons name="pricetag-outline" size={20} color="#666" />
                            <Text style={styles.infoText}>
                                Marca: <Text style={styles.infoHighlight}>{productDetails.brands}</Text>
                            </Text>
                        </View>
                    )}
                    {productDetails?.quantity && (
                        <View style={styles.infoRow}>
                            <Ionicons name="cube-outline" size={20} color="#666" />
                            <Text style={styles.infoText}>
                                Cantidad: <Text style={styles.infoHighlight}>{productDetails.quantity}</Text>
                            </Text>
                        </View>
                    )}
                </View>

                {/* Información nutricional */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#6D9EBE" />
                        <Text style={styles.loadingText}>Cargando información nutricional...</Text>
                    </View>
                ) : (
                    renderNutrients()
                )}

                {/* Ingredientes */}
                {productDetails?.ingredients_text && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Ingredientes</Text>
                        <Text style={styles.ingredientsText}>{productDetails.ingredients_text}</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    imageContainer: {
        backgroundColor: '#F8F9FA',
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productImage: {
        width: '100%',
        height: 200,
    },
    contentContainer: {
        padding: 16,
    },
    productName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    categoryContainer: {
        marginBottom: 16,
    },
    categoryText: {
        fontSize: 16,
        color: '#6D9EBE',
        fontWeight: '500',
    },
    expiryBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 24,
    },
    expiryText: {
        color: 'white',
        fontWeight: '600',
    },
    section: {
        marginBottom: 24,
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#555',
        marginLeft: 8,
    },
    infoHighlight: {
        fontWeight: '600',
        color: '#333',
    },
    nutrientsContainer: {
        marginTop: 8,
    },
    nutrientRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    nutrientName: {
        fontSize: 14,
        color: '#555',
    },
    nutrientValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    ingredientsText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    loadingContainer: {
        backgroundColor: '#F8F9FA',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 24,
    },
    loadingText: {
        color: '#666',
        marginTop: 8,
    },
});

export default ProductDetails; 