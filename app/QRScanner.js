import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { pairDevice } from '../services/firebase';
import { getAuth } from 'firebase/auth';

const QRScanner = () => {
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();
    const auth = getAuth();

    useEffect(() => {
        const getCameraPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        };

        getCameraPermissions();
    }, []);

    const handleBarCodeScanned = async ({ data }) => {
        if (scanned || loading) return;

        try {
            setScanned(true);
            setLoading(true);

            // El QR contiene directamente el ID del dispositivo
            await pairDevice(auth.currentUser.uid, data);

            Alert.alert(
                'Éxito',
                'Dispositivo vinculado correctamente',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error('Error al vincular dispositivo:', error);
            Alert.alert('Error', 'No se pudo vincular el dispositivo');
            setScanned(false);
        } finally {
            setLoading(false);
        }
    };

    if (hasPermission === null) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Solicitando permiso de cámara...</Text>
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Sin acceso a la cámara</Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.buttonText}>Volver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.scanner}
                onBarcodeScanned={handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
            >
                <View style={styles.overlay}>
                    <View style={styles.scannerFrame} />
                    <Text style={styles.instructions}>
                        Escanea el código QR del dispositivo para vincularlo
                    </Text>
                    {loading && (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>Vinculando dispositivo...</Text>
                        </View>
                    )}
                </View>
            </CameraView>
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