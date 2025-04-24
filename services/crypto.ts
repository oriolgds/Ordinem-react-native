import CryptoJS from "crypto-js";

const KEY = "K7mP9$vL2@nQ5&xR8!jW3*cYhB43M6nP8";

export const decryptDeviceData = (encryptedData: string): string | null => {
  try {
    // Decodificar Base64
    const rawData = CryptoJS.enc.Base64.parse(encryptedData);

    // Extraer IV (primeros 16 bytes)
    const iv = CryptoJS.lib.WordArray.create(rawData.words.slice(0, 4));
    const encrypted = CryptoJS.lib.WordArray.create(rawData.words.slice(4));

    // Descifrar usando AES-256-CBC
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: encrypted },
      CryptoJS.enc.Utf8.parse(KEY),
      { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
    );

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Error decrypting data:", error);
    return null;
  }
};
