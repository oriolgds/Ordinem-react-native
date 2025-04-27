import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '@/hooks/useProducts';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  // Comprobar el formato de la fecha antes de convertirla
  const formatExpiryDate = () => {
    if (!product.expiryDate) return 'Sin fecha';
    
    // Comprobar si la fecha es DD/MM/YYYY
    if (product.expiryDate.includes('/')) {
      const [day, month, year] = product.expiryDate.split('/');
      if (day && month && year) {
        return new Date(`${year}-${month}-${day}`);
      }
    }
    
    // Intentar parsearlo como fecha ISO
    const date = new Date(product.expiryDate);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    return null;
  };
  
  const expiryDate = formatExpiryDate();
  const today = new Date();
  
  // Calcular días hasta la expiración solo si tenemos una fecha válida
  let diffDays = 0;
  let isExpired = false;
  let isExpiring = false;
  
  if (expiryDate && expiryDate instanceof Date) {
    const diffTime = expiryDate.getTime() - today.getTime();
    diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    isExpired = diffDays < 0;
    isExpiring = diffDays >= 0 && diffDays <= 7;
  }
  
  // Función para obtener el color del estado
  const getStatusColor = () => {
    if (isExpired) return '#FF5252';
    if (isExpiring) return '#F9A826';
    return '#34C759';
  };
  
  // Función para obtener el texto del estado
  const getStatusText = () => {
    if (!expiryDate || !(expiryDate instanceof Date)) return 'Sin fecha de caducidad';
    if (isExpired) return `Caducado hace ${Math.abs(diffDays)} días`;
    if (diffDays === 0) return 'Caduca hoy';
    if (diffDays === 1) return 'Caduca mañana';
    return `Caduca en ${diffDays} días`;
  };
  
  // Obtener URL de la imagen de OpenFoodFacts basada en el código de barras
  const getProductImage = () => {
    if (product.imageUrl) return product.imageUrl;
    
    if (product.barcode) {
      // Formato correcto según la documentación de OpenFoodFacts API v2
      return `https://images.openfoodfacts.org/images/products/${product.barcode}/front_es.400.jpg`;
    }
    
    return null;
  };
  
  const productImage = getProductImage();

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        isExpired && styles.expiredContainer,
        isExpiring && styles.expiringContainer
      ]} 
      onPress={() => onPress(product)}
    >
      <View style={styles.imageContainer}>
        {productImage ? (
          <Image 
            source={{ uri: productImage }}
            style={styles.productImage}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="image-outline" size={40} color="#ccc" />
            <Text style={styles.placeholderText}>Sin imagen</Text>
          </View>
        )}
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        
        <View style={styles.details}>
          <View style={styles.statusRow}>
            <Ionicons 
              name={isExpired ? "alert-circle" : "time-outline"} 
              size={16} 
              color={getStatusColor()} 
            />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="barcode-outline" size={14} color="#666" />
            <Text style={styles.detailText} numberOfLines={1}>{product.barcode}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  expiredContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF5252',
  },
  expiringContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#F9A826',
  },
  imageContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 4,
    color: '#999',
    fontSize: 12,
  },
  contentContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F1F3C',
    marginBottom: 8,
  },
  details: {
    justifyContent: 'space-between',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
});