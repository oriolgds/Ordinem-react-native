import { initializeApp } from 'firebase/app';
import {
    getAuth,
    initializeAuth,
    getReactNativePersistence,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithCredential,
    GoogleAuthProvider,
    signInAnonymously as firebaseSignInAnonymously,
    sendEmailVerification,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { getDatabase, ref, set, get, update, onValue } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBMjLGzxH6OVDszHfEHGVS5N_SlsU9aDeA",
    authDomain: "ordinem-app.firebaseapp.com",
    databaseURL: "https://ordinem-app-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "ordinem-app",
    storageBucket: "ordinem-app.firebasestorage.app",
    messagingSenderId: "447748932648",
    appId: "1:447748932648:android:ed963e8484de7fb675611d"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Auth con persistencia para React Native
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

// Función para recargar la persistencia (ya no es necesaria pero se mantiene por compatibilidad)
export const reloadAuthPersistence = async () => {
    try {
        if (auth._persistenceManager) {
            await auth._persistenceManager.reload();
        }
        return true;
    } catch (error) {
        console.error('Error al recargar la persistencia:', error);
        throw error;
    }
};

// Inicializar Database
const database = getDatabase(app);

// Exportar las instancias de Firebase
export { app, auth, database };

// Funciones para interactuar con Firebase

// Autenticación de usuario
export const signInWithEmail = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Obtener un token fresco
        const token = await user.getIdToken(true);

        // Guardar solo datos no sensibles y el token
        const userData = {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            displayName: user.displayName,
            lastLoginAt: new Date().toISOString(),
            token: token
        };

        // Almacenar datos de sesión
        await AsyncStorage.setItem('user_credential', JSON.stringify(userData));
        await AsyncStorage.setItem('userToken', token);

        return user;
    } catch (error) {
        throw error;
    }
};

export const createUserWithEmail = async (email, password, name) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Enviar correo de verificación
        await sendEmailVerification(user);

        // Guardar información adicional del usuario
        await set(ref(database, `users/${user.uid}`), {
            name: name,
            email: email,
            devices: {},
            preferences: {
                notifications_enabled: true,
                notification_threshold: 3, // días por defecto
                theme: 'light'
            }
        });

        return user;
    } catch (error) {
        throw error;
    }
};

export const signInWithGoogle = async (idToken) => {
    try {
        console.log('Iniciando autenticación con Google, token recibido:', idToken ? 'Token válido' : 'Token no válido');

        if (!idToken) {
            throw new Error('No se proporcionó un token de ID válido');
        }

        // Crear credencial para Google
        const credential = GoogleAuthProvider.credential(idToken);

        // Iniciar sesión con las credenciales
        const userCredential = await signInWithCredential(auth, credential);
        const user = userCredential.user;

        console.log('Usuario autenticado con Firebase:', user);

        // Obtener un token fresco para sesión
        const token = await user.getIdToken(true);

        console.log('Token fresco obtenido:', token);

        // Comprobar si el usuario ya existe en la base de datos
        const userRef = ref(database, `users/${user.uid}`);
        const snapshot = await get(userRef);

        // Si el usuario no existe, guardamos su información
        if (!snapshot.exists()) {
            await set(userRef, {
                name: user.displayName || '',
                email: user.email || '',
                devices: {},
                preferences: {
                    notifications_enabled: true,
                    notification_threshold: 3,
                    theme: 'light'
                }
            });
        }

        // Guardar información adicional en AsyncStorage para persistencia adicional
        const userData = {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            displayName: user.displayName,
            token: token,
            lastLoginAt: new Date().toISOString()
        };

        await AsyncStorage.setItem('user_credential', JSON.stringify(userData));
        await AsyncStorage.setItem('userToken', token);

        return user;
    } catch (error) {
        console.error('Error en signInWithGoogle:', error.code, error.message);
        // Agregar información de depuración específica para errores de Google
        if (error.code === 'auth/invalid-credential') {
            console.error('Credencial inválida. El token podría haber expirado o ser incorrecto.');
        }
        throw error;
    }
};

