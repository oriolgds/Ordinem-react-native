import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getLinkedDevices, unlinkDevice, getDeviceProducts } from '@/services/firebase';
import { useFocusEffect } from '@react-navigation/native';

interface Device {
  id: string;
  last_update: string;
  product_count: number;
}

interface Product {
  barcode: string;
  product_name?: string;
  category?: string;
  expiry_date: string;
  last_detected: string;
}

export default function DevicesScreen() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const router = useRouter();

  // Cargar dispositivos cuando la pantalla está enfocada
  useFocusEffect(
    useCallback(() => {
      loadDevices();
      return () => {};
    }, [])
  );

  const loadDevices = async () => {
    try {
      setLoading(true);
      const linkedDevices = await getLinkedDevices();
      setDevices(linkedDevices);
      
      // Si hay un dispositivo seleccionado, actualizar sus productos
      if (selectedDevice) {
        const deviceProducts = await getDeviceProducts(selectedDevice);
        setProducts(deviceProducts);
      }
    } catch (error) {
      console.error('Error al cargar dispositivos:', error);
      Alert.alert('Error', 'No se pudieron cargar los dispositivos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDevices();
  };

  const handleDevicePress = async (deviceId: string) => {
    try {
      setSelectedDevice(deviceId);
      const deviceProducts = await getDeviceProducts(deviceId);
      setProducts(deviceProducts);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los productos del dispositivo');
    }
  };

  const handleDeviceOptions = (device: Device) => {
    Alert.alert(
      `Dispositivo ${device.id}`,
      'Selecciona una acción',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desvincular',
          style: 'destructive',
          onPress: () => handleUnlinkDevice(device.id)
        }
      ]
    );
  };

  const handleProductPress = (product: Product) => {
    setSelectedProduct(product);
    setDetailsModalVisible(true);
  };

  const handleUnlinkDevice = async (deviceId: string) => {
    Alert.alert(
      'Desvincular dispositivo',
      '¿Estás seguro de que quieres desvincular este dispositivo? Perderás la conexión con todos los productos almacenados en él.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desvincular',
          style: 'destructive',
          onPress: async () => {
            try {
              await unlinkDevice(deviceId);
              setDevices(devices.filter(d => d.id !== deviceId));
              if (selectedDevice === deviceId) {
                setSelectedDevice(null);
                setProducts([]);
              }
              Alert.alert('Éxito', 'Dispositivo desvinculado correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo desvincular el dispositivo');
            }
          }
        }
      ]
    );
  };

  // Formateador de fechas para una mejor presentación
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calcular días restantes hasta caducidad
  const getDaysUntilExpiry = (expiryDateStr: string) => {
    // Formato esperado: DD/MM/YYYY
    if (!expiryDateStr) return null;
    
    const parts = expiryDateStr.split('/');
    if (parts.length !== 3) return null;
    
    const expiryDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const getExpiryColor = (expiryDateStr: string) => {
    const daysUntil = getDaysUntilExpiry(expiryDateStr);
    if (daysUntil === null) return '#999';
    if (daysUntil <= 0) return '#FF5252';
    if (daysUntil <= 3) return '#FFA726';
    if (daysUntil <= 7) return '#FFD600';
    return '#4CAF50';
  };

  const renderDeviceItem = ({ item }: { item: Device }) => {
    const isSelected = selectedDevice === item.id;
    
    return (
      <TouchableOpacity 
        style={[styles.deviceCard, isSelected && styles.selectedDeviceCard]}
        onPress={() => handleDevicePress(item.id)}
      >
        <View style={styles.deviceCardHeader}>
          <View style={styles.deviceInfo}>
            <Ionicons 
              name={isSelected ? "cube" : "cube-outline"} 
              size={28} 
              color="#6D9EBE" 
            />
            <View style={styles.deviceDetails}>
              <Text style={styles.deviceName}>Armario {item.id}</Text>
              <Text style={styles.productCount}>
                {item.product_count} productos
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.optionsButton}
            onPress={() => handleDeviceOptions(item)}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#888" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.deviceCardFooter}>
          <View style={styles.deviceStatusContainer}>
            <View style={styles.statusIndicator} />
            <Text style={styles.deviceStatus}>Conectado</Text>
          </View>
          <Text style={styles.lastUpdate}>
            Última actualización: {formatDate(item.last_update)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const expiryColor = getExpiryColor(item.expiry_date);
    const daysRemaining = getDaysUntilExpiry(item.expiry_date);
    
    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => handleProductPress(item)}
      >
        <View style={styles.productHeader}>
          <View style={styles.productMainInfo}>
            <Text style={styles.productName}>{item.product_name || 'Producto sin nombre'}</Text>
            <Text style={styles.productBarcode}>Código: {item.barcode}</Text>
          </View>
          <View style={[styles.expiryBadge, { backgroundColor: expiryColor }]}>
            <Text style={styles.expiryBadgeText}>
              {daysRemaining !== null ? (
                daysRemaining <= 0 ? 'Caducado' : 
                  daysRemaining === 1 ? '1 día' : 
                  `${daysRemaining} días`
              ) : 'Sin fecha'}
            </Text>
          </View>
        </View>
        
        <View style={styles.productFooter}>
          <View style={styles.productMetaItem}>
            <Ionicons name="calendar-outline" size={14} color="#888" />
            <Text style={styles.productMetaText}>
              Caducidad: {item.expiry_date || 'No especificada'}
            </Text>
          </View>
          
          <View style={styles.productMetaItem}>
            <Ionicons name="time-outline" size={14} color="#888" />
            <Text style={styles.productMetaText}>
              Detectado: {formatDate(item.last_detected)}
            </Text>
          </View>
          
          {item.category && (
            <View style={styles.productMetaItem}>
              <Ionicons name="pricetag-outline" size={14} color="#888" />
              <Text style={styles.productMetaText}>
                Categoría: {item.category}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6D9EBE" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con título y botón de añadir */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Dispositivos</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/pair-device')}
        >
          <Ionicons name="add-circle" size={24} color="#6D9EBE" />
        </TouchableOpacity>
      </View>

      {/* Lista de dispositivos */}
      <Text style={styles.sectionTitle}>
        {devices.length > 0 ? `Dispositivos (${devices.length})` : 'No hay dispositivos vinculados'}
      </Text>
      
      {devices.length > 0 ? (
        <ScrollView 
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6D9EBE']}
            />
          }
        >
          <View style={styles.devicesList}>
            {devices.map(device => (
              <View key={device.id}>
                {renderDeviceItem({ item: device })}
              </View>
            ))}
          </View>

          {/* Sección de productos si hay un dispositivo seleccionado */}
          {selectedDevice && (
            <View style={styles.productsSection}>
              <Text style={styles.sectionTitle}>
                Productos ({products.length})
              </Text>
              
              {products.length > 0 ? (
                products.map(product => (
                  <View key={product.barcode}>
                    {renderProductItem({ item: product })}
                  </View>
                ))
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="cube-outline" size={48} color="#DDD" />
                  <Text style={styles.emptyStateText}>No hay productos detectados</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Los productos que detecte tu armario aparecerán aquí
                  </Text>
                </View>
              )}
            </View>
          )}
          
          {/* Sección de ayuda si no hay dispositivo seleccionado */}
          {devices.length > 0 && !selectedDevice && (
            <View style={styles.helpSection}>
              <Ionicons name="information-circle-outline" size={40} color="#6D9EBE" />
              <Text style={styles.helpSectionTitle}>Selecciona un dispositivo</Text>
              <Text style={styles.helpSectionText}>
                Toca en uno de tus dispositivos para ver los productos detectados
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="cube-outline" size={48} color="#DDD" />
          <Text style={styles.emptyStateText}>No hay dispositivos vinculados</Text>
          <Text style={styles.emptyStateSubtext}>
            Vincula un dispositivo para empezar a detectar productos
          </Text>
        </View>
      )}

      {/* Modal para mostrar detalles del producto */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {selectedProduct && (
            <View>
              <Text style={styles.modalTitle}>{selectedProduct.product_name}</Text>
              <Text style={styles.modalText}>Código de barras: {selectedProduct.barcode}</Text>
              <Text style={styles.modalText}>Categoría: {selectedProduct.category || 'No especificada'}</Text>
              <Text style={styles.modalText}>Fecha de caducidad: {selectedProduct.expiry_date || 'No especificada'}</Text>
              <Text style={styles.modalText}>Última detección: {formatDate(selectedProduct.last_detected)}</Text>
            </View>
          )}
          <TouchableOpacity 
            style={styles.closeModalButton}
            onPress={() => setDetailsModalVisible(false)}
          >
            <Text style={styles.closeModalButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    padding: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 16,
    color: '#333',
  },
  devicesList: {
    marginBottom: 32,
  },
  deviceCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
  },
  selectedDeviceCard: {
    borderColor: '#6D9EBE',
    borderWidth: 2,
  },
  deviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceDetails: {
    marginLeft: 8,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  productCount: {
    fontSize: 14,
    color: '#666',
  },
  optionsButton: {
    padding: 8,
  },
  deviceCardFooter: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginRight: 4,
  },
  deviceStatus: {
    fontSize: 14,
    color: '#333',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#999',
  },
  productCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productMainInfo: {
    flexDirection: 'column',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  productBarcode: {
    fontSize: 14,
    color: '#666',
  },
  expiryBadge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  expiryBadgeText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  productFooter: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productMetaText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  helpSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  helpSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  helpSectionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  closeModalButton: {
    marginTop: 16,
    backgroundColor: '#6D9EBE',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  closeModalButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});