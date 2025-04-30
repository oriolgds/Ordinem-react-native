/**
 * Página principal de productos de Ordinem
 * 
 * Este componente es la pantalla principal de la aplicación donde se muestran todos los productos
 * registrados en los armarios del usuario. Sus principales funcionalidades son:
 * 
 * - Mostrar una lista de productos de todos los armarios vinculados
 * - Obtener y mostrar información detallada de OpenFoodFacts para cada producto (imágenes, marcas, etc.)
 * - Permitir filtrar productos por categoría
 * - Buscar productos por nombre o código de barras
 * - Seleccionar entre diferentes armarios vinculados
 * - Visualizar el estado de caducidad de los productos (caducados, próximos a caducar, etc.)
 * - Acceder a la información nutricional detallada al pulsar en un producto
 * 
 * La página se comunica con la API de OpenFoodFacts para enriquecer los datos básicos de los productos
 * almacenados en la base de datos de Firebase. Al obtener datos nutricionales completos, imágenes,
 * y clasificaciones (Nutri-Score, Eco-Score), ofrece una experiencia más informativa para el usuario.
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { ProductCard } from '@/components/ProductCard';
import { fetchProductWithCache } from '@/services/cacheService';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

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
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={[styles.modalContent, { transform: [{translateY: 0}] }]}>
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
  const [productDetailsFromOFF, setProductDetailsFromOFF] = useState<any>(null);
  const [loadingProductDetails, setLoadingProductDetails] = useState(false);
  const router = useRouter();

  // Estado para almacenar los datos de OpenFoodFacts de todos los productos
  const [productsOFFData, setProductsOFFData] = useState<{[barcode: string]: any}>({});
  
  // Estado para almacenar el origen de los datos (caché o API)
  const [productsOFFSource, setProductsOFFSource] = useState<{[barcode: string]: 'cache' | 'api'}>({});
  
  // Función para obtener datos de OpenFoodFacts para un código de barras
  const fetchProductFromOpenFoodFacts = useCallback(async (barcode: string) => {
    try {
      setLoadingProductDetails(true);
      // Usar el sistema de caché local en lugar de la función de Firebase
      const result = await fetchProductWithCache(barcode);
      
      if (result.product) {
        // Informar en consola del origen de los datos (caché o API)
        if (result.source === 'cache') {
          console.log(`Producto ${barcode} recuperado de la caché local`);
        } else {
          console.log(`Producto ${barcode} recuperado de OpenFoodFacts`);
        }
        
        // Guardar el origen de los datos para usarlo posteriormente
        setProductsOFFSource(prev => ({
          ...prev,
          [barcode]: result.source
        }));
        
        return result.product;
      } 
      return null;
    } catch (error) {
      console.error('Error al obtener información del producto:', error);
      return null;
    } finally {
      setLoadingProductDetails(false);
    }
  }, []);

  // Función para cargar datos de OpenFoodFacts para todos los productos
  const fetchAllProductsData = useCallback(async (productsList: Product[]) => {
    const productsWithBarcode = productsList.filter(p => p.barcode);
    
    // Crear un conjunto para evitar duplicados
    const uniqueBarcodes = new Set(productsWithBarcode.map(p => p.barcode));
    const barcodeData: {[barcode: string]: any} = {...productsOFFData};
    
    // Procesar en lotes para no saturar la API
    const batchSize = 3;
    const barcodesToProcess = Array.from(uniqueBarcodes).filter(barcode => 
      barcode && !productsOFFData[barcode as string]
    );
    
    for (let i = 0; i < barcodesToProcess.length; i += batchSize) {
      const batch = barcodesToProcess.slice(i, i + batchSize);
      const promises = batch.map(async (barcode) => {
        if (barcode) {
          const data = await fetchProductFromOpenFoodFacts(barcode as string);
          if (data) {
            barcodeData[barcode as string] = data;
          }
        }
      });
      
      await Promise.all(promises);
    }
    
    setProductsOFFData(barcodeData);
  }, [fetchProductFromOpenFoodFacts]); // Quitamos productsOFFData para evitar el bucle infinito
  
  // Cargar datos de OpenFoodFacts cuando cambian los productos
  useEffect(() => {
    if (products.length > 0) {
      fetchAllProductsData(products);
    }
  }, [products, fetchAllProductsData]);

  // Navegar a detalle del producto
  const handleProductPress = (product: Product) => {
    setSelectedProduct(product);
    
    if (product.barcode && productsOFFData[product.barcode]) {
      setProductDetailsFromOFF(productsOFFData[product.barcode]);
    } else {
      setProductDetailsFromOFF(null);
    }
    
    setModalVisible(true);
  };

  // Efecto para filtrar productos cuando cambian los filtros o los productos
  useEffect(() => {
    const filtered = filterProducts(searchQuery, categoryFilter, selectedDevice || null);
    setFilteredProducts(filtered);
  }, [searchQuery, categoryFilter, selectedDevice, products, filterProducts]);

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

      {categories.length > 0 && (
        <View style={styles.categoryFilters}>
          {categories.map(category => (
            category ? (
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
            ) : null
          ))}
        </View>
      )}

      <FlatList
        data={filteredProducts}
        renderItem={({ item }) => {
          // Enriquecer el producto con datos de OpenFoodFacts si están disponibles
          const enrichedProduct = { ...item };
          
          // Si hay datos disponibles de OpenFoodFacts, actualizar los atributos del producto
          if (item.barcode && productsOFFData[item.barcode]) {
            const offData = productsOFFData[item.barcode];
            
            // Usar el nombre de OpenFoodFacts si está disponible
            if (offData.product_name) {
              enrichedProduct.name = offData.product_name;
            }
            
            // Usar la imagen de OpenFoodFacts si está disponible
            if (offData.image_url) {
              enrichedProduct.imageUrl = offData.image_url;
            }
            
            // Añadir marca si está disponible
            if (offData.brands && !enrichedProduct.brand) {
              enrichedProduct.brand = offData.brands;
            }
          }
          
          return (
            <ProductCard 
              product={enrichedProduct}
              onPress={handleProductPress}
            />
          );
        }}
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
        productData={productDetailsFromOFF ? {
          product: {
            product_name: productDetailsFromOFF.product_name || selectedProduct?.name,
            brands: productDetailsFromOFF.brands || '',
            image_url: productDetailsFromOFF.image_url || selectedProduct?.imageUrl || '',
            nutriscore_grade: productDetailsFromOFF.nutriscore_grade || undefined,
            ecoscore_grade: productDetailsFromOFF.ecoscore_grade || undefined,
            ingredients_text: productDetailsFromOFF.ingredients_text || '',
            nutriments: {
              energy_100g: productDetailsFromOFF.nutriments?.energy_100g || 0,
              proteins_100g: productDetailsFromOFF.nutriments?.proteins_100g || 0,
              carbohydrates_100g: productDetailsFromOFF.nutriments?.carbohydrates_100g || 0,
              fat_100g: productDetailsFromOFF.nutriments?.fat_100g || 0,
              fiber_100g: productDetailsFromOFF.nutriments?.fiber_100g || 0,
              salt_100g: productDetailsFromOFF.nutriments?.salt_100g || 0,
              sugars_100g: productDetailsFromOFF.nutriments?.sugars_100g || 0,
              saturated_fat_100g: productDetailsFromOFF.nutriments?.saturated_fat_100g || 0,
              sodium_100g: productDetailsFromOFF.nutriments?.sodium_100g || 0,
              calcium_100g: productDetailsFromOFF.nutriments?.calcium_100g || 0,
              iron_100g: productDetailsFromOFF.nutriments?.iron_100g || 0,
              trans_fat_100g: productDetailsFromOFF.nutriments?.trans_fat_100g || 0,
              cholesterol_100g: productDetailsFromOFF.nutriments?.cholesterol_100g || 0,
              vitamin_a_100g: productDetailsFromOFF.nutriments?.vitamin_a_100g || 0,
              vitamin_c_100g: productDetailsFromOFF.nutriments?.vitamin_c_100g || 0,
              vitamin_d_100g: productDetailsFromOFF.nutriments?.vitamin_d_100g || 0
            }
          },
          status: 1,
          source: selectedProduct?.barcode ? productsOFFSource[selectedProduct.barcode] || 'api' : 'api'
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
    flexWrap: 'wrap',
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
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
    paddingBottom: 80, // Espacio para el FAB button
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 40,
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