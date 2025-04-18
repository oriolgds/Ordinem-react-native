import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Camera, CameraType, BarCodeScanningResult } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getProductFromCache, addProduct } from '@/services/firebase';

export default function ProductScanner() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async (scanningResult: BarCodeScanningResult) => {
    const { type, data } = scanningResult;
    
    if (scanned) return;
    setScanned(true);
    setLoading(true);
    
    try {
      console.log('Código escaneado:', data);
      
      // Verificar si el producto ya existe en la caché
      const cachedProduct = await getProductFromCache(data);
      
      if (cachedProduct) {
        // Si existe, agregarlo directamente a los productos del usuario
        const productId = Date.now().toString();
        await addProduct({
          id: productId,
          name: cachedProduct.name,
          category: cachedProduct.category,
          expiryDate: calculateDefaultExpiryDate(cachedProduct.category),
          location: 'Principal',
          quantity: 1,
          barcode: data,
          notes: '',
        });
        
        // Navegar a la pantalla de detalles del producto
        Alert.alert(
          'Producto añadido',
          `${cachedProduct.name} ha sido añadido a tu inventario.`,
          [
            { 
              text: 'Ver detalles', 
              onPress: () => router.push({
                pathname: '/ProductDetails',
                params: { productId }
              }) 
            },
            { 
              text: 'Escanear otro', 
              onPress: () => {
                setScanned(false);
                setLoading(false);
              } 
            }
          ]
        );
      } else {
        // Si no existe, navegar a la pantalla de añadir producto con el código de barras
        router.push({
          pathname: '/AddProduct',
          params: { barcode: data }
        });
      }
    } catch (error) {
      console.error('Error al procesar código de barras:', error);
      Alert.alert(
        'Error',
        'No se pudo procesar el código. Inténtalo de nuevo.',
        [
          { 
            text: 'OK', 
            onPress: () => {
              setScanned(false);
              setLoading(false);
            } 
          }
        ]
      );
    }
  };

  const handleClose = () => {
    router.back();
  };

  const toggleFlash = () => {
    setFlashMode(
      flashMode === Camera.Constants.FlashMode.off
        ? Camera.Constants.FlashMode.torch
        : Camera.Constants.FlashMode.off
    );
  };

  // Calcular una fecha de caducidad predeterminada según la categoría
  const calculateDefaultExpiryDate = (category: string): string => {
    const date = new Date();
    
    switch (category.toLowerCase()) {
      case 'alimentos':
        date.setDate(date.getDate() + 7); // 1 semana
        break;
      case 'bebidas':
        date.setMonth(date.getMonth() + 3); // 3 meses
        break;
      case 'limpieza':
        date.setFullYear(date.getFullYear() + 1); // 1 año
        break;
      default:
        date.setMonth(date.getMonth() + 1); // 1 mes
    }
    
    return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6D9EBE" />
        <Text style={styles.permissionText}>Solicitando permisos de cámara...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Ionicons name="camera-off-outline" size={64} color="#FF5252" />
        <Text style={styles.permissionText}>No hay acceso a la cámara</Text>
        <Text style={styles.permissionSubtext}>
          Para escanear códigos QR, debes permitir el acceso a la cámara en la configuración de tu dispositivo.
        </Text>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFillObject}
        type={CameraType.back}
        flashMode={flashMode}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        barCodeScannerSettings={{
          barCodeTypes: ['qr', 'upc-e', 'upc-a', 'ean-8', 'ean-13', 'code-128', 'code-39', 'code-93', 'codabar', 'itf'],
        }}
      />
      
      {/* Overlay y guía de escaneo */}
      <View style={styles.overlay}>
        <View style={styles.unfilled} />
        <View style={styles.row}>
          <View style={styles.unfilled} />
          <View style={styles.scanner}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="white" />
                <Text style={styles.loadingText}>Procesando código...</Text>
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
      
      {/* Botón de cerrar */}
      <TouchableOpacity style={styles.closeButtonContainer} onPress={handleClose}>
        <Ionicons name="close-circle" size={50} color="white" />
      </TouchableOpacity>
      
      {/* Botón de linterna */}
      <TouchableOpacity style={styles.flashButtonContainer} onPress={toggleFlash}>
        <Ionicons 
          name={flashMode === Camera.Constants.FlashMode.torch ? "flashlight" : "flashlight-outline"} 
          size={30} 
          color="white" 
        />
      </TouchableOpacity>
      
      {/* Botón para volver a escanear */}
      {scanned && !loading && (
        <TouchableOpacity 
          style={styles.rescanButton} 
          onPress={() => setScanned(false)}
        >
          <Text style={styles.rescanButtonText}>Escanear de nuevo</Text>
        </TouchableOpacity>
      )}
    </View>
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
  flashButtonContainer: {
    position: 'absolute',
    bottom: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 30,
    padding: 10,
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