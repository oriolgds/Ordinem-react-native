import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Product {
  id: string;
  name: string;
  image: string;
  expiryDate: string;
  category: string;
  quantity: number;
}

interface ProductCardProps {
  product: Product;
  viewMode: 'grid' | 'list';
}

export function ProductCard({ product, viewMode }: ProductCardProps) {
  const daysUntilExpiry = Math.ceil(
    (new Date(product.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
  );

  const getExpiryColor = () => {
    if (daysUntilExpiry <= 3) return '#FF3B30';
    if (daysUntilExpiry <= 7) return '#FF9500';
    return '#34C759';
  };

  return (
    <Link href={`/product/${product.id}`} asChild>
      <TouchableOpacity
        style={[
          styles.container,
          viewMode === 'grid' ? styles.gridCard : styles.listCard
        ]}
      >
        <Image
          source={{ uri: product.image }}
          style={viewMode === 'grid' ? styles.gridImage : styles.listImage}
        />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {product.name}
          </Text>
          <View style={styles.details}>
            <View style={styles.categoryContainer}>
              <Ionicons name="pricetag-outline" size={14} color="#6D9EBE" />
              <Text style={styles.category}>{product.category}</Text>
            </View>
            <View style={styles.expiryContainer}>
              <Ionicons name="time-outline" size={14} color={getExpiryColor()} />
              <Text style={[styles.expiry, { color: getExpiryColor() }]}>
                {daysUntilExpiry} días
              </Text>
            </View>
            <View style={styles.quantityContainer}>
              <Ionicons name="cube-outline" size={14} color="#6D9EBE" />
              <Text style={styles.quantity}>{product.quantity}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gridCard: {
    flex: 1,
    margin: 8,
    maxWidth: '45%',
  },
  listCard: {
    flexDirection: 'row',
    marginVertical: 8,
    marginHorizontal: 16,
  },
  gridImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  listImage: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
  info: {
    padding: 12,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F1F3C',
    marginBottom: 8,
  },
  details: {
    gap: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  category: {
    fontSize: 12,
    color: '#6D9EBE',
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiry: {
    fontSize: 12,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quantity: {
    fontSize: 12,
    color: '#6D9EBE',
  },
}); 