export const signInAnonymously = async () => {
    try {
        const userCredential = await firebaseSignInAnonymously(auth);
        const user = userCredential.user;

        // Guardar información básica del usuario anónimo
        await set(ref(database, `users/${user.uid}`), {
            name: 'Usuario Anónimo',
            email: '',
            isAnonymous: true,
            devices: {},
            preferences: {
                notifications_enabled: true,
                notification_threshold: 3,
                theme: 'light'
            }
        });

        return user;
    } catch (error) {
        throw error;
    }
};

export const sendVerificationEmail = async (user) => {
    try {
        await sendEmailVerification(user);
        return true;
    } catch (error) {
        throw error;
    }
};

export const resetPassword = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
        return true;
    } catch (error) {
        throw error;
    }
};

export const signOut = async () => {
    try {
        await auth.signOut();
        // Limpiar todos los datos de sesión almacenados
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('user_credential');
    } catch (error) {
        throw error;
    }
};

// Operaciones de base de datos
export const getUserData = async (userId) => {
    try {
        const userRef = ref(database, `users/${userId}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            throw new Error("User data not found");
        }
    } catch (error) {
        throw error;
    }
};

export const getUserDevices = async (userId) => {
    try {
        const devicesRef = ref(database, `users/${userId}/devices`);
        const snapshot = await get(devicesRef);

        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            return {};
        }
    } catch (error) {
        throw error;
    }
};

export const pairDevice = async (userId, deviceId) => {
    try {
        await set(ref(database, `users/${userId}/devices/${deviceId}`), true);
        return true;
    } catch (error) {
        throw error;
    }
};

export const getProductFromCache = async (barcode) => {
    try {
        // Intentar obtener el producto de Firebase primero
        const db = getDatabase();
        const productRef = ref(db, `products/${barcode}`);
        const snapshot = await get(productRef);

        if (snapshot.exists()) {
            // Si existe en Firebase, devolvemos los datos
            return snapshot.val();
        } else {
            // Si no existe en Firebase, usamos el servicio de caché para consultar OpenFoodFacts
            const { fetchProductWithCache } = require('./cacheService');
            const productData = await fetchProductWithCache(barcode);

            if (productData && productData.product) {
                // Convertir los datos al formato esperado
                return {
                    barcode: barcode,
                    product_name: productData.product.product_name,
                    name: productData.product.product_name, // Duplicamos para asegurar compatibilidad
                    brand: productData.product.brands,
                    category: productData.product.categories_tags ?
                        getCategoryFromTags(productData.product.categories_tags) :
                        "Otros",
                    image_url: productData.product.image_url,
                    // Otros campos relevantes de OpenFoodFacts
                    source: productData.source
                };
            }
            return null;
        }
    } catch (error) {
        console.error("Error al obtener el producto de la caché:", error);
        return null;
    }
};

// Función auxiliar para extraer una categoría legible de las etiquetas de categorías
const getCategoryFromTags = (categoriesTags) => {
    // Mapeo de categorías principales
    const categoryMap = {
        'beverages': 'Bebidas',
        'snacks': 'Dulces y snacks',
        'dairy': 'Lácteos',
        'cereals': 'Cereales',
        'meat': 'Carnes',
        'fish': 'Pescados',
        'vegetables': 'Verduras',
        'fruits': 'Frutas',
        'breakfast': 'Desayunos',
        'condiments': 'Condimentos',
        'frozen': 'Congelados'
    };

    // Buscar la primera categoría reconocible
    for (const tag of categoriesTags) {
        for (const key in categoryMap) {
            if (tag.includes(key)) {
                return categoryMap[key];
            }
        }
    }

    return "Otros";
}

export const saveProductToCache = async (barcode, productData) => {
    try {
        if (!barcode || !productData) return false;

        const cacheData = {
            product: productData,
            cached_at: Date.now()
        };

        await set(ref(database, `product_cache/${barcode}`), cacheData);
        console.log(`Producto ${barcode} guardado en caché`);
        return true;
    } catch (error) {
        console.error('Error al guardar producto en caché:', error);
        return false;
    }
};

export const fetchProductWithCache = async (barcode) => {
    try {
        // Primero intentar obtener de la caché
        const cachedProduct = await getProductFromCache(barcode);

        if (cachedProduct) {
            return { product: cachedProduct, source: 'cache' };
        }

        // Si no está en caché, consultar la API
        console.log(`Consultando API para ${barcode}`);
        const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
        const data = await response.json();

        if (data.status === 1) {
            // Guardar en caché para futuras consultas
            await saveProductToCache(barcode, data.product);
            return { product: data.product, source: 'api' };
        } else {
            return { product: null, source: 'api', error: 'Producto no encontrado' };
        }
    } catch (error) {
        console.error('Error en fetchProductWithCache:', error);
        return { product: null, source: 'error', error: error.message };
    }
};

export const getUserNotifications = async (userId) => {
    try {
        const notificationsRef = ref(database, `notifications/${userId}`);
        const snapshot = await get(notificationsRef);

        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            return {};
        }
    } catch (error) {
        throw error;
    }
};

export const markNotificationAsRead = async (notificationId, deviceId) => {
    try {
        if (!deviceId) {
            console.error('Se requiere deviceId para marcar notificación como leída');
            return false;
        }

        const notificationRef = ref(database, `ordinem/devices/${deviceId}/notifications/${notificationId}`);
        await update(notificationRef, { read: 1 });
        return true;
    } catch (error) {
        console.error('Error al marcar notificación como leída:', error);
        throw error;
    }
};

export const deleteNotification = async (notificationId, deviceId) => {
    try {
        if (!deviceId) {
            console.error('Se requiere deviceId para eliminar notificación');
            return false;
        }

        const notificationRef = ref(database, `ordinem/devices/${deviceId}/notifications/${notificationId}`);
        await set(notificationRef, null);
        return true;
    } catch (error) {
        console.error('Error al eliminar notificación:', error);
        throw error;
    }
};

// Listener en tiempo real para notificaciones de dispositivos
export const subscribeToDeviceNotifications = (callback) => {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) return null;

        // Referencia a los dispositivos del usuario
        const userDevicesRef = ref(database, `users/${userId}/devices`);

        // Array para almacenar los listeners de los dispositivos (para poder limpiarlos)
        const deviceListeners = [];

        // Listener para cambios en la lista de dispositivos vinculados
        const devicesListener = onValue(userDevicesRef, (snapshot) => {
            if (!snapshot.exists()) {
                callback([]);
                return;
            }

            // Limpiar listeners anteriores de dispositivos
            deviceListeners.forEach(unsubscribe => unsubscribe());
            deviceListeners.length = 0;

            // Obtener IDs de dispositivos
            const deviceIds = Object.keys(snapshot.val());

            // Si no hay dispositivos, retornar array vacío
            if (deviceIds.length === 0) {
                callback([]);
                return;
            }

            // Configurar listeners para cada dispositivo
            deviceIds.forEach(deviceId => {
                const deviceNotificationsRef = ref(database, `ordinem/devices/${deviceId}/notifications`);

                // Crear un listener para este dispositivo específico
                const deviceListener = onValue(deviceNotificationsRef, (notifSnapshot) => {
                    console.log(`Cambios detectados en las notificaciones del dispositivo: ${deviceId}`);

                    // Recopilar todas las notificaciones de todos los dispositivos
                    getAllNotificationsFromDevices(deviceIds).then(allNotifications => {
                        // Ordenar por fecha de creación (más recientes primero)
                        allNotifications.sort((a, b) => {
                            return new Date(b.created_at) - new Date(a.created_at);
                        });

                        // Enviar las notificaciones actualizadas a través del callback
                        callback(allNotifications);
                    });
                }, (error) => {
                    console.error(`Error en el listener de notificaciones para dispositivo ${deviceId}:`, error);
                });

                // Guardar la función para cancelar este listener específico
                deviceListeners.push(deviceListener);
            });
        }, (error) => {
            console.error("Error en el listener de dispositivos:", error);
        });

        // Devolver una función que cancela todos los listeners
        return () => {
            console.log("Cancelando todos los listeners de notificaciones");
            devicesListener();
            deviceListeners.forEach(unsubscribe => unsubscribe());
        };
    } catch (error) {
        console.error("Error al configurar la suscripción a notificaciones:", error);
        return null;
    }
};

// Función auxiliar para obtener todas las notificaciones
const getAllNotificationsFromDevices = async (deviceIds) => {
    let allNotifications = [];

    for (const deviceId of deviceIds) {
        const deviceNotificationsRef = ref(database, `ordinem/devices/${deviceId}/notifications`);

        try {
            const notifSnapshot = await get(deviceNotificationsRef);
            if (notifSnapshot.exists()) {
                const notifObj = notifSnapshot.val();
                const deviceNotifications = Object.keys(notifObj).map(key => ({
                    id: key,
                    deviceId: deviceId,
                    ...notifObj[key],
                    read: notifObj[key].read === 1
                }));
                allNotifications = [...allNotifications, ...deviceNotifications];
            }
        } catch (error) {
            console.error(`Error al obtener notificaciones del dispositivo ${deviceId}:`, error);
        }
    }

    return allNotifications;
};

// Productos
export const getProducts = async () => {
    try {
        const userId = auth.currentUser.uid;
        const productsRef = ref(database, `users/${userId}/products`);
        const snapshot = await get(productsRef);

        if (snapshot.exists()) {
            const productsObj = snapshot.val();
            // Convertir el objeto en un array con IDs
            return Object.keys(productsObj).map(key => ({
                id: key,
                ...productsObj[key]
            }));
        } else {
            return [];
        }
    } catch (error) {
        console.error('Error al obtener productos:', error);
        throw error;
    }
};

export const getProduct = async (productId) => {
    try {
        const userId = auth.currentUser.uid;
        const productRef = ref(database, `users/${userId}/products/${productId}`);
        const snapshot = await get(productRef);

        if (snapshot.exists()) {
            return {
                id: productId,
                ...snapshot.val()
            };
        } else {
            throw new Error('Producto no encontrado');
        }
    } catch (error) {
        console.error('Error al obtener producto:', error);
        throw error;
    }
};

export const addProduct = async (productData) => {
    try {
        const userId = auth.currentUser.uid;
        const newProductRef = ref(database, `users/${userId}/products/${productData.id}`);
        await set(newProductRef, productData);
        return productData.id;
    } catch (error) {
        console.error('Error al añadir producto:', error);
        throw error;
    }
};

export const updateProduct = async (productId, productData) => {
    try {
        const userId = auth.currentUser.uid;
        const productRef = ref(database, `users/${userId}/products/${productId}`);
        await update(productRef, productData);
        return true;
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        throw error;
    }
};

export const deleteProduct = async (productId) => {
    try {
        const userId = auth.currentUser.uid;
        const productRef = ref(database, `users/${userId}/products/${productId}`);
        await set(productRef, null);
        return true;
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        throw error;
    }
};

// Notificaciones
export const getNotifications = async () => {
    try {
        const userId = auth.currentUser.uid;
        const notificationsRef = ref(database, `users/${userId}/notifications`);
        const snapshot = await get(notificationsRef);

        if (snapshot.exists()) {
            const notificationsObj = snapshot.val();
            // Convertir el objeto en un array con IDs
            return Object.keys(notificationsObj).map(key => ({
                id: key,
                ...notificationsObj[key]
            }));
        } else {
            return [];
        }
    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
        throw error;
    }
};

export const deleteUserNotification = async (notificationId) => {
    try {
        const userId = auth.currentUser.uid;
        const notificationRef = ref(database, `users/${userId}/notifications/${notificationId}`);
        await set(notificationRef, null);
        return true;
    } catch (error) {
        console.error('Error al eliminar notificación:', error);
        throw error;
    }
};

// Perfil de usuario
export const getUserProfile = async () => {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuario no autenticado');

        const userRef = ref(database, `users/${user.uid}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || snapshot.val().name,
                photoURL: user.photoURL,
                ...snapshot.val()
            };
        } else {
            return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL
            };
        }
    } catch (error) {
        console.error('Error al obtener perfil de usuario:', error);
        throw error;
    }
};

