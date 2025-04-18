import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getProducts } from '@/services/firebase';

// Componente de tarjeta de producto
const ProductCard = ({ product, onPress }) => {
  const isExpiring = new Date(product.expiryDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const isExpired = new Date(product.expiryDate) < new Date();
  
  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        isExpired ? styles.cardExpired : isExpiring ? styles.cardExpiring : null
      ]} 
      onPress={() => onPress(product)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productCategory}>{product.category}</Text>
      </View>
      
      <View style={styles.cardBody}>
        <Text style={styles.productLocation}>Ubicación: {product.location}</Text>
        <Text style={[
          styles.expiryDate,
          isExpired ? styles.textExpired : isExpiring ? styles.textExpiring : null
        ]}>
          Expira: {new Date(product.expiryDate).toLocaleDateString('es-ES')}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Componente de barra de búsqueda
const SearchBar = ({ value, onChangeText }) => {
  return (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar productos..."
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
};

export default function ProductsScreen() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const router = useRouter();

  // Cargar productos desde Firebase
  const loadProducts = async () => {
    try {
      const productsData = await getProducts();
      setProducts(productsData);
      filterProducts(productsData, searchQuery, categoryFilter);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setLoading(false);
    }
  };

  // Filtrar productos
  const filterProducts = (productsData, query, category) => {
    let filtered = productsData;
    
    if (query) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    if (category) {
      filtered = filtered.filter(product => 
        product.category === category
      );
    }
    
    setFilteredProducts(filtered);
  };

  // Efecto para cargar productos al inicio
  useEffect(() => {
    loadProducts();
  }, []);

  // Efecto para filtrar productos cuando cambian los filtros
  useEffect(() => {
    filterProducts(products, searchQuery, categoryFilter);
  }, [searchQuery, categoryFilter]);

  // Manejar refresco de lista
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  // Navegar a detalle del producto
  const handleProductPress = (product) => {
    router.push({
      pathname: '/ProductDetails',
      params: { productId: product.id }
    });
  };

  // Cambiar filtro de categoría
  const handleCategoryFilter = (category) => {
    setCategoryFilter(prevCategory => prevCategory === category ? '' : category);
  };

  // Categorías disponibles
  const categories = ['Alimentos', 'Bebidas', 'Limpieza', 'Otros'];

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6D9EBE" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.categoryFilters}>
        {categories.map(category => (
          <TouchableOpacity 
            key={category}
            style={[
              styles.categoryButton,
              categoryFilter === category && styles.categoryButtonActive
            ]}
            onPress={() => handleCategoryFilter(category)}
          >
            <Text style={[
              styles.categoryButtonText,
              categoryFilter === category && styles.categoryButtonTextActive
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={({ item }) => (
          <ProductCard 
            product={item} 
            onPress={handleProductPress}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#6D9EBE']}
          />
        }
      />

      <TouchableOpacity style={styles.fabButton} onPress={() => router.push('/ProductScanner')}>
        <Ionicons name="qr-code-outline" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E8',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    padding: 0,
    fontSize: 16,
  },
  categoryFilters: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E8',
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  categoryButtonActive: {
    backgroundColor: '#6D9EBE',
  },
  categoryButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  list: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
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
  cardExpiring: {
    borderLeftWidth: 4,
    borderLeftColor: '#F9A826',
  },
  cardExpired: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF5252',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardBody: {
    marginTop: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F1F3C',
  },
  productCategory: {
    fontSize: 14,
    color: '#6D9EBE',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  productLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  expiryDate: {
    fontSize: 14,
    color: '#666',
  },
  textExpiring: {
    color: '#F9A826',
    fontWeight: 'bold',
  },
  textExpired: {
    color: '#FF5252',
    fontWeight: 'bold',
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6D9EBE',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
}); 