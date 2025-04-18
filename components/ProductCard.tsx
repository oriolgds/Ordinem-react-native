import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '@/hooks/useProducts';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  const expiryDate = new Date(product.expiryDate);
  const today = new Date();
  
  // Calcular días hasta la expiración
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Determinar estado del producto
  const isExpired = diffDays < 0;
  const isExpiring = diffDays >= 0 && diffDays <= 7;
  
  // Función para obtener el color del estado
  const getStatusColor = () => {
    if (isExpired) return '#FF5252';
    if (isExpiring) return '#F9A826';
    return '#34C759';
  };
  
  // Función para obtener el texto del estado
  const getStatusText = () => {
    if (isExpired) return `Expirado hace ${Math.abs(diffDays)} días`;
    if (diffDays === 0) return 'Expira hoy';
    if (diffDays === 1) return 'Expira mañana';
    return `Expira en ${diffDays} días`;
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        isExpired && styles.expiredContainer,
        isExpiring && styles.expiringContainer
      ]} 
      onPress={() => onPress(product)}
    >
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(product.category) }]}>
          <Text style={styles.categoryText}>{product.category}</Text>
        </View>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{product.location || 'Sin ubicación'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="cube-outline" size={16} color="#666" />
          <Text style={styles.detailText}>Cantidad: {product.quantity}</Text>
        </View>
        
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
      </View>
    </TouchableOpacity>
  );
}

// Función para obtener color según la categoría
function getCategoryColor(category: string): string {
  switch (category.toLowerCase()) {
    case 'alimentos':
      return '#DFF7E8';
    case 'bebidas':
      return '#E3F2FD';
    case 'limpieza':
      return '#FFF9E6';
    default:
      return '#F2F2F2';
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  expiredContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF5252',
  },
  expiringContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#F9A826',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F1F3C',
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  details: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 