export const updateUserSettings = async (settingsData) => {
    try {
        const userId = auth.currentUser.uid;
        const settingsRef = ref(database, `users/${userId}/preferences`);
        await update(settingsRef, settingsData);
        return true;
    } catch (error) {
        console.error('Error al actualizar configuración:', error);
        throw error;
    }
};

// Categorías de productos
export const getProductCategories = async () => {
    return ['Alimentos', 'Bebidas', 'Limpieza', 'Otros'];
};

// Estadísticas
export const getProductStats = async () => {
    try {
        const products = await getProducts();

        const now = new Date();
        const expiringProducts = products.filter(p => {
            const expiryDate = new Date(p.expiryDate);
            const differenceInDays = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
            return differenceInDays <= 7 && differenceInDays >= 0;
        });

        const expiredProducts = products.filter(p => new Date(p.expiryDate) < now);

        return {
            total: products.length,
            expiring: expiringProducts.length,
            expired: expiredProducts.length,
            activeCategories: [...new Set(products.map(p => p.category))],
        };
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        throw error;
    }
};

export const linkDevice = async (deviceId) => {
    try {
        // Primero verificar que hay un usuario autenticado
        if (!auth.currentUser) {
            throw new Error('Usuario no autenticado');
        }

        const userId = auth.currentUser.uid;

        // Actualizar el vínculo en los datos del usuario directamente
        // Esto evita verificar el dispositivo primero, lo que puede causar errores de permiso
        await set(ref(database, `users/${userId}/devices/${deviceId}`), true);

        // Inicializar el dispositivo si no existe
        // Esta operación solo se realizará si tienes permisos para escribir en esta ruta
        try {
            const deviceRef = ref(database, `ordinem/devices/${deviceId}`);
            const snapshot = await get(deviceRef);

            if (!snapshot.exists()) {
                // Inicializar el dispositivo con datos básicos
                const now = new Date().toISOString();
                await set(deviceRef, {
                    last_update: now,
                    products: {}
                });
            }
        } catch (deviceError) {
            // Si no podemos acceder a la ruta del dispositivo, solo registramos el error
            // pero no interrumpimos el proceso, ya que el dispositivo puede estar gestionado
            // por otro sistema
            console.log('Nota: No se pudo verificar o inicializar el dispositivo:', deviceError.message);
        }

        return true;
    } catch (error) {
        console.error('Error al vincular dispositivo:', error);
        throw error;
    }
};

