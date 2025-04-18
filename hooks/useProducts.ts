import { useState, useEffect } from "react";
import { getProducts, getProductCategories } from "@/services/firebase";

export interface Product {
  id: string;
  name: string;
  category: string;
  expiryDate: string;
  location: string;
  quantity: number;
  barcode?: string;
  notes?: string;
}

export interface ProductFilters {
  category: string;
  date: string | null;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>({
    category: "",
    date: null,
  });

  const fetchProducts = async () => {
    try {
      const productsData = await getProducts();
      setProducts(productsData);

      const categoriesData = await getProductCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error al obtener productos:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
  };

  const filterProducts = (query: string, category: string) => {
    let filtered = [...products];

    if (query) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (category) {
      filtered = filtered.filter((product) => product.category === category);
    }

    return filtered;
  };

  return {
    products,
    categories,
    loading,
    refreshing,
    onRefresh,
    filters,
    setFilters,
    filterProducts,
  };
}
