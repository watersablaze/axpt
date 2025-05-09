import crypto from 'crypto';

// Load USER_SECRET_KEY from the environment
const ENCRYPTION_KEY_HEX = process.env.USER_SECRET_KEY;

if (!ENCRYPTION_KEY_HEX) {
  throw new Error(
    'USER_SECRET_KEY is not defined in the environment variables. Ensure it is a 64-character hexadecimal string.'
  );
}

// Convert the hex key into a Buffer
const ENCRYPTION_KEY = Buffer.from(ENCRYPTION_KEY_HEX, 'hex');

// Validate the length of the encryption key
if (ENCRYPTION_KEY.length !== 32) {
  throw new Error(
    'Invalid USER_SECRET_KEY: Ensure it is a 64-character hexadecimal string (32 bytes in length).'
  );
}

const IV_LENGTH = 16; // AES block size for initialization vector (IV)

/**
 * Encrypts a private key using AES-256-CBC.
 * @param {string} privateKey - The private key to encrypt.
 * @returns {{ encryptedData: string; iv: string }} - An object containing the encrypted data and IV.
 */
export function encryptPrivateKey(
  privateKey: string
): { encryptedData: string; iv: string } {
  const iv = crypto.randomBytes(IV_LENGTH); // Generate a random IV
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(privateKey, 'utf-8', 'hex');
  encrypted += cipher.final('hex');

  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'), // Return IV as a hex string
  };
}

/**
 * Decrypts an encrypted private key using AES-256-CBC.
 * @param {string} encryptedData - The encrypted private key.
 * @param {string} iv - The initialization vector (IV) used during encryption.
 * @returns {string} - The decrypted private key.
 */
export function decryptPrivateKey(
  encryptedData: string,
  iv: string
): string {
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    ENCRYPTION_KEY,
    Buffer.from(iv, 'hex') // Convert IV back to a Buffer
  );

  let decrypted = decipher.update(encryptedData, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');

  return decrypted;
}