export const unlinkDevice = async (deviceId) => {
    try {
        const userId = auth.currentUser.uid;
        await set(ref(database, `users/${userId}/devices/${deviceId}`), null);
        return true;
    } catch (error) {
        console.error('Error al desvincular dispositivo:', error);
        throw error;
    }
};

export const getLinkedDevices = async () => {
    try {
        const userId = auth.currentUser.uid;
        const devicesRef = ref(database, `users/${userId}/devices`);
        const snapshot = await get(devicesRef);

        if (!snapshot.exists()) {
            return [];
        }

        const linkedDevices = [];
        const deviceIds = Object.keys(snapshot.val());

        // Si no hay dispositivos vinculados, devolver array vacío
        if (deviceIds.length === 0) {
            return [];
        }

        const now = new Date().toISOString();

        // Procesar cada dispositivo vinculado
        for (const deviceId of deviceIds) {
            try {
                // Intentar obtener información detallada del dispositivo
                const deviceRef = ref(database, `ordinem/devices/${deviceId}`);
                const deviceSnapshot = await get(deviceRef);

                if (deviceSnapshot.exists()) {
                    // Si podemos acceder a los datos del dispositivo, usar esa información
                    const deviceData = deviceSnapshot.val();
                    const products = deviceData.products || {};

                    linkedDevices.push({
                        id: deviceId,
                        last_update: deviceData.last_update,
                        product_count: Object.keys(products).length
                    });
                } else {
                    // Si el dispositivo no existe en la ruta ordinem/devices, crear info básica
                    linkedDevices.push({
                        id: deviceId,
                        last_update: now,
                        product_count: 0
                    });
                }
            } catch (deviceError) {
                // Si hay error de permisos, añadir el dispositivo con información básica
                console.log(`Nota: No se pudo acceder a los detalles del dispositivo ${deviceId}: ${deviceError.message}`);
                linkedDevices.push({
                    id: deviceId,
                    last_update: now,
                    product_count: 0
                });
            }
        }

        return linkedDevices;
    } catch (error) {
        console.error('Error al obtener dispositivos:', error);
        throw error;
    }
};

