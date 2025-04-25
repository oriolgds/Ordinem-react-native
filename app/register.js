import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Alert,
    ScrollView,
    Image
} from 'react-native';
import { createUserWithEmail, signInWithGoogle, signInAnonymously } from '../services/firebase';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';

// Registrar el redireccionamiento para autenticación web
WebBrowser.maybeCompleteAuthSession();

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const router = useRouter();
    const { authenticated, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && authenticated) {
            router.replace('/(tabs)/products');
        }
    }, [authenticated, authLoading]);

    // Si está cargando la autenticación, mostrar loading
    if (authLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#6D9EBE" />
            </View>
        );
    }

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

        if (!name.trim()) {
            newErrors.name = 'El nombre es obligatorio';
            isValid = false;
        }

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

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Confirma tu contraseña';
            isValid = false;
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    // Manejar el envío del formulario
    const handleRegister = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            await createUserWithEmail(email, password, name);
            Alert.alert(
                "Verificación de correo electrónico",
                "Se ha enviado un correo de verificación a tu dirección de email. Por favor, verifica tu cuenta antes de iniciar sesión.",
                [
                    { text: "OK", onPress: () => router.replace('/') }
                ]
            );
        } catch (error) {
            console.error('Error al registrar usuario:', error);

            let errorMessage = 'Ocurrió un error al registrar';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Este email ya está registrado';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Email inválido';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'La contraseña es demasiado débil';
            }

            Alert.alert('Error de registro', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Iniciar sesión con Google
    const handleGoogleSignIn = async (idToken) => {
        try {
            setLoading(true);
            await signInWithGoogle(idToken);
            router.replace('/');
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

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.inner}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../assets/images/ordinem-logo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                            <Text style={styles.title}>Crear cuenta</Text>
                            <Text style={styles.subtitle}>Únete a Ordinem para gestionar tus productos</Text>
                        </View>

                        <View style={styles.formContainer}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Nombre</Text>
                                <TextInput
                                    style={[styles.input, errors.name && styles.inputError]}
                                    placeholder="Tu nombre"
                                    value={name}
                                    onChangeText={setName}
                                    autoCorrect={false}
                                />
                                {errors.name && (
                                    <Text style={styles.errorText}>{errors.name}</Text>
                                )}
                            </View>

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
                                    placeholder="Contraseña (mínimo 6 caracteres)"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                                {errors.password && (
                                    <Text style={styles.errorText}>{errors.password}</Text>
                                )}
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Confirmar contraseña</Text>
                                <TextInput
                                    style={[styles.input, errors.confirmPassword && styles.inputError]}
                                    placeholder="Repite tu contraseña"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                />
                                {errors.confirmPassword && (
                                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                                )}
                            </View>

                            <TouchableOpacity
                                style={styles.registerButton}
                                onPress={handleRegister}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text style={styles.registerButtonText}>Registrarse</Text>
                                )}
                            </TouchableOpacity>


                            <TouchableOpacity
                                style={styles.loginLink}
                                onPress={() => router.replace('/')}
                            >
                                <Text style={styles.loginText}>
                                    ¿Ya tienes cuenta? <Text style={styles.loginTextBold}>Inicia sesión</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
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
        marginTop: 20,
        marginBottom: 30,
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
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
        marginBottom: 16,
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
    registerButton: {
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
    registerButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    loginLink: {
        marginTop: 24,
        alignItems: 'center',
        marginBottom: 20,
    },
    loginText: {
        color: '#666',
        fontSize: 14,
    },
    loginTextBold: {
        fontWeight: 'bold',
        color: '#6D9EBE',
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
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#DDD',
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    googleIcon: {
        width: 24,
        height: 24,
        marginRight: 10,
    },
    googleButtonText: {
        color: '#555',
        fontSize: 16,
        fontWeight: '500',
    },
    anonymousButton: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    anonymousButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
});

export default Register;