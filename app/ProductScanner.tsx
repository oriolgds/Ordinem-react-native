/**
 * Página del Scanner de Productos de Ordinem
 *
 * Este componente proporciona un escáner de códigos de barras para consultar información
 * nutricional de productos desde la base de datos de OpenFoodFacts. Sus principales
 * funcionalidades son:
 *
 * - Escanear códigos de barras EAN-8, EAN-13, UPC-A y UPC-E
 * - Buscar automáticamente información del producto en OpenFoodFacts
 * - Mostrar información nutricional detallada (Nutri-Score, Eco-Score)
 * - Visualizar ingredientes y valores nutricionales por 100g
 * - Permitir escanear múltiples productos de forma consecutiva
 *
 * IMPORTANTE: A diferencia de la página principal de productos, este scanner NO añade
 * productos al inventario del armario Ordinem. Funciona como un escáner informativo,
 * similar a aplicaciones como Yuka, diseñado para consultar información de productos
 * mientras se está en el supermercado antes de comprarlos.
 *
 * Los productos en el inventario de los armarios son detectados y añadidos automáticamente
 * por los dispositivos Ordinem mediante sus propios sensores, no mediante este scanner.
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  AppState,
} from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { useRouter, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ProductDetailsModal } from "@/components/ProductDetailsModal";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { fetchProductWithCache } from "@/services/cacheService";

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
  source?: "cache" | "api";
}

export default function ProductScanner() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<ProductData | null>(
    null
  );
  const [scannedBarcode, setScannedBarcode] = useState<string>("");
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string>(""); // Nuevo estado para controlar escaneos duplicados
  const [scannerActive, setScannerActive] = useState(true); // Nuevo estado para controlar si el escáner está activo

  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === "granted");
    };

    getBarCodeScannerPermissions();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        setScanned(false);
        setLoading(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setScanned(false);
      setLoading(false);
    });

    return unsubscribe;
  }, [navigation]);

  /**
   * IMPORTANTE: Este scanner de productos es solo para consultar información nutricional
   * (similar a Yuka) cuando estás en el supermercado. NO añade productos al inventario.
   * Los productos son detectados y añadidos automáticamente por el armario Ordinem.
   */

  const showProductDetails = async (barcode: string, productData: any) => {
    try {
      setScannedProduct({
        product: productData,
        status: 1,
      });

      setModalVisible(true);
      return true;
    } catch (error) {
      console.error("Error al mostrar detalles del producto:", error);
      setScannerActive(true);
      return false;
    }
  };

  const updateScannedProduct = async (
    product: any,
    source: "cache" | "api"
  ) => {
    if (modalVisible) {
      setModalVisible(false);

      setTimeout(() => {
        setScannedProduct({
          product: {
            ...product,
            additives_tags: product.additives_tags || [],
            additives_original_tags: product.additives_original_tags || [],
          },
          status: 1,
          source: source,
        });
        setModalVisible(true);
      }, 300);
    } else {
      setScannedProduct({
        product: {
          ...product,
          additives_tags: product.additives_tags || [],
          additives_original_tags: product.additives_original_tags || [],
        },
        status: 1,
        source: source,
      });
      setModalVisible(true);
    }
  };

  const fetchProductInfo = async (barcode: string) => {
    try {
      const result = await fetchProductWithCache(barcode);

      if (result.product) {
        if (result.source === "cache") {
          console.log(`Producto ${barcode} recuperado de la caché local`);
        } else {
          console.log(`Producto ${barcode} recuperado de OpenFoodFacts`);
        }
        return { product: result.product, source: result.source };
      } else {
        console.log(`Producto ${barcode} no encontrado`);
        setScannerActive(true);
        return null;
      }
    } catch (error) {
      console.error("Error al obtener información del producto:", error);
      setScannerActive(true);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = async ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (!scannerActive || data === lastScannedBarcode) return;

    setScannerActive(false);
    setLoading(true);
    setLastScannedBarcode(data);
    setScannedBarcode(data);

    if (data.length < 8 || data.length > 13 || !/^\d+$/.test(data)) {
      setLoading(false);
      console.log(`Código inválido: ${data}`);
      setScannerActive(true);
      return;
    }

    const response = await fetchProductInfo(data);
    if (response) {
      await updateScannedProduct(response.product, response.source);
    }

    setLoading(false);
    setTimeout(() => {
      setScannerActive(true);
    }, 1500);
  };

  const handleClose = () => {
    router.back();
  };

  const handleScanAgain = () => {
    setLastScannedBarcode("");
    setScannerActive(true);
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
          onBarCodeScanned={handleBarCodeScanned}
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
                  {modalVisible && (
                    <View style={styles.scannerActiveIndicator}>
                      <Text style={styles.scannerActiveText}>
                        Escáner activo
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
            <View style={styles.unfilled} />
          </View>
          <View style={styles.unfilled}>
            <Text style={styles.instructions}>
              {modalVisible
                ? "Escanea otro producto para cambiar"
                : "Alinea el código de barras dentro del recuadro para escanearlo"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.closeButtonContainer}
          onPress={handleClose}
        >
          <Ionicons name="close-outline" size={50} color="white" />
        </TouchableOpacity>

        <ProductDetailsModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            handleScanAgain();
          }}
          productData={scannedProduct}
          barcode={scannedBarcode}
          initialHeight="30%"
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    flex: 1,
    width: "100%",
  },
  unfilled: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    height: 250,
  },
  scanner: {
    width: 250,
    height: 250,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: "white",
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
    color: "white",
    textAlign: "center",
    fontSize: 16,
    maxWidth: "80%",
    marginBottom: 20,
  },
  closeButtonContainer: {
    position: "absolute",
    top: 50,
    right: 20,
  },
  rescanButton: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    backgroundColor: "#6D9EBE",
    padding: 15,
    margin: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  rescanButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  permissionText: {
    fontSize: 18,
    color: "white",
    marginTop: 20,
    marginBottom: 10,
  },
  permissionSubtext: {
    fontSize: 14,
    color: "white",
    opacity: 0.8,
    textAlign: "center",
    marginHorizontal: 40,
    marginBottom: 30,
  },
  closeButton: {
    backgroundColor: "#6D9EBE",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  loadingText: {
    color: "white",
    fontSize: 16,
    marginTop: 10,
  },
  scannerActiveIndicator: {
    position: "absolute",
    bottom: -30,
    left: 0,
    right: 0,
    backgroundColor: "rgba(109, 158, 190, 0.8)",
    paddingVertical: 4,
    borderRadius: 4,
  },
  scannerActiveText: {
    color: "white",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "bold",
  },
});
