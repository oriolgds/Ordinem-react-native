import React, { useState } from 'react';
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
    Alert
} from 'react-native';
import { signInWithEmail, signInWithGoogle, signInAnonymously, resetPassword } from '../services/firebase';
import { useNavigation, useRouter } from '@react-navigation/native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';

// Registrar el redireccionamiento para autenticación web
WebBrowser.maybeCompleteAuthSession();

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const navigation = useNavigation();
    const router = useRouter();

    // Configuración de autenticación con Google
    const [request, response, promptAsync] = Google.useAuthRequest({
        expoClientId: '447748932648-a1r4j0tukmc7cfd1pbdg2tav9hl6aqic.apps.googleusercontent.com',
        androidClientId: '447748932648-a1r4j0tukmc7cfd1pbdg2tav9hl6aqic.apps.googleusercontent.com',
        webClientId: '447748932648-a1r4j0tukmc7cfd1pbdg2tav9hl6aqic.apps.googleusercontent.com',
    });

    // Manejar la respuesta de Google
    React.useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            handleGoogleSignIn(id_token);
        }
    }, [response]);

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
            router.replace('/');
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

    // Iniciar sesión con Google
    const handleGoogleSignIn = async (idToken) => {
        try {
            setLoading(true);
            await signInWithGoogle(idToken);
            // La navegación se maneja automáticamente en el AppNavigator
        } catch (error) {
            console.error('Error al iniciar sesión con Google:', error);
            Alert.alert('Error de autenticación', 'No se pudo iniciar sesión con Google');
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

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.inner}>
                    <View style={styles.logoContainer}>
                        <Ionicons name="cube" size={80} color="#6D9EBE" style={styles.logo} />
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

                        <TouchableOpacity
                            style={styles.googleButton}
                            onPress={() => promptAsync()}
                            disabled={loading}
                        >
                            <Ionicons name="logo-google" size={24} color="#DB4437" style={styles.googleIcon} />
                            <Text style={styles.googleButtonText}>Continuar con Google</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.anonymousButton}
                            onPress={handleAnonymousSignIn}
                            disabled={loading}
                        >
                            <Ionicons name="person-outline" size={22} color="#555" style={styles.anonymousIcon} />
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
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
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
        marginVertical: 20,
    },
    separator: {
        flex: 1,
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    separatorText: {
        marginHorizontal: 10,
        color: '#888',
        fontSize: 14,
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
    },
    anonymousIcon: {
        marginRight: 10,
    },
    anonymousButtonText: {
        fontSize: 16,
        color: '#555',
        fontWeight: '500',
    },
});

export default Login; 