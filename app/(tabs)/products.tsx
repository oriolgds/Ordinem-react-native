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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ProductDetailsModal } from '@/components/ProductDetailsModal';
import { useProducts, Product, Device } from '@/hooks/useProducts';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
}

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

// Componente de tarjeta de producto
const ProductCard = ({ product, onPress }: ProductCardProps) => {
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
const SearchBar = ({ value, onChangeText }: SearchBarProps) => {
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

// Componente para el selector de dispositivos
interface DevicePickerProps {
  devices: Device[];
  selectedDevice: string | null;
  onSelectDevice: (deviceId: string) => void;
}

const DevicePicker = ({ devices, selectedDevice, onSelectDevice }: DevicePickerProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  // Si no hay dispositivos, no mostramos nada
  if (devices.length === 0) {
    return null;
  }
  
  const currentDevice = devices.find(d => d.id === selectedDevice);

  return (
    <View style={styles.devicePickerContainer}>
      <TouchableOpacity 
        style={styles.devicePickerButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="cube-outline" size={20} color="#6D9EBE" />
        <Text style={styles.devicePickerText}>
          {currentDevice ? `Armario: ${currentDevice.id}` : "Seleccionar armario"}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#999" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar armario</Text>
            {devices.map(device => (
              <TouchableOpacity
                key={device.id}
                style={[
                  styles.deviceOption,
                  selectedDevice === device.id && styles.deviceOptionSelected
                ]}
                onPress={() => {
                  onSelectDevice(device.id);
                  setModalVisible(false);
                }}
              >
                <Ionicons 
                  name={selectedDevice === device.id ? "cube" : "cube-outline"} 
                  size={24} 
                  color={selectedDevice === device.id ? "#6D9EBE" : "#666"} 
                />
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>Armario {device.id}</Text>
                  <Text style={styles.deviceStats}>
                    {device.product_count} productos • Actualizado {new Date(device.last_update).toLocaleDateString('es-ES')}
                  </Text>
                </View>
                {selectedDevice === device.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#6D9EBE" />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={styles.addDeviceButton}
              onPress={() => {
                setModalVisible(false);
                router.push('/pair-device');
              }}
            >
              <Ionicons name="add-circle-outline" size={24} color="#6D9EBE" />
              <Text style={styles.addDeviceText}>Añadir nuevo armario</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default function ProductsScreen() {
  const {
    products,
    categories,
    devices,
    selectedDevice,
    setSelectedDevice,
    loading,
    refreshing,
    onRefresh,
    filterProducts,
    devicesFetched
  } = useProducts();

  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const router = useRouter();

  // Efecto para filtrar productos cuando cambian los filtros o los productos
  useEffect(() => {
    const filtered = filterProducts(searchQuery, categoryFilter, selectedDevice || null);
    setFilteredProducts(filtered);
  }, [searchQuery, categoryFilter, selectedDevice, products]);

  // Navegar a detalle del producto
  const handleProductPress = (product: Product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  // Cambiar filtro de categoría
  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(prevCategory => prevCategory === category ? '' : category);
  };

  // Pantalla de carga mientras se obtienen los dispositivos
  if (loading && !refreshing && !devicesFetched) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6D9EBE" />
      </View>
    );
  }

  // Pantalla de bienvenida cuando no hay armarios vinculados
  if (devices.length === 0 && devicesFetched) {
    return (
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeHeader}>
          <Text style={styles.welcomeTitle}>Bienvenido a Ordinem</Text>
          <Text style={styles.welcomeSubtitle}>Organiza tu despensa de manera inteligente</Text>
        </View>
        
        <View style={styles.welcomeContent}>
          <Ionicons name="cube" size={100} color="#6D9EBE" style={styles.welcomeIcon} />
          
          <Text style={styles.welcomeMessage}>
            Para comenzar, necesitas vincular un armario inteligente Ordinem
          </Text>
          
          <View style={styles.stepsContainer}>
            <View style={styles.step}>
              <View style={styles.stepNumberContainer}>
                <Text style={styles.stepNumber}>1</Text>
              </View>
              <Text style={styles.stepText}>Configura tu armario Ordinem</Text>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumberContainer}>
                <Text style={styles.stepNumber}>2</Text>
              </View>
              <Text style={styles.stepText}>Vincula el armario escaneando su código QR</Text>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumberContainer}>
                <Text style={styles.stepNumber}>3</Text>
              </View>
              <Text style={styles.stepText}>¡Empieza a organizar y monitorear tus productos!</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.welcomeButton}
            onPress={() => router.push('/pair-device')}
          >
            <Ionicons name="qr-code-outline" size={24} color="white" style={styles.welcomeButtonIcon} />
            <Text style={styles.welcomeButtonText}>Vincular un armario</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Pantalla normal de productos
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <DevicePicker 
          devices={devices}
          selectedDevice={selectedDevice}
          onSelectDevice={setSelectedDevice}
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
            onRefresh={onRefresh}
            colors={['#6D9EBE']}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={80} color="#E1E1E8" />
            <Text style={styles.emptyTitle}>
              No hay productos en este armario
            </Text>
            <Text style={styles.emptyDescription}>
              Los productos aparecerán aquí cuando sean detectados
            </Text>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fabButton} onPress={() => router.push('/ProductScanner')}>
        <Ionicons name="qr-code-outline" size={24} color="white" />
      </TouchableOpacity>

      <ProductDetailsModal 
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        productData={selectedProduct ? {
          product: {
            product_name: selectedProduct.name,
            brands: '',
            image_url: '',
            nutriscore_grade: undefined,
            ecoscore_grade: undefined,
            ingredients_text: '',
            nutriments: {
              energy_100g: 0,
              proteins_100g: 0,
              carbohydrates_100g: 0,
              fat_100g: 0,
              fiber_100g: 0,
              salt_100g: 0,
              sugars_100g: 0,
              saturated_fat_100g: 0,
              sodium_100g: 0,
              calcium_100g: 0,
              iron_100g: 0,
              trans_fat_100g: 0,
              cholesterol_100g: 0,
              vitamin_a_100g: 0,
              vitamin_c_100g: 0,
              vitamin_d_100g: 0
            }
          },
          status: 1
        } : null}
        barcode={selectedProduct?.barcode || ''}
      />
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
  devicePickerContainer: {
    marginTop: 8,
  },
  devicePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 10,
  },
  devicePickerText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  deviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  deviceOptionSelected: {
    backgroundColor: '#E1E1E8',
  },
  deviceInfo: {
    flex: 1,
    marginLeft: 10,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
  },
  deviceStats: {
    fontSize: 14,
    color: '#666',
  },
  addDeviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  addDeviceText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#6D9EBE',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
  },
  emptyDescription: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#6D9EBE',
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F2F2F7',
  },
  welcomeHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F1F3C',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  welcomeContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeIcon: {
    marginBottom: 20,
  },
  welcomeMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  stepsContainer: {
    paddingHorizontal: 20,
    paddingRight: 40,
    marginBottom: 20,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepNumberContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#6D9EBE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepNumber: {
    color: 'white',
    fontWeight: 'bold',
  },
  stepText: {
    fontSize: 16,
    color: '#333',
  },
  welcomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6D9EBE',
    borderRadius: 10,
    padding: 10,
  },
  welcomeButtonIcon: {
    marginRight: 10,
  },
  welcomeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});