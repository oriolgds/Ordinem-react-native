import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  AppState,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProductDetailsModal } from '@/components/ProductDetailsModal';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getDatabase, ref, set } from 'firebase/database';
import { getLinkedDevices } from '@/services/firebase';
import { useProducts } from '@/hooks/useProducts';

interface ProductData {
  product: {
    product_name: string;
    brands: string;
    image_url: string;
    nutriscore_grade?: string;
    ecoscore_grade?: string;
    ingredients_text: string;
    nutriments: {
      energy_100g: number;
      proteins_100g: number;
      carbohydrates_100g: number;
      fat_100g: number;
      fiber_100g: number;
      salt_100g: number;
      sugars_100g: number;
      saturated_fat_100g: number;
      sodium_100g: number;
      calcium_100g: number;
      iron_100g: number;
      trans_fat_100g: number;
      cholesterol_100g: number;
      vitamin_a_100g: number;
      vitamin_c_100g: number;
      vitamin_d_100g: number;
    };
  };
  status: number;
}

export default function ProductScanner() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<ProductData | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [devices, setDevices] = useState<Array<{id: string, product_count: number}>>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const { devices: linkedDevices } = useProducts();
  
  const router = useRouter();
  const navigation = useNavigation();

  // Función para formatear la fecha a YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Inicializar fecha de caducidad a 7 días en el futuro
  useEffect(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    setExpiryDate(formatDate(defaultDate));
  }, []);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();
  }, []);

  // Cargar dispositivos vinculados
  useEffect(() => {
    const loadDevices = async () => {
      try {
        const linkedDevices = await getLinkedDevices();
        setDevices(linkedDevices);
        
        // Si solo hay un dispositivo, seleccionarlo automáticamente
        if (linkedDevices.length === 1) {
          setSelectedDevice(linkedDevices[0].id);
        }
      } catch (error) {
        console.error('Error al cargar dispositivos:', error);
      }
    };
    
    loadDevices();
  }, []);

  // Actualizar con el último estado de linkedDevices
  useEffect(() => {
    if (linkedDevices.length > 0) {
      setDevices(linkedDevices);
      if (linkedDevices.length === 1) {
        setSelectedDevice(linkedDevices[0].id);
      }
    }
  }, [linkedDevices]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        setScanned(false);
        setLoading(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setScanned(false);
      setLoading(false);
    });

    return unsubscribe;
  }, [navigation]);

  // Guardar producto en Firebase
  const saveProductToDevice = async (barcode: string, productData: any) => {
    if (!selectedDevice) {
      // Si no hay dispositivo seleccionado, mostrar selector
      setShowDeviceSelector(true);
      return false;
    }

    try {
      const database = getDatabase();
      const now = new Date().toISOString();
      
      // Crear referencia al producto en la estructura Firebase
      const productRef = ref(
        database, 
        `ordinem/devices/${selectedDevice}/products/${barcode}`
      );

      // Guardar datos del producto
      await set(productRef, {
        product_name: productData.product_name,
        category: productData.categories_hierarchy?.[0]?.split(':')?.[1] || 'Alimentos',
        expiry_date: expiryDate,
        last_detected: now,
      });

      Alert.alert(
        'Producto guardado',
        'El producto ha sido añadido correctamente al dispositivo.',
        [{ text: 'OK' }]
      );
      
      return true;
    } catch (error) {
      console.error('Error al guardar producto:', error);
      Alert.alert(
        'Error',
        'No se pudo guardar el producto. Por favor, inténtalo de nuevo.',
        [{ text: 'OK' }]
      );
      return false;
    }
  };

  const updateScannedProduct = async (product: any) => {
    // Primero cerramos el modal actual si está abierto
    if (modalVisible) {
      setModalVisible(false);
    }
    
    // Actualizamos el producto y abrimos el modal con la nueva información
    setScannedProduct({
      product: product,
      status: 1
    });
    
    // Mostrar modal para configurar fecha de caducidad
    setShowExpiryModal(true);
  };

  const fetchProductInfo = async (barcode: string) => {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
      );
      const data = await response.json();
      
      if (data.status === 1) {
        return data.product;
      } else {
        Alert.alert(
          'Producto no encontrado',
          'Este producto no está disponible en la base de datos.',
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
        return null;
      }
    } catch (error) {
      console.error('Error al obtener información del producto:', error);
      Alert.alert(
        'Error',
        'No se pudo obtener la información del producto. Por favor, inténtalo de nuevo.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    setLoading(true);
    setScannedBarcode(data);

    if (data.length < 8 || data.length > 13 || !/^\d+$/.test(data)) {
      setLoading(false);
      Alert.alert(
        'Código inválido',
        'Por favor, escanea un código de barras válido.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
      return;
    }

    const response = await fetchProductInfo(data);
    if (response) {
      await updateScannedProduct(response);
    }
  };

  const handleClose = () => {
    router.back();
  };

  const handleSaveProduct = async () => {
    if (!scannedProduct || !scannedBarcode) {
      Alert.alert('Error', 'No hay ningún producto para guardar.');
      return;
    }

    setShowExpiryModal(false);
    
    // Si no hay dispositivos vinculados, mostrar alerta
    if (devices.length === 0) {
      Alert.alert(
        'Sin dispositivos',
        'No tienes ningún dispositivo vinculado. ¿Quieres vincular uno ahora?',
        [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Sí', 
            onPress: () => {
              router.push('/pair-device');
            }
          }
        ]
      );
      return;
    }

    // Si hay que seleccionar dispositivo, mostrar el selector
    if (!selectedDevice && devices.length > 1) {
      setShowDeviceSelector(true);
      return;
    }

    // Guardar el producto
    const success = await saveProductToDevice(
      scannedBarcode, 
      scannedProduct.product
    );
    
    if (success) {
      // Mostrar los detalles del producto tras guardar
      setTimeout(() => {
        setModalVisible(true);
      }, 500);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6D9EBE" />
        <Text style={styles.permissionText}>
          Solicitando permisos de cámara...
        </Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Ionicons name="camera-outline" size={64} color="#FF5252" />
        <Text style={styles.permissionText}>No hay acceso a la cámara</Text>
        <Text style={styles.permissionSubtext}>
          Para escanear productos, debes permitir el acceso a la cámara en la
          configuración de tu dispositivo.
        </Text>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <BarCodeScanner
          style={StyleSheet.absoluteFillObject}
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          barCodeTypes={[
            BarCodeScanner.Constants.BarCodeType.ean13,
            BarCodeScanner.Constants.BarCodeType.ean8,
            BarCodeScanner.Constants.BarCodeType.upc_a,
            BarCodeScanner.Constants.BarCodeType.upc_e,
          ]}
        />

        <View style={styles.overlay}>
          <View style={styles.unfilled} />
          <View style={styles.row}>
            <View style={styles.unfilled} />
            <View style={styles.scanner}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="white" />
                  <Text style={styles.loadingText}>Buscando producto...</Text>
                </View>
              ) : (
                <>
                  <View style={[styles.cornerTL, styles.corner]} />
                  <View style={[styles.cornerTR, styles.corner]} />
                  <View style={[styles.cornerBL, styles.corner]} />
                  <View style={[styles.cornerBR, styles.corner]} />
                </>
              )}
            </View>
            <View style={styles.unfilled} />
          </View>
          <View style={styles.unfilled}>
            <Text style={styles.instructions}>
              Alinea el código de barras dentro del recuadro para escanearlo
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.closeButtonContainer} onPress={handleClose}>
          <Ionicons name="close-outline" size={50} color="white" />
        </TouchableOpacity>

        {scanned && !loading && (
          <TouchableOpacity
            style={styles.rescanButton}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.rescanButtonText}>Escanear otro</Text>
          </TouchableOpacity>
        )}

        {/* Modal para configurar fecha de caducidad */}
        <Modal
          visible={showExpiryModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowExpiryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Establecer fecha de caducidad</Text>
              
              {scannedProduct && (
                <Text style={styles.productName}>
                  {scannedProduct.product.product_name}
                </Text>
              )}
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Fecha de caducidad:</Text>
                <TextInput
                  style={styles.dateInput}
                  value={expiryDate}
                  onChangeText={setExpiryDate}
                  placeholder="AAAA-MM-DD"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowExpiryModal(false);
                    setScanned(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveProduct}
                >
                  <Text style={styles.saveButtonText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal para seleccionar dispositivo */}
        <Modal
          visible={showDeviceSelector}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDeviceSelector(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.deviceSelectorContent}>
              <Text style={styles.modalTitle}>Seleccionar armario</Text>
              
              <ScrollView style={styles.deviceList}>
                {devices.map(device => (
                  <TouchableOpacity
                    key={device.id}
                    style={styles.deviceItem}
                    onPress={async () => {
                      setSelectedDevice(device.id);
                      setShowDeviceSelector(false);
                      // Intentar guardar el producto después de seleccionar dispositivo
                      if (scannedProduct) {
                        await saveProductToDevice(
                          scannedBarcode, 
                          scannedProduct.product
                        );
                        setModalVisible(true);
                      }
                    }}
                  >
                    <Ionicons name="cube-outline" size={24} color="#6D9EBE" />
                    <View style={styles.deviceItemInfo}>
                      <Text style={styles.deviceItemName}>Armario {device.id}</Text>
                      <Text style={styles.deviceItemCount}>
                        {device.product_count} productos
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#999" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <TouchableOpacity 
                style={styles.cancelDeviceButton}
                onPress={() => {
                  setShowDeviceSelector(false);
                  setScanned(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <ProductDetailsModal 
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setScanned(false);
          }}
          productData={scannedProduct}
          barcode={scannedBarcode}
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    width: '100%',
  },
  unfilled: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    height: 250,
  },
  scanner: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: 'white',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  instructions: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    maxWidth: '80%',
    marginBottom: 20,
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
  },
  rescanButton: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    backgroundColor: '#6D9EBE',
    padding: 15,
    margin: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  rescanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  permissionText: {
    fontSize: 18,
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionSubtext: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
    textAlign: 'center',
    marginHorizontal: 40,
    marginBottom: 30,
  },
  closeButton: {
    backgroundColor: '#6D9EBE',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  productName: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  dateInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  saveButton: {
    backgroundColor: '#6D9EBE',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  deviceSelectorContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  deviceList: {
    maxHeight: '70%',
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e8',
  },
  deviceItemInfo: {
    flex: 1,
    marginLeft: 10,
  },
  deviceItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  deviceItemCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  cancelDeviceButton: {
    marginTop: 15,
    backgroundColor: '#f2f2f7',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
});