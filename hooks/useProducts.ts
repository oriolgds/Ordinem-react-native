import { useState, useEffect } from "react";
import { FilterOptions } from "@/components/FilterModal";

interface Product {
  id: string;
  name: string;
  category: string;
  expiryDate: string;
  quantity: number;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: "name",
    categories: [],
    expiryRange: "all",
  });

  const fetchProducts = async () => {
    try {
      // Aquí iría la lógica para obtener los productos
      // Por ahora usaremos datos de ejemplo
      const mockProducts: Product[] = [
        {
          id: "1",
          name: "Leche",
          category: "Lácteos",
          expiryDate: "2024-04-25",
          quantity: 2,
        },
        {
          id: "2",
          name: "Pan",
          category: "Panadería",
          expiryDate: "2024-04-23",
          quantity: 1,
        },
      ];

      setProducts(mockProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  return {
    products,
    loading,
    refreshing,
    onRefresh,
    filters,
    setFilters,
  };
}
