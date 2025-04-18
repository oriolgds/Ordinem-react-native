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
    getReactNativePersistence
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

// Inicializar Auth con persistencia
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
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

        // Verificar si el email está verificado
        if (!user.emailVerified) {
            throw { code: 'auth/email-not-verified', message: 'Por favor, verifica tu correo electrónico antes de iniciar sesión.' };
        }

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
        await AsyncStorage.removeItem('user');
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

export const markNotificationAsRead = async (userId, notificationId) => {
    try {
        await update(ref(database, `notifications/${userId}/${notificationId}`), {
            read: true
        });
        return true;
    } catch (error) {
        throw error;
    }
}; 