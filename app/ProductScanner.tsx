import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProductDetailsModal } from '@/components/ProductDetailsModal';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();
  }, []);

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
    
    // Pequeño timeout para asegurar que el modal anterior se haya cerrado
    setTimeout(() => {
      setModalVisible(true);
    }, 100);
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
});