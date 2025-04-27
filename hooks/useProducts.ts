import { useState, useEffect } from "react";
import {
  getProducts,
  getProductCategories,
  getLinkedDevices,
  getDeviceProducts,
} from "@/services/firebase";
import { onValue, ref, getDatabase } from "firebase/database";

export interface Product {
  id: string;
  name: string;
  category?: string;
  expiryDate: string;
  location: string;
  quantity: number;
  barcode?: string;
  notes?: string;
  deviceId?: string;
  imageUrl?: string;
  brand?: string;
  last_detected?: string;
}

export interface ProductFilters {
  category: string;
  date: string | null;
  deviceId: string | null;
}

export interface Device {
  id: string;
  last_update: string;
  product_count: number;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [devicesFetched, setDevicesFetched] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>({
    category: "",
    date: null,
    deviceId: null,
  });

  // Obtener dispositivos
  const fetchDevices = async () => {
    try {
      const linkedDevices = await getLinkedDevices();
      setDevices(linkedDevices);
      setDevicesFetched(true);

      // Si hay dispositivos y ninguno está seleccionado, seleccionar el primero
      if (linkedDevices.length > 0 && !selectedDevice) {
        setSelectedDevice(linkedDevices[0].id);
      } else if (linkedDevices.length === 0) {
        // Si no hay dispositivos, finalizar la carga
        setLoading(false);
        setRefreshing(false);
      }
    } catch (error) {
      console.error("Error al obtener dispositivos:", error);
      // Asegurar que se termine la carga incluso si hay error
      setLoading(false);
      setRefreshing(false);
      setDevicesFetched(true);
    }
  };

  // Obtener productos desde Firebase
  const fetchProducts = async () => {
    try {
      // Si no hay un dispositivo seleccionado, usar getProducts para obtener todos
      if (!selectedDevice) {
        const productsData = await getProducts();
        setProducts(productsData);
      } else {
        // Obtener productos específicos del dispositivo
        const deviceProducts = await getDeviceProducts(selectedDevice);

        // Transformar a formato compatible
        const formattedProducts = deviceProducts.map((product) => ({
          id: product.barcode,
          name:
            product.product_name ||
            product.name ||
            `Producto ${product.barcode.slice(-4)}`,
          category: product.category || "",
          expiryDate: product.expiry_date || "",
          barcode: product.barcode,
          location: "Armario principal",
          quantity: 1,
          deviceId: selectedDevice,
          last_detected: product.last_detected,
          brand: product.brand || "",
          imageUrl: product.image_url || "",
          notes: product.notes || "",
        }));

        setProducts(formattedProducts);
      }

      const categoriesData = await getProductCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error al obtener productos:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Configurar escucha en tiempo real para el dispositivo seleccionado
  useEffect(() => {
    if (!selectedDevice) return;

    const database = getDatabase();
    const deviceProductsRef = ref(
      database,
      `ordinem/devices/${selectedDevice}/products`
    );

    // Establecer el listener
    const unsubscribe = onValue(deviceProductsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setProducts([]);
        return;
      }

      // Convertir los datos de Firebase al formato necesario
      const productsData = snapshot.val();
      const formattedProducts = Object.entries(productsData).map(
        ([barcode, data]: [string, any]) => ({
          id: barcode,
          barcode,
          name:
            data.product_name || data.name || `Producto ${barcode.slice(-4)}`,
          category: data.category || "",
          expiryDate: data.expiry_date || "",
          location: data.location || "Armario principal",
          quantity: data.quantity || 1,
          deviceId: selectedDevice,
          notes: data.notes || "",
          last_detected: data.last_detected || "",
          brand: data.brand || "",
          imageUrl: data.image_url || "",
        })
      );

      setProducts(formattedProducts);
      setLoading(false);
      setRefreshing(false);
    });

    // Limpiar el listener cuando cambie el dispositivo o se desmonte
    return () => unsubscribe();
  }, [selectedDevice]);

  // Cargar dispositivos al iniciar
  useEffect(() => {
    fetchDevices();
  }, []);

  // Cargar productos cuando cambie el dispositivo seleccionado
  useEffect(() => {
    if (selectedDevice) {
      setLoading(true);
      fetchProducts();
    }
  }, [selectedDevice]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDevices();
    if (selectedDevice) {
      await fetchProducts();
    }
  };

  const filterProducts = (
    query: string,
    category: string,
    deviceId: string | null = null
  ) => {
    let filtered = [...products];

    if (query) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.barcode?.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (category) {
      filtered = filtered.filter((product) => product.category === category);
    }

    if (deviceId) {
      filtered = filtered.filter((product) => product.deviceId === deviceId);
    }

    return filtered;
  };

  return {
    products,
    categories,
    devices,
    selectedDevice,
    setSelectedDevice,
    loading,
    refreshing,
    onRefresh,
    filters,
    setFilters,
    filterProducts,
    devicesFetched,
  };
}
