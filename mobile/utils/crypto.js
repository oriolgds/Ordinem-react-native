import CryptoJS from 'crypto-js';

// Clave de cifrado del archivo .env
const ENCRYPTION_KEY = 'K7mP9$vL2@nQ5&xR8!jW3*cYhB43M6nP8';

/**
 * Cifra un objeto usando AES-256-CBC
 * @param {Object} data - Datos a cifrar
 * @returns {string} - Texto cifrado en formato base64
 */
export const encryptData = (data) => {
    try {
        const jsonString = JSON.stringify(data);
        const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
        return encrypted;
    } catch (error) {
        console.error('Error al cifrar los datos:', error);
        throw error;
    }
};

/**
 * Descifra un texto cifrado usando AES-256-CBC
 * @param {string} encryptedText - Texto cifrado en formato base64
 * @returns {Object} - Objeto descifrado
 */
export const decryptData = (encryptedText) => {
    try {
        const decrypted = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
        const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Error al descifrar los datos:', error);
        throw error;
    }
};

/**
 * Genera un código QR cifrado para emparejar dispositivos
 * @param {string} deviceId - ID del dispositivo a emparejar
 * @returns {string} - Texto cifrado para el código QR
 */
export const generatePairingQR = (deviceId) => {
    const data = {
        deviceId,
        timestamp: Date.now(),
        type: 'pairing'
    };

    return encryptData(data);
};

/**
 * Valida y descifra un código QR de emparejamiento
 * @param {string} qrData - Datos del código QR escaneado
 * @returns {Object|null} - Objeto con los datos del QR o null si es inválido
 */
export const validatePairingQR = (qrData) => {
    try {
        const decrypted = decryptData(qrData);

        // Verificar que es un QR de emparejamiento
        if (decrypted.type !== 'pairing') {
            return null;
        }

        // Verificar que no haya expirado (validez de 1 hora)
        const expirationTime = 60 * 60 * 1000; // 1 hora en milisegundos
        if (Date.now() - decrypted.timestamp > expirationTime) {
            return null;
        }

        return decrypted;
    } catch (error) {
        console.error('Error al validar el código QR:', error);
        return null;
    }
}; 