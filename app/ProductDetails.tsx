import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getProduct, deleteProduct } from '@/services/firebase';
import { Product } from '@/hooks/useProducts';

export default function ProductDetailsScreen() {
  const { productId } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Cargar detalles del producto
    const fetchProductDetails = async () => {
      try {
        if (!productId) {
          throw new Error('ID de producto no proporcionado');
        }
        
        const productData = await getProduct(productId as string);
        setProduct(productData);
      } catch (error) {
        console.error('Error al cargar detalles del producto:', error);
        Alert.alert(
          'Error',
          'No se pudo cargar la información del producto',
          [{ text: 'Volver', onPress: () => router.back() }]
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  // Manejar edición del producto
  const handleEdit = () => {
    router.push({
      pathname: '/EditProduct',
      params: { productId: productId as string }
    });
  };

  // Manejar eliminación del producto
  const handleDelete = () => {
    Alert.alert(
      'Eliminar producto',
      '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteProduct(productId as string);
              Alert.alert('Éxito', 'Producto eliminado correctamente');
              router.back();
            } catch (error) {
              console.error('Error al eliminar producto:', error);
              Alert.alert('Error', 'No se pudo eliminar el producto');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6D9EBE" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF5252" />
        <Text style={styles.errorText}>Producto no encontrado</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calcular días hasta expiración
  const expiryDate = new Date(product.expiryDate);
  const today = new Date();
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Determinar estado del producto
  const isExpired = diffDays < 0;
  const isExpiring = diffDays >= 0 && diffDays <= 7;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Encabezado con info principal */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.productName}>{product.name}</Text>
            <View style={[
              styles.categoryBadge, 
              { backgroundColor: getCategoryColor(product.category) }
            ]}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
          </View>
        </View>

        {/* Sección de información */}
        <View style={styles.infoSection}>
          <InfoItem 
            icon="calendar-outline" 
            label="Fecha de expiración" 
            value={expiryDate.toLocaleDateString('es-ES')}
            highlight={isExpired || isExpiring}
            highlightColor={isExpired ? '#FF5252' : '#F9A826'}
          />
          
          <InfoItem 
            icon="location-outline" 
            label="Ubicación" 
            value={product.location || 'Sin ubicación'}
          />
          
          <InfoItem 
            icon="cube-outline" 
            label="Cantidad" 
            value={`${product.quantity} unidades`}
          />
          
          {product.barcode && (
            <InfoItem 
              icon="barcode-outline" 
              label="Código de barras" 
              value={product.barcode}
            />
          )}
          
          {product.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notas:</Text>
              <Text style={styles.notesText}>{product.notes}</Text>
            </View>
          )}
        </View>

        {/* Estado de expiración */}
        <View style={[
          styles.expiryStatusContainer,
          { 
            backgroundColor: isExpired ? '#FFEBEE' : isExpiring ? '#FFF8E1' : '#E8F5E9',
          }
        ]}>
          <Ionicons 
            name={isExpired ? "alert-circle" : "time-outline"} 
            size={24} 
            color={isExpired ? '#FF5252' : isExpiring ? '#F9A826' : '#34C759'} 
          />
          <Text style={[
            styles.expiryStatus,
            { 
              color: isExpired ? '#FF5252' : isExpiring ? '#F9A826' : '#34C759',
            }
          ]}>
            {isExpired 
              ? `Expirado hace ${Math.abs(diffDays)} días` 
              : diffDays === 0 
                ? 'Expira hoy' 
                : diffDays === 1 
                  ? 'Expira mañana' 
                  : `Expira en ${diffDays} días`
            }
          </Text>
        </View>
      </ScrollView>

      {/* Botones de acción */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]} 
          onPress={handleEdit}
        >
          <Ionicons name="create-outline" size={20} color="white" />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]} 
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={20} color="white" />
          <Text style={styles.actionButtonText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Componente para elementos de información
function InfoItem({ icon, label, value, highlight = false, highlightColor = '#FF5252' }) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={20} color="#6D9EBE" />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[
          styles.infoValue, 
          highlight && { color: highlightColor, fontWeight: '600' }
        ]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

// Obtener color según la categoría
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
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#6D9EBE',
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  header: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F1F3C',
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1F1F3C',
  },
  notesContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 16,
  },
  notesLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  expiryStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  expiryStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E1E1E8',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  editButton: {
    backgroundColor: '#6D9EBE',
  },
  deleteButton: {
    backgroundColor: '#FF5252',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
}); 