import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Switch,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { getUserData, signOut } from '../services/firebase';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [userPreferences, setUserPreferences] = useState({
        notifications_enabled: true,
        notification_threshold: 3,
        theme: 'light'
    });
    const [userData, setUserData] = useState(null);
    const auth = getAuth();
    const navigation = useNavigation();

    // Cargar datos del usuario al montar el componente
    useEffect(() => {
        loadUserData();
    }, []);

    // Función para cargar datos del usuario
    const loadUserData = async () => {
        try {
            setLoading(true);
            const currentUser = auth.currentUser;

            if (!currentUser) {
                setLoading(false);
                return;
            }

            // Obtener datos del usuario
            const data = await getUserData(currentUser.uid);
            setUserData(data);

            if (data && data.preferences) {
                setUserPreferences(data.preferences);
            }
        } catch (error) {
            console.error('Error al cargar datos del usuario:', error);
        } finally {
            setLoading(false);
        }
    };

    // Función para actualizar preferencias
    const updatePreference = async (key, value) => {
        try {
            const newPreferences = { ...userPreferences, [key]: value };
            setUserPreferences(newPreferences);

            // En un caso real, aquí también se actualizaría en Firebase
            // await updateUserPreferences(auth.currentUser.uid, newPreferences);

            // Si se cambia la configuración de notificaciones, actualizar permisos
            if (key === 'notifications_enabled') {
                if (value) {
                    await requestNotificationPermissions();
                }
            }
        } catch (error) {
            console.error(`Error al actualizar ${key}:`, error);
            // Restaurar valor anterior en caso de error
            setUserPreferences(prev => ({ ...prev }));
        }
    };

    // Solicitar permisos de notificaciones
    const requestNotificationPermissions = async () => {
        try {
            const { status } = await Notifications.requestPermissionsAsync();
            return status === 'granted';
        } catch (error) {
            console.log('Error al solicitar permisos de notificaciones:', error);
            return false;
        }
    };

    // Función para cerrar sesión
    const handleLogout = async () => {
        Alert.alert(
            'Cerrar sesión',
            '¿Estás seguro de que quieres cerrar sesión?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'Cerrar sesión',
                    onPress: async () => {
                        try {
                            await signOut();
                            // La navegación se maneja automáticamente en el AppNavigator
                        } catch (error) {
                            console.error('Error al cerrar sesión:', error);
                            Alert.alert('Error', 'No se pudo cerrar sesión');
                        }
                    },
                    style: 'destructive'
                }
            ]
        );
    };

    // Renderizar opciones de umbral de notificación
    const renderThresholdOptions = () => {
        const options = [1, 3, 5, 7];

        return (
            <View style={styles.thresholdOptions}>
                {options.map(days => (
                    <TouchableOpacity
                        key={days}
                        style={[
                            styles.thresholdOption,
                            userPreferences.notification_threshold === days && styles.selectedThreshold
                        ]}
                        onPress={() => updatePreference('notification_threshold', days)}
                    >
                        <Text
                            style={[
                                styles.thresholdText,
                                userPreferences.notification_threshold === days && styles.selectedThresholdText
                            ]}
                        >
                            {days} {days === 1 ? 'día' : 'días'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6D9EBE" />
                <Text style={styles.loadingText}>Cargando configuración...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Sección de perfil */}
            <View style={styles.profileSection}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                        {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                    </Text>
                </View>
                <Text style={styles.userName}>{userData?.name || 'Usuario'}</Text>
                <Text style={styles.userEmail}>{userData?.email || ''}</Text>
            </View>

            {/* Sección de notificaciones */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notificaciones</Text>

                <View style={styles.settingItem}>
                    <View style={styles.settingTextContainer}>
                        <Text style={styles.settingLabel}>Notificaciones push</Text>
                        <Text style={styles.settingDescription}>
                            Recibe alertas sobre productos próximos a caducar
                        </Text>
                    </View>
                    <Switch
                        value={userPreferences.notifications_enabled}
                        onValueChange={(value) => updatePreference('notifications_enabled', value)}
                        trackColor={{ false: '#D1D1D6', true: '#AED1E6' }}
                        thumbColor={userPreferences.notifications_enabled ? '#6D9EBE' : '#F4F3F4'}
                    />
                </View>

                {userPreferences.notifications_enabled && (
                    <View style={styles.settingItem}>
                        <View style={styles.settingTextContainer}>
                            <Text style={styles.settingLabel}>Umbral de notificación</Text>
                            <Text style={styles.settingDescription}>
                                Recibir alertas cuando un producto esté a punto de caducar
                            </Text>
                        </View>
                    </View>
                )}

                {userPreferences.notifications_enabled && renderThresholdOptions()}
            </View>

            {/* Sección de apariencia */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Apariencia</Text>

                <View style={styles.settingItem}>
                    <View style={styles.settingTextContainer}>
                        <Text style={styles.settingLabel}>Modo oscuro</Text>
                        <Text style={styles.settingDescription}>
                            Cambiar entre tema claro y oscuro
                        </Text>
                    </View>
                    <Switch
                        value={userPreferences.theme === 'dark'}
                        onValueChange={(value) => updatePreference('theme', value ? 'dark' : 'light')}
                        trackColor={{ false: '#D1D1D6', true: '#AED1E6' }}
                        thumbColor={userPreferences.theme === 'dark' ? '#6D9EBE' : '#F4F3F4'}
                    />
                </View>
            </View>

            {/* Sección de dispositivos */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dispositivos emparejados</Text>

                <TouchableOpacity
                    style={styles.deviceItem}
                    onPress={() => navigation.navigate('QRScanner')}
                >
                    <Ionicons name="add-circle" size={24} color="#6D9EBE" />
                    <Text style={styles.deviceText}>Añadir nuevo dispositivo</Text>
                </TouchableOpacity>

                {userData && userData.devices && Object.keys(userData.devices).length > 0 ? (
                    Object.keys(userData.devices)
                        .filter(deviceId => userData.devices[deviceId])
                        .map(deviceId => (
                            <View key={deviceId} style={styles.deviceItem}>
                                <Ionicons name="hardware-chip-outline" size={24} color="#666" />
                                <Text style={styles.deviceText}>{deviceId}</Text>
                            </View>
                        ))
                ) : (
                    <Text style={styles.noDevicesText}>
                        No tienes dispositivos emparejados
                    </Text>
                )}
            </View>

            {/* Sección de acciones */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cuenta</Text>

                <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={22} color="#FF5252" />
                    <Text style={styles.logoutText}>Cerrar sesión</Text>
                </TouchableOpacity>
            </View>

            {/* Información de la aplicación */}
            <View style={styles.appInfo}>
                <Text style={styles.versionText}>Ordinem v1.0.0</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
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
    profileSection: {
        backgroundColor: 'white',
        padding: 24,
        alignItems: 'center',
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#6D9EBE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
    },
    section: {
        backgroundColor: 'white',
        padding: 20,
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    settingTextContainer: {
        flex: 1,
        marginRight: 16,
    },
    settingLabel: {
        fontSize: 16,
        color: '#333',
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 14,
        color: '#666',
    },
    thresholdOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: 12,
    },
    thresholdOption: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        marginRight: 8,
    },
    selectedThreshold: {
        backgroundColor: '#6D9EBE',
    },
    thresholdText: {
        fontSize: 14,
        color: '#666',
    },
    selectedThresholdText: {
        color: 'white',
        fontWeight: '500',
    },
    deviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    deviceText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 12,
    },
    noDevicesText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 12,
        marginBottom: 4,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    logoutText: {
        fontSize: 16,
        color: '#FF5252',
        marginLeft: 12,
    },
    appInfo: {
        padding: 24,
        alignItems: 'center',
    },
    versionText: {
        fontSize: 14,
        color: '#999',
    },
});

export default Settings; 