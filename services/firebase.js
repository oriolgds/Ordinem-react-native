import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithCredential,
    GoogleAuthProvider,
    signInAnonymously as firebaseSignInAnonymously,
    sendEmailVerification,
    sendPasswordResetEmail,
    initializeAuth,
    getReactNativePersistence,
    setPersistence,
    browserLocalPersistence
} from 'firebase/auth';
import { getDatabase, ref, set, get, update } from 'firebase/database';
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

// Inicializar Auth con persistencia asegurando que funcione en React Native
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

// Asegurar que la persistencia se aplica correctamente
setPersistence(auth, browserLocalPersistence)
    .then(() => {
        console.log('Persistencia configurada correctamente');
    })
    .catch((error) => {
        console.error('Error configurando persistencia:', error);
    });

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

        // Guardar los datos de usuario de forma más robusta
        const userData = {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            displayName: user.displayName,
            lastLoginAt: new Date().toISOString()
        };

        await AsyncStorage.setItem('user_credential', JSON.stringify(userData));
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
        // Crear credencial para Google
        const credential = GoogleAuthProvider.credential(idToken);

        // Iniciar sesión con las credenciales
        const userCredential = await signInWithCredential(auth, credential);
        const user = userCredential.user;

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
        await AsyncStorage.setItem('user_credential', JSON.stringify({
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            displayName: user.displayName,
        }));

        return user;
    } catch (error) {
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

export const getDeviceProducts = async (deviceId) => {
    try {
        const productsRef = ref(database, `devices/${deviceId}/products`);
        const snapshot = await get(productsRef);

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
        const productRef = ref(database, `product_cache/${barcode}`);
        const snapshot = await get(productRef);

        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            return null;
        }
    } catch (error) {
        throw error;
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

export const markNotificationAsRead = async (notificationId) => {
    try {
        const userId = auth.currentUser.uid;
        const notificationRef = ref(database, `users/${userId}/notifications/${notificationId}`);
        await update(notificationRef, { read: true });
        return true;
    } catch (error) {
        console.error('Error al marcar notificación como leída:', error);
        throw error;
    }
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

export const deleteNotification = async (notificationId) => {
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

export const linkDevice = async (deviceId: string) => {
    try {
        const userId = auth.currentUser.uid;
        const deviceRef = ref(database, `ordinem/devices/${deviceId}`);
        const snapshot = await get(deviceRef);

        if (!snapshot.exists()) {
            throw new Error('Dispositivo no encontrado');
        }

        // Vincular dispositivo al usuario
        await set(ref(database, `users/${userId}/devices/${deviceId}`), true);
        return true;
    } catch (error) {
        console.error('Error al vincular dispositivo:', error);
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

        for (const deviceId of deviceIds) {
            const deviceRef = ref(database, `ordinem/devices/${deviceId}`);
            const deviceSnapshot = await get(deviceRef);
            if (deviceSnapshot.exists()) {
                linkedDevices.push({
                    id: deviceId,
                    ...deviceSnapshot.val()
                });
            }
        }

        return linkedDevices;
    } catch (error) {
        console.error('Error al obtener dispositivos:', error);
        throw error;
    }
};