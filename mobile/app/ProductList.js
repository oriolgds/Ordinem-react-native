import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
    RefreshControl
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { getUserDevices, getDeviceProducts } from '../services/firebase';
import ProductCard from '../components/ProductCard';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const ProductList = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [devices, setDevices] = useState([]);
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [categories, setCategories] = useState(['all']);
    const auth = getAuth();
    const isFocused = useIsFocused();
    const navigation = useNavigation();

    // Cargar dispositivos y productos al montar el componente o cuando la pantalla vuelve a estar en foco
    useEffect(() => {
        if (isFocused) {
            loadUserData();
        }
    }, [isFocused]);

    // Función para cargar los datos del usuario (dispositivos y productos)
    const loadUserData = async () => {
        try {
            setLoading(true);
            const currentUser = auth.currentUser;

            if (!currentUser) {
                setLoading(false);
                return;
            }

            // Obtener dispositivos emparejados del usuario
            const userDevices = await getUserDevices(currentUser.uid);
            const deviceIds = Object.keys(userDevices).filter(deviceId => userDevices[deviceId]);
            setDevices(deviceIds);

            // Obtener productos de todos los dispositivos
            let allProducts = [];
            let allCategories = new Set(['all']);

            for (const deviceId of deviceIds) {
                const deviceProducts = await getDeviceProducts(deviceId);

                if (deviceProducts) {
                    // Transformar el objeto de productos en un array
                    const productsArray = Object.keys(deviceProducts).map(barcode => ({
                        barcode,
                        deviceId,
                        ...deviceProducts[barcode]
                    }));

                    allProducts = [...allProducts, ...productsArray];

                    // Recopilar categorías únicas
                    productsArray.forEach(product => {
                        if (product.category) {
                            allCategories.add(product.category);
                        }
                    });
                }
            }

            setProducts(allProducts);
            setFilteredProducts(allProducts);
            setCategories(Array.from(allCategories));
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Función para refrescar la lista
    const onRefresh = () => {
        setRefreshing(true);
        loadUserData();
    };

    // Efectuar la búsqueda cuando cambia el query o la categoría
    useEffect(() => {
        filterProducts();
    }, [searchQuery, selectedCategory, products]);

    // Filtrar productos según la búsqueda y la categoría
    const filterProducts = () => {
        let filtered = [...products];

        // Filtrar por categoría
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(product => product.category === selectedCategory);
        }

        // Filtrar por texto de búsqueda
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(product =>
                product.product_name?.toLowerCase().includes(query) ||
                product.barcode?.toLowerCase().includes(query)
            );
        }

        setFilteredProducts(filtered);
    };

    // Renderizar mensaje cuando no hay dispositivos
    if (devices.length === 0 && !loading) {
        return (
            <View style={styles.container}>
                <Text style={styles.noDevicesText}>No tienes dispositivos emparejados</Text>
                <Text style={styles.noDevicesDescription}>
                    Escanea el código QR de tu dispositivo Ordinem para comenzar a ver tus productos.
                </Text>
                <TouchableOpacity
                    style={styles.scanButton}
                    onPress={() => navigation.navigate('QRScanner')}
                >
                    <Text style={styles.scanButtonText}>Escanear QR</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Barra de búsqueda */}
            <View style={styles.searchBarContainer}>
                <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar productos..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery !== '' && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => setSearchQuery('')}
                    >
                        <Ionicons name="close-circle" size={18} color="#999" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Filtro de categorías */}
            <View style={styles.categoriesContainer}>
                <FlatList
                    horizontal
                    data={categories}
                    keyExtractor={(item) => item}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.categoryButton,
                                selectedCategory === item && styles.selectedCategoryButton
                            ]}
                            onPress={() => setSelectedCategory(item)}
                        >
                            <Text
                                style={[
                                    styles.categoryButtonText,
                                    selectedCategory === item && styles.selectedCategoryText
                                ]}
                            >
                                {item === 'all' ? 'Todos' : item}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* Lista de productos */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6D9EBE" />
                    <Text style={styles.loadingText}>Cargando productos...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredProducts}
                    keyExtractor={(item) => `${item.deviceId}-${item.barcode}`}
                    renderItem={({ item }) => (
                        <ProductCard product={item} deviceId={item.deviceId} />
                    )}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#6D9EBE']}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="basket-outline" size={60} color="#ccc" />
                            <Text style={styles.emptyText}>
                                {searchQuery !== '' || selectedCategory !== 'all'
                                    ? 'No se encontraron productos con ese filtro'
                                    : 'No hay productos registrados'}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        padding: 16,
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 48,
        fontSize: 16,
    },
    clearButton: {
        padding: 6,
    },
    categoriesContainer: {
        marginBottom: 16,
    },
    categoryButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'white',
        marginRight: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    selectedCategoryButton: {
        backgroundColor: '#6D9EBE',
    },
    categoryButtonText: {
        color: '#666',
        fontWeight: '500',
    },
    selectedCategoryText: {
        color: 'white',
    },
    listContainer: {
        paddingBottom: 24,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#666',
        marginTop: 12,
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        marginTop: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 16,
    },
    noDevicesText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 12,
    },
    noDevicesDescription: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 40,
    },
    scanButton: {
        backgroundColor: '#6D9EBE',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
    },
    scanButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ProductList; 