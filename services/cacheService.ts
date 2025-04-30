/**
 * Servicio de caché local para información de OpenFoodFacts
 *
 * Este servicio gestiona el almacenamiento en caché de los datos de productos
 * consultados en OpenFoodFacts para optimizar el rendimiento y reducir las
 * llamadas a la API. Los datos se almacenan directamente en el dispositivo
 * usando AsyncStorage.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// Prefijo para las claves de caché de productos
const CACHE_PREFIX = "off_product_";
// Tiempo de expiración de la caché en milisegundos (30 días)
const CACHE_EXPIRATION = 30 * 24 * 60 * 60 * 1000;

/**
 * Guarda un producto de OpenFoodFacts en la caché local
 *
 * @param barcode - Código de barras del producto
 * @param productData - Datos del producto
 * @returns Promise que se resuelve a true si se guardó correctamente, false en caso de error
 */
export const saveProductToCache = async (
  barcode: string,
  productData: any
): Promise<boolean> => {
  try {
    if (!barcode || !productData) return false;

    const cacheData = {
      product: productData,
      cached_at: Date.now(),
    };

    await AsyncStorage.setItem(
      `${CACHE_PREFIX}${barcode}`,
      JSON.stringify(cacheData)
    );
    console.log(`Producto ${barcode} guardado en caché local`);
    return true;
  } catch (error) {
    console.error("Error al guardar producto en caché local:", error);
    return false;
  }
};

/**
 * Obtiene un producto de la caché local
 *
 * @param barcode - Código de barras del producto
 * @returns Promise que se resuelve al producto si existe y no ha expirado, null en caso contrario
 */
export const getProductFromCache = async (barcode: string): Promise<any> => {
  try {
    const cachedDataStr = await AsyncStorage.getItem(
      `${CACHE_PREFIX}${barcode}`
    );

    if (!cachedDataStr) return null;

    const cachedData = JSON.parse(cachedDataStr);

    // Verificar si los datos en caché son recientes (menos de 30 días)
    const now = Date.now();
    const cacheTime = cachedData.cached_at || 0;
    const cacheAge = (now - cacheTime) / (1000 * 60 * 60 * 24); // edad en días

    if (cacheAge < 30) {
      console.log(
        `Usando datos en caché local para ${barcode} (${cacheAge.toFixed(
          1
        )} días)`
      );
      return cachedData.product;
    } else {
      console.log(
        `Datos en caché local para ${barcode} expirados (${cacheAge.toFixed(
          1
        )} días)`
      );
      // Borrar datos caducados
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${barcode}`);
      return null;
    }
  } catch (error) {
    console.error("Error al obtener producto de la caché local:", error);
    return null;
  }
};

/**
 * Consulta la información de un producto en OpenFoodFacts, utilizando la caché local si está disponible
 *
 * @param barcode - Código de barras del producto
 * @returns Promise que se resuelve a un objeto con el producto y su origen
 */
export const fetchProductWithCache = async (
  barcode: string
): Promise<{
  product: any | null;
  source: "cache" | "api" | "error";
  error?: string;
}> => {
  try {
    // Primero intentar obtener de la caché local
    const cachedProduct = await getProductFromCache(barcode);

    if (cachedProduct) {
      return { product: cachedProduct, source: "cache" };
    }

    // Si no está en caché, consultar la API
    console.log(`Consultando API para ${barcode}`);
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
    );
    const data = await response.json();

    if (data.status === 1) {
      // Guardar en caché para futuras consultas
      await saveProductToCache(barcode, data.product);
      return { product: data.product, source: "api" };
    } else {
      return { product: null, source: "api", error: "Producto no encontrado" };
    }
  } catch (error: any) {
    console.error("Error en fetchProductWithCache:", error);
    return { product: null, source: "error", error: error.message };
  }
};

/**
 * Limpia la caché de productos que han expirado (más de 30 días)
 *
 * @returns Promise que se resuelve a true si se limpió correctamente, false en caso de error
 */
export const cleanExpiredCache = async (): Promise<boolean> => {
  try {
    // Obtener todas las claves
    const keys = await AsyncStorage.getAllKeys();
    const productKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
    let cleaned = 0;

    for (const key of productKeys) {
      const cachedDataStr = await AsyncStorage.getItem(key);
      if (cachedDataStr) {
        const cachedData = JSON.parse(cachedDataStr);
        const now = Date.now();
        const cacheTime = cachedData.cached_at || 0;
        const cacheAge = (now - cacheTime) / CACHE_EXPIRATION;

        if (cacheAge >= 1) {
          // Si ha expirado (30 días o más)
          await AsyncStorage.removeItem(key);
          cleaned++;
        }
      }
    }

    if (cleaned > 0) {
      console.log(
        `Limpieza de caché completada: se eliminaron ${cleaned} productos expirados`
      );
    }

    return true;
  } catch (error) {
    console.error("Error al limpiar caché expirada:", error);
    return false;
  }
};

/**
 * Obtiene estadísticas de la caché
 *
 * @returns Promise que se resuelve a un objeto con estadísticas de la caché
 */
export const getCacheStats = async (): Promise<{
  totalItems: number;
  totalSize: number; // en bytes
  oldestItem: number; // timestamp
  newestItem: number; // timestamp
}> => {
  try {
    // Obtener todas las claves
    const keys = await AsyncStorage.getAllKeys();
    const productKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));

    let totalSize = 0;
    let oldestItem = Date.now();
    let newestItem = 0;

    for (const key of productKeys) {
      const cachedDataStr = await AsyncStorage.getItem(key);
      if (cachedDataStr) {
        totalSize += cachedDataStr.length;
        const cachedData = JSON.parse(cachedDataStr);
        const cacheTime = cachedData.cached_at || 0;

        if (cacheTime < oldestItem) oldestItem = cacheTime;
        if (cacheTime > newestItem) newestItem = cacheTime;
      }
    }

    return {
      totalItems: productKeys.length,
      totalSize,
      oldestItem,
      newestItem,
    };
  } catch (error) {
    console.error("Error al obtener estadísticas de caché:", error);
    return {
      totalItems: 0,
      totalSize: 0,
      oldestItem: 0,
      newestItem: 0,
    };
  }
};

/**
 * Borra toda la caché de productos
 *
 * @returns Promise que se resuelve a true si se borró correctamente, false en caso de error
 */
export const clearProductCache = async (): Promise<boolean> => {
  try {
    // Obtener todas las claves
    const keys = await AsyncStorage.getAllKeys();
    const productKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));

    if (productKeys.length > 0) {
      await AsyncStorage.multiRemove(productKeys);
      console.log(`Se eliminaron ${productKeys.length} productos de la caché`);
    }

    return true;
  } catch (error) {
    console.error("Error al borrar caché de productos:", error);
    return false;
  }
};
