import { initializeApp, getApps } from 'firebase/app';
import { 
    getAuth,
    connectAuthEmulator,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithCredential,
    GoogleAuthProvider,
    signInAnonymously as firebaseSignInAnonymously,
    sendEmailVerification,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { getDatabase, ref, set, get, update, onValue, connectDatabaseEmulator } from 'firebase/database';
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

// Inicializar Firebase solo una vez
let app;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}

// Obtener instancias de Auth y Database usando getAuth y getDatabase
const auth = getAuth(app);
const database = getDatabase(app);

// Exportar las instancias
export { app, auth, database };

// Funciones de autenticación
export const signInWithEmail = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const token = await user.getIdToken(true);
        const userData = {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            displayName: user.displayName,
            lastLoginAt: new Date().toISOString(),
            token: token
        };

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

        await sendEmailVerification(user);

        await set(ref(database, `users/${user.uid}`), {
            name: name,
            email: email,
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

export const signInWithGoogle = async (idToken) => {
    try {
        if (!idToken) {
            throw new Error('No se proporcionó un token de ID válido');
        }

        const credential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, credential);
        const user = userCredential.user;

        const token = await user.getIdToken(true);
        const userRef = ref(database, `users/${user.uid}`);
        const snapshot = await get(userRef);

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
        throw error;
    }
};

export const signInAnonymously = async () => {
    try {
        const userCredential = await firebaseSignInAnonymously(auth);
        const user = userCredential.user;

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

export const linkDevice = async (deviceId) => {
    try {
        if (!auth.currentUser) {
            throw new Error('Usuario no autenticado');
        }

        const userId = auth.currentUser.uid;
        await set(ref(database, `users/${userId}/devices/${deviceId}`), true);

        try {
            const deviceRef = ref(database, `ordinem/devices/${deviceId}`);
            const snapshot = await get(deviceRef);

            if (!snapshot.exists()) {
                const now = new Date().toISOString();
                await set(deviceRef, {
                    last_update: now,
                    products: {}
                });
            }
        } catch (deviceError) {
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

        if (deviceIds.length === 0) {
            return [];
        }

        const now = new Date().toISOString();

        for (const deviceId of deviceIds) {
            try {
                const deviceRef = ref(database, `ordinem/devices/${deviceId}`);
                const deviceSnapshot = await get(deviceRef);

                if (deviceSnapshot.exists()) {
                    const deviceData = deviceSnapshot.val();
                    const products = deviceData.products || {};

                    linkedDevices.push({
                        id: deviceId,
                        last_update: deviceData.last_update,
                        product_count: Object.keys(products).length
                    });
                } else {
                    linkedDevices.push({
                        id: deviceId,
                        last_update: now,
                        product_count: 0
                    });
                }
            } catch (deviceError) {
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
            return [];
        }
    } catch (error) {
        console.error('Error al obtener productos del dispositivo:', error);
        throw error;
    }
};

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

export const subscribeToDeviceNotifications = (callback) => {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) return null;

        const userDevicesRef = ref(database, `users/${userId}/devices`);
        const deviceListeners = [];

        const devicesListener = onValue(userDevicesRef, (snapshot) => {
            if (!snapshot.exists()) {
                callback([]);
                return;
            }

            deviceListeners.forEach(unsubscribe => unsubscribe());
            deviceListeners.length = 0;

            const deviceIds = Object.keys(snapshot.val());

            if (deviceIds.length === 0) {
                callback([]);
                return;
            }

            deviceIds.forEach(deviceId => {
                const deviceNotificationsRef = ref(database, `ordinem/devices/${deviceId}/notifications`);

                const deviceListener = onValue(deviceNotificationsRef, (notifSnapshot) => {
                    getAllNotificationsFromDevices(deviceIds).then(allNotifications => {
                        allNotifications.sort((a, b) => {
                            return new Date(b.created_at) - new Date(a.created_at);
                        });

                        callback(allNotifications);
                    });
                }, (error) => {
                    console.error(`Error en el listener de notificaciones para dispositivo ${deviceId}:`, error);
                });

                deviceListeners.push(deviceListener);
            });
        }, (error) => {
            console.error("Error en el listener de dispositivos:", error);
        });

        return () => {
            devicesListener();
            deviceListeners.forEach(unsubscribe => unsubscribe());
        };
    } catch (error) {
        console.error("Error al configurar la suscripción a notificaciones:", error);
        return null;
    }
};

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

export const verifyAndRefreshToken = async () => {
    try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedUser = await AsyncStorage.getItem('user_credential');

        if (!storedToken || !storedUser) {
            return null;
        }

        const user = auth.currentUser;
        if (!user) {
            try {
                const parsedUser = JSON.parse(storedUser);
                console.log('Usuario no autenticado. Intentando recuperar sesión.');
                return null;
            } catch (parseError) {
                console.error('Error al analizar datos de usuario almacenados:', parseError);
                return null;
            }
        }

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
        await AsyncStorage.multiRemove(['user_credential', 'userToken']);
        return null;
    }
};