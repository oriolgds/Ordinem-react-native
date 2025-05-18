/**
 * Servicio de caché local para información de OpenFoodFacts
 *
 * Este servicio gestiona el almacenamiento en caché de los datos de productos
 * consultados en OpenFoodFacts para optimizar el rendimiento y reducir las
 * llamadas a la API. Los datos se almacenan directamente en el dispositivo
 * usando AsyncStorage.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "openfoodfacts_cache_";
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 días en milisegundos

// Función para recuperar datos de producto con caché
export const fetchProductWithCache = async (barcode: string) => {
  try {
    // Intentar recuperar de la caché primero
    const cachedData = await getCachedProduct(barcode);

    if (cachedData) {
      // Verificar que tengamos un nombre de producto válido
      if (
        cachedData.product &&
        (cachedData.product.product_name || cachedData.product.generic_name)
      ) {
        // Si el producto tiene un nombre válido, devolverlo desde la caché
        return { product: cachedData, source: "cache" };
      }
    }

    // Si no está en caché o no tiene nombre válido, obtener de la API
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );

    if (!response.ok) {
      throw new Error(`Error API: ${response.status}`);
    }

    const data = await response.json();

    // Verificar si el producto existe y se encontró en la API
    if (data.status === 1) {
      // Asegurarse de que el nombre del producto esté correctamente establecido
      if (!data.product.product_name && data.product.generic_name) {
        data.product.product_name = data.product.generic_name;
      } else if (!data.product.product_name) {
        // Si no hay nombre, crear uno genérico pero descriptivo
        data.product.product_name = `Producto ${
          data.product.brands || ""
        } (${barcode})`;
      }

      // Guardar en caché
      await cacheProduct(barcode, data.product);

      return { product: data.product, source: "api" };
    }

    return { product: null, source: "api" };
  } catch (error) {
    console.error("Error al recuperar producto:", error);
    throw error;
  }
};

// Guardar producto en caché
const cacheProduct = async (barcode: string, productData: any) => {
  try {
    const cacheData = {
      timestamp: Date.now(),
      ...productData,
    };
    await AsyncStorage.setItem(
      `${CACHE_PREFIX}${barcode}`,
      JSON.stringify(cacheData)
    );
  } catch (error) {
    console.error("Error al guardar en caché:", error);
  }
};

// Obtener producto de la caché
const getCachedProduct = async (barcode: string) => {
  try {
    const cachedDataJSON = await AsyncStorage.getItem(
      `${CACHE_PREFIX}${barcode}`
    );
    if (!cachedDataJSON) return null;

    const cachedData = JSON.parse(cachedDataJSON);

    // Verificar si la caché ha expirado
    if (Date.now() - cachedData.timestamp > CACHE_EXPIRY) {
      // Limpiar caché expirada
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${barcode}`);
      return null;
    }

    return cachedData;
  } catch (error) {
    console.error("Error al recuperar de caché:", error);
    return null;
  }
};

// Limpiar toda la caché de productos
export const clearProductCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
    console.log(`Caché limpiada: ${cacheKeys.length} productos eliminados`);
    return true;
  } catch (error) {
    console.error("Error al limpiar caché:", error);
    throw error;
  }
};
