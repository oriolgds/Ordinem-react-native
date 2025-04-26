import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getLinkedDevices, unlinkDevice, getDeviceProducts } from '@/services/firebase';

interface Device {
  id: string;
  last_update: string;
  product_count: number;
}

interface Product {
  barcode: string;
  expiry_date: string;
  last_detected: string;
}

export default function DevicesScreen() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const linkedDevices = await getLinkedDevices();
      setDevices(linkedDevices);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los dispositivos');
    } finally {
      setLoading(false);
    }
  };

  const handleDevicePress = async (deviceId: string) => {
    try {
      setSelectedDevice(deviceId);
      const deviceProducts = await getDeviceProducts(deviceId);
      setProducts(deviceProducts);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los productos del dispositivo');
    }
  };

  const handleUnlinkDevice = async (deviceId: string) => {
    Alert.alert(
      'Desvincular dispositivo',
      '¿Estás seguro de que quieres desvincular este dispositivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desvincular',
          style: 'destructive',
          onPress: async () => {
            try {
              await unlinkDevice(deviceId);
              setDevices(devices.filter(d => d.id !== deviceId));
              if (selectedDevice === deviceId) {
                setSelectedDevice(null);
                setProducts([]);
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo desvincular el dispositivo');
            }
          }
        }
      ]
    );
  };

  const renderDeviceItem = ({ item }: { item: Device }) => (
    <TouchableOpacity 
      style={[styles.deviceCard, selectedDevice === item.id && styles.selectedDeviceCard]}
      onPress={() => handleDevicePress(item.id)}
      onLongPress={() => handleUnlinkDevice(item.id)}
    >
      <View style={styles.deviceInfo}>
        <Ionicons 
          name={selectedDevice === item.id ? "cube" : "cube-outline"} 
          size={24} 
          color="#6D9EBE" 
        />
        <View style={styles.deviceDetails}>
          <Text style={styles.deviceName}>Dispositivo {item.id}</Text>
          <Text style={styles.deviceId}>ID: {item.id}</Text>
          <Text style={styles.lastUpdate}>
            Última actualización: {new Date(item.last_update).toLocaleString()}
          </Text>
          <Text style={styles.productCount}>
            Productos detectados: {item.product_count}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <Text style={styles.productBarcode}>Código: {item.barcode}</Text>
      <Text style={styles.productExpiry}>Caducidad: {item.expiry_date}</Text>
      <Text style={styles.productLastSeen}>
        Última detección: {new Date(item.last_detected).toLocaleString()}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6D9EBE" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={() => router.push('/pair-device')}>
        <Ionicons name="add-circle-outline" size={24} color="#6D9EBE" />
        <Text style={styles.addButtonText}>Añadir nuevo dispositivo</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Dispositivos vinculados</Text>
      {devices.length > 0 ? (
        <>
          <FlatList
            data={devices}
            renderItem={renderDeviceItem}
            keyExtractor={item => item.id}
            style={styles.deviceList}
          />
          {selectedDevice && (
            <>
              <Text style={styles.sectionTitle}>Productos detectados</Text>
              <FlatList
                data={products}
                renderItem={renderProductItem}
                keyExtractor={item => item.barcode}
                style={styles.productList}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No hay productos detectados</Text>
                }
              />
            </>
          )}
        </>
      ) : (
        <Text style={styles.emptyText}>No hay dispositivos vinculados</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#6D9EBE',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 16,
  },
  deviceList: {
    maxHeight: '40%',
  },
  productList: {
    flex: 1,
  },
  deviceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedDeviceCard: {
    borderColor: '#6D9EBE',
    borderWidth: 2,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceDetails: {
    marginLeft: 12,
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  deviceId: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  lastUpdate: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  productCount: {
    fontSize: 12,
    color: '#6D9EBE',
    marginTop: 4,
    fontWeight: '500',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  productBarcode: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  productExpiry: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  productLastSeen: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 24,
    fontSize: 16,
  },
});