export const getDeviceProducts = async (deviceId) => {
    try {
        const deviceRef = ref(database, `ordinem/devices/${deviceId}/products`);
        try {
            const snapshot = await get(deviceRef);

            if (!snapshot.exists()) {
                return [];
            }

            const products = [];
            const productsData = snapshot.val();

            for (const [barcode, data] of Object.entries(productsData)) {
                products.push({
                    barcode,
                    product_name: data.product_name || data.name || `Producto ${barcode.slice(-4)}`,
                    brand: data.brand || "",
                    category: data.category || "Sin categoría",
                    expiry_date: data.expiry_date,
                    last_detected: data.last_detected,
                    image_url: data.image_url || ""
                });
            }

            return products;
        } catch (permissionError) {
            console.error(`Error de permisos al obtener productos del dispositivo ${deviceId}: ${permissionError.message}`);
            // Devolvemos un array vacío cuando no se puede acceder a los datos del dispositivo
            return [];
        }
    } catch (error) {
        console.error('Error al obtener productos del dispositivo:', error);
        throw error;
    }
};

// Función para verificar y renovar el token
export const verifyAndRefreshToken = async () => {
    try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedUser = await AsyncStorage.getItem('user_credential');

        if (!storedToken || !storedUser) {
            return null;
        }

        const user = auth.currentUser;
        if (!user) {
            // No podemos usar signInWithCustomToken con un ID token normal
            // En lugar de eso, intentamos cargar el usuario desde el almacenamiento
            try {
                const parsedUser = JSON.parse(storedUser);
                // Si el usuario tiene credenciales almacenadas, podemos intentar
                // iniciar sesión con el método adecuado según el tipo de autenticación
                console.log('Usuario no autenticado. Intentando recuperar sesión.');
                return null;
            } catch (parseError) {
                console.error('Error al analizar datos de usuario almacenados:', parseError);
                return null;
            }
        }

        // Verificar y renovar el token solo si hay un usuario autenticado
        try {
            const newToken = await user.getIdToken(true);
            await AsyncStorage.setItem('userToken', newToken);
            return user;
        } catch (tokenError) {
            console.error('Error al renovar token:', tokenError);
            return null;
        }
    } catch (error) {
        console.error('Error al verificar token:', error);
        // Limpiar datos almacenados solo si hay un error real
        await AsyncStorage.multiRemove(['user_credential', 'userToken']);
        return null;
    }
};