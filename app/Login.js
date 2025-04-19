import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Alert,
    ScrollView
} from 'react-native';
import { signInWithEmail, signInWithGoogle, signInAnonymously, resetPassword } from '../services/firebase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

// Función para detectar si estamos en Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Importación condicional de Google SignIn
let GoogleSignin;
let GoogleSigninButton;
let statusCodes;

// Solo importamos la biblioteca si NO estamos en Expo Go
if (!isExpoGo) {
    try {
        const GoogleSignInModule = require('@react-native-google-signin/google-signin');
        GoogleSignin = GoogleSignInModule.GoogleSignin;
        GoogleSigninButton = GoogleSignInModule.GoogleSigninButton;
        statusCodes = GoogleSignInModule.statusCodes;
    } catch (error) {
        console.warn('Google SignIn no está disponible', error);
    }
}

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const router = useRouter();

    // Configuración de Google Sign-In si está disponible
    useEffect(() => {
        if (GoogleSignin && !isExpoGo) {
            GoogleSignin.configure({
                webClientId: '447748932648-a1r4j0tukmc7cfd1pbdg2tav9hl6aqic.apps.googleusercontent.com',
                offlineAccess: true,
                scopes: ['profile', 'email']
            });
        }
    }, []);

    // Validar formulario
    const validateForm = () => {
        let isValid = true;
        const newErrors = {};

        if (!email.trim()) {
            newErrors.email = 'El email es obligatorio';
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email inválido';
            isValid = false;
        }

        if (!password) {
            newErrors.password = 'La contraseña es obligatoria';
            isValid = false;
        } else if (password.length < 6) {
            newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    // Manejar el envío del formulario
    const handleLogin = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            await signInWithEmail(email, password);
            router.replace('/(tabs)/products');
        } catch (error) {
            console.error('Error al iniciar sesión:', error);

            let errorMessage = 'Ocurrió un error al iniciar sesión';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = 'Email o contraseña incorrectos';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Demasiados intentos fallidos. Intenta más tarde';
            } else if (error.code === 'auth/email-not-verified') {
                errorMessage = 'Por favor, verifica tu correo electrónico antes de iniciar sesión';
            }

            Alert.alert('Error de autenticación', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Iniciar sesión con Google - adaptado para funcionar en cualquier entorno
    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);
            
            // Si estamos en Expo Go, mostramos un mensaje
            if (isExpoGo) {
                Alert.alert(
                    'No disponible en Expo Go',
                    'El inicio de sesión con Google no está disponible en Expo Go. Por favor, utiliza un Development Build para probar esta funcionalidad.',
                    [{ text: 'Entendido' }]
                );
                return;
            }
            
            // Si Google SignIn está disponible, lo usamos
            if (GoogleSignin) {
                await GoogleSignin.hasPlayServices();
                const userInfo = await GoogleSignin.signIn();
                
                // Pasar el idToken a Firebase para autenticar
                if (userInfo.idToken) {
                    await signInWithGoogle(userInfo.idToken);
                    router.replace('/(tabs)/products');
                } else {
                    throw new Error('No se pudo obtener el token de ID');
                }
            } else {
                throw new Error('Google SignIn no está disponible');
            }
        } catch (error) {
            console.error('Error al iniciar sesión con Google:', error);
            
            let errorMessage = 'No se pudo iniciar sesión con Google';
            if (GoogleSignin && statusCodes) {
                if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                    errorMessage = 'Inicio de sesión cancelado';
                } else if (error.code === statusCodes.IN_PROGRESS) {
                    errorMessage = 'Inicio de sesión en progreso';
                } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                    errorMessage = 'Google Play Services no está disponible';
                }
            }
            
            Alert.alert('Error de autenticación', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Iniciar sesión como anónimo
    const handleAnonymousSignIn = async () => {
        try {
            setLoading(true);
            await signInAnonymously();
            router.replace('/(tabs)/products');
        } catch (error) {
            console.error('Error al iniciar sesión como anónimo:', error);
            Alert.alert('Error de autenticación', 'No se pudo iniciar sesión como anónimo');
        } finally {
            setLoading(false);
        }
    };

    // Manejar el olvido de contraseña
    const handleForgotPassword = async () => {
        if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
            Alert.alert(
                'Email requerido',
                'Por favor, introduce un email válido para restablecer tu contraseña'
            );
            return;
        }

        try {
            setLoading(true);
            await resetPassword(email);
            Alert.alert(
                'Restablecimiento de contraseña',
                'Se ha enviado un correo electrónico con instrucciones para restablecer tu contraseña'
            );
        } catch (error) {
            console.error('Error al restablecer contraseña:', error);
            let errorMessage = 'No se pudo enviar el correo de restablecimiento';
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No existe ninguna cuenta con este email';
            }
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Renderizar botón de Google según el entorno
    const renderGoogleButton = () => {
        if (isExpoGo || !GoogleSigninButton) {
            // Botón personalizado para Expo Go
            return (
                <TouchableOpacity
                    style={styles.googleButton}
                    onPress={handleGoogleSignIn}
                    disabled={loading}
                >
                    <Ionicons name="logo-google" size={24} color="#DB4437" style={styles.googleIcon} />
                    <Text style={styles.googleButtonText}>Continuar con Google</Text>
                </TouchableOpacity>
            );
        } else {
            // Botón nativo para Development Build
            return (
                <GoogleSigninButton
                    style={styles.googleSigninButton}
                    size={GoogleSigninButton.Size.Wide}
                    color={GoogleSigninButton.Color.Light}
                    onPress={handleGoogleSignIn}
                    disabled={loading}
                />
            );
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.inner}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('@/assets/images/ordinem-logo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                            <Text style={styles.title}>Ordinem</Text>
                            <Text style={styles.subtitle}>Sistema de gestión de productos</Text>
                        </View>

                        <View style={styles.formContainer}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput
                                    style={[styles.input, errors.email && styles.inputError]}
                                    placeholder="tu.email@ejemplo.com"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                {errors.email && (
                                    <Text style={styles.errorText}>{errors.email}</Text>
                                )}
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Contraseña</Text>
                                <TextInput
                                    style={[styles.input, errors.password && styles.inputError]}
                                    placeholder="Tu contraseña"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                                {errors.password && (
                                    <Text style={styles.errorText}>{errors.password}</Text>
                                )}
                                <TouchableOpacity
                                    style={styles.forgotPasswordLink}
                                    onPress={handleForgotPassword}
                                >
                                    <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={styles.loginButton}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                                )}
                            </TouchableOpacity>

                            <View style={styles.separatorContainer}>
                                <View style={styles.separator} />
                                <Text style={styles.separatorText}>O</Text>
                                <View style={styles.separator} />
                            </View>

                            {renderGoogleButton()}

                            <TouchableOpacity
                                style={styles.anonymousButton}
                                onPress={handleAnonymousSignIn}
                                disabled={loading}
                            >
                                <Ionicons name="person-outline" size={24} color="#555" style={styles.socialIcon} />
                                <Text style={styles.anonymousButtonText}>Continuar como anónimo</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.registerLink}
                                onPress={() => router.push('/register')}
                            >
                                <Text style={styles.registerText}>
                                    ¿No tienes cuenta? <Text style={styles.registerTextBold}>Regístrate</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    scrollContent: {
        flexGrow: 1,
    },
    inner: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    formContainer: {
        width: '100%',
        paddingHorizontal: 20,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#555',
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#F9F9F9',
    },
    inputError: {
        borderColor: '#FF5252',
    },
    errorText: {
        color: '#FF5252',
        fontSize: 12,
        marginTop: 4,
    },
    loginButton: {
        backgroundColor: '#6D9EBE',
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#6D9EBE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    loginButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    registerLink: {
        marginTop: 24,
        alignItems: 'center',
    },
    registerText: {
        color: '#666',
        fontSize: 14,
    },
    registerTextBold: {
        fontWeight: 'bold',
        color: '#6D9EBE',
    },
    forgotPasswordLink: {
        alignSelf: 'flex-end',
        marginTop: 8,
    },
    forgotPasswordText: {
        color: '#6D9EBE',
        fontSize: 14,
    },
    separatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    separator: {
        flex: 1,
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    separatorText: {
        marginHorizontal: 8,
        color: '#888',
        fontSize: 14,
    },
    socialButtonsContainer: {
        width: '100%',
        marginTop: 20,
    },
    socialIcon: {
        marginRight: 10,
    },
    socialButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
    googleSigninButton: {
        width: '100%',
        height: 48,
        marginVertical: 8,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingVertical: 12,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    googleIcon: {
        marginRight: 10,
    },
    googleButtonText: {
        fontSize: 16,
        color: '#444',
        fontWeight: '500',
    },
    anonymousButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        paddingVertical: 12,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    anonymousButtonText: {
        fontSize: 16,
        color: '#444',
        fontWeight: '500',
    },
});

export default Login; 