import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importar pantallas
import Login from '../app/Login';
import Register from '../app/Register';
import ProductList from '../app/ProductList';
import ProductDetails from '../app/ProductDetails';
import QRScanner from '../app/QRScanner';
import Notifications from '../app/Notifications';
import Settings from '../app/Settings';

// Crear navegadores
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Navegador principal (tabs)
const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Products') {
                        iconName = focused ? 'ios-list' : 'ios-list-outline';
                    } else if (route.name === 'Scanner') {
                        iconName = focused ? 'qr-code' : 'qr-code-outline';
                    } else if (route.name === 'Notifications') {
                        iconName = focused ? 'notifications' : 'notifications-outline';
                    } else if (route.name === 'Settings') {
                        iconName = focused ? 'settings' : 'settings-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#6D9EBE',
                tabBarInactiveTintColor: 'gray',
                tabBarStyle: {
                    borderTopWidth: 0,
                    elevation: 10,
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                },
                headerStyle: {
                    backgroundColor: 'white',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                },
                headerTitleStyle: {
                    color: '#333',
                    fontWeight: '600',
                },
            })}
        >
            <Tab.Screen
                name="Products"
                component={ProductList}
                options={{
                    title: 'Mis Productos',
                    headerTitleAlign: 'center'
                }}
            />
            <Tab.Screen
                name="Scanner"
                component={QRScanner}
                options={{
                    title: 'Escanear QR',
                    headerTitleAlign: 'center'
                }}
            />
            <Tab.Screen
                name="Notifications"
                component={Notifications}
                options={{
                    title: 'Notificaciones',
                    headerTitleAlign: 'center'
                }}
            />
            <Tab.Screen
                name="Settings"
                component={Settings}
                options={{
                    title: 'Ajustes',
                    headerTitleAlign: 'center'
                }}
            />
        </Tab.Navigator>
    );
};

// Navegador principal de la aplicación
const AppNavigator = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState(null);
    const auth = getAuth();

    // Verificar si el usuario está autenticado al cargar la aplicación
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            try {
                if (user) {
                    // Usuario autenticado
                    const token = await user.getIdToken();
                    await AsyncStorage.setItem('userToken', token);
                    setUserToken(token);
                } else {
                    // Usuario no autenticado
                    await AsyncStorage.removeItem('userToken');
                    setUserToken(null);
                }
            } catch (e) {
                console.error("Error al cargar la sesión:", e);
            } finally {
                setIsLoading(false);
            }
        });

        // Limpiar suscripción al desmontar
        return unsubscribeAuth;
    }, []);

    // Mostrar pantalla de carga mientras se verifica la autenticación
    if (isLoading) {
        return null; // Aquí podríamos mostrar un splash screen en el futuro
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    cardStyle: { backgroundColor: 'white' }
                }}
            >
                {userToken ? (
                    // Rutas para usuarios autenticados
                    <>
                        <Stack.Screen name="Main" component={MainTabNavigator} />
                        <Stack.Screen
                            name="ProductDetails"
                            component={ProductDetails}
                            options={{
                                headerShown: true,
                                title: 'Detalles del Producto',
                                headerTitleAlign: 'center',
                                headerBackTitleVisible: false,
                                headerTintColor: '#6D9EBE',
                                headerStyle: {
                                    backgroundColor: 'white',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 2,
                                    elevation: 1,
                                }
                            }}
                        />
                    </>
                ) : (
                    // Rutas para usuarios no autenticados
                    <>
                        <Stack.Screen name="Login" component={Login} />
                        <Stack.Screen name="Register" component={Register} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator; 