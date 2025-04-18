import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * Componente de tarjeta de producto
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.product - Datos del producto
 * @param {string} props.deviceId - ID del dispositivo
 */
const ProductCard = ({ product, deviceId }) => {
    const navigation = useNavigation();

    // Calcular días hasta la caducidad
    const calculateDaysUntilExpiry = (expiryDateStr) => {
        const [day, month, year] = expiryDateStr.split('/').map(Number);
        const expiryDate = new Date(year, month - 1, day);
        const today = new Date();

        // Resetear las horas para comparar solo fechas
        today.setHours(0, 0, 0, 0);
        expiryDate.setHours(0, 0, 0, 0);

        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    };

    const daysUntilExpiry = calculateDaysUntilExpiry(product.expiry_date);

    // Determinar el estado del producto según su fecha de caducidad
    const getExpiryStatus = () => {
        if (daysUntilExpiry < 0) {
            return { status: 'expired', color: '#FF5252', text: 'Caducado' };
        } else if (daysUntilExpiry <= 3) {
            return { status: 'expiring_soon', color: '#FFC107', text: 'Caduca pronto' };
        } else if (daysUntilExpiry <= 7) {
            return { status: 'expiring_week', color: '#4CAF50', text: 'Caduca en menos de una semana' };
        } else {
            return { status: 'valid', color: '#6D9EBE', text: 'Válido' };
        }
    };

    const expiryStatus = getExpiryStatus();

    // Manejar la navegación a la pantalla de detalles
    const handlePress = () => {
        navigation.navigate('ProductDetails', {
            product,
            deviceId,
            daysUntilExpiry,
            expiryStatus
        });
    };

    return (
        <TouchableOpacity style={styles.container} onPress={handlePress}>
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: product.image_url || 'https://via.placeholder.com/100' }}
                    style={styles.image}
                    resizeMode="contain"
                />
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.name} numberOfLines={1}>{product.product_name}</Text>
                <Text style={styles.category}>{product.category}</Text>
                <View style={styles.expiryContainer}>
                    <Text style={styles.expiryDate}>Caducidad: {product.expiry_date}</Text>
                    <View style={[styles.expiryBadge, { backgroundColor: expiryStatus.color }]}>
                        <Text style={styles.expiryText}>{expiryStatus.text}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    imageContainer: {
        width: 100,
        height: 100,
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    image: {
        width: 80,
        height: 80,
    },
    infoContainer: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    category: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    expiryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    expiryDate: {
        fontSize: 12,
        color: '#555',
    },
    expiryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    expiryText: {
        fontSize: 12,
        color: 'white',
        fontWeight: '500',
    },
});

export default ProductCard; 