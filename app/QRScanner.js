import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Camera } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { validatePairingQR } from '../utils/crypto';
import { pairDevice } from '../services/firebase';
import { getAuth } from 'firebase/auth';

const QRScanner = () => {
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();
    const auth = getAuth();

    // Solicitar permiso de cámara al montar el componente
    useEffect(() => {
        const getCameraPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        };

        getCameraPermissions();
    }, []);

    // Manejar el escaneo de códigos QR
    const handleBarCodeScanned = async ({ type, data }) => {
        try {
            setScanned(true);
            setLoading(true);

            // Validar que el código QR sea válido para emparejamiento
            const decodedData = validatePairingQR(data);

            if (!decodedData) {
                Alert.alert(
                    'Código inválido',
                    'El código QR no es válido o ha expirado.',
                    [{ text: 'OK', onPress: () => setScanned(false) }]
                );
                setLoading(false);
                return;
            }

            // Obtener el usuario actual
            const currentUser = auth.currentUser;
            if (!currentUser) {
                Alert.alert(
                    'Error de autenticación',
                    'Debes iniciar sesión para emparejar dispositivos.',
                    [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
                );
                setLoading(false);
                return;
            }

            // Emparejar el dispositivo con el usuario
            await pairDevice(currentUser.uid, decodedData.deviceId);

            // Mostrar mensaje de éxito
            Alert.alert(
                'Dispositivo emparejado',
                'El dispositivo ha sido emparejado correctamente.',
                [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
            );

        } catch (error) {
            console.error('Error al emparejar dispositivo:', error);
            Alert.alert(
                'Error',
                'Ocurrió un error al emparejar el dispositivo.',
                [{ text: 'OK', onPress: () => setScanned(false) }]
            );
        } finally {
            setLoading(false);
        }
    };

    // Renderizar mensaje según el estado de permisos
    if (hasPermission === null) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Solicitando permisos de cámara...</Text>
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>No hay acceso a la cámara</Text>
                <Text style={styles.description}>
                    Para escanear códigos QR, debes permitir el acceso a la cámara.
                </Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => Camera.requestCameraPermissionsAsync()}
                >
                    <Text style={styles.buttonText}>Solicitar permisos</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Camera
                style={styles.scanner}
                onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                barCodeScannerSettings={{
                    barCodeTypes: ['qr'],
                }}
            />

            <View style={styles.overlay}>
                <View style={styles.scannerFrame} />
                <Text style={styles.instructions}>
                    Escanea el código QR de tu dispositivo Ordinem para emparejarlo.
                </Text>
            </View>

            {scanned && !loading && (
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => setScanned(false)}
                >
                    <Text style={styles.buttonText}>Escanear otro código</Text>
                </TouchableOpacity>
            )}

            {loading && (
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Emparejando dispositivo...</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanner: {
        ...StyleSheet.absoluteFillObject,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: '#6D9EBE',
        borderRadius: 16,
        backgroundColor: 'transparent',
    },
    instructions: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
        marginHorizontal: 40,
    },
    text: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    description: {
        color: 'white',
        fontSize: 14,
        textAlign: 'center',
        marginHorizontal: 40,
        marginBottom: 30,
    },
    button: {
        backgroundColor: '#6D9EBE',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        marginTop: 40,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        position: 'absolute',
        bottom: 40,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
    },
    loadingText: {
        color: 'white',
        fontSize: 16,
    },
});

export default QRScanner; 