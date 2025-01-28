import crypto from 'crypto';

// Load USER_SECRET_KEY from the environment
const ENCRYPTION_KEY_HEX = process.env.USER_SECRET_KEY || 'default_secret_key';

// Convert the hex key into a Buffer
const ENCRYPTION_KEY = Buffer.from(process.env.USER_SECRET_KEY || '', 'hex');
if (ENCRYPTION_KEY.length !== 32) {
  throw new Error('Invalid USER_SECRET_KEY: Ensure it is a 64-character hexadecimal string.');
}

// Validate encryption key length
if (ENCRYPTION_KEY.length !== 32) {
  console.error('USER_SECRET_KEY is invalid or not 32 bytes:', ENCRYPTION_KEY_HEX);
  throw new Error('Invalid USER_SECRET_KEY: Ensure it is a 64-character hexadecimal string.');
}

const IV_LENGTH = 16; // AES block size for initialization vector (IV)

/**
 * Encrypts a private key using AES-256.
 * @param {string} privateKey - The private key to encrypt.
 * @returns {object} - An object containing the encrypted data and IV.
 */
export function encryptPrivateKey(privateKey: string) {
  const iv = crypto.randomBytes(IV_LENGTH); // Generate random IV
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(privateKey, 'utf-8', 'hex');
  encrypted += cipher.final('hex');

  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'), // Store IV to use during decryption
  };
}

/**
 * Decrypts an encrypted private key.
 * @param {string} encryptedData - The encrypted private key.
 * @param {string} iv - The IV used during encryption.
 * @returns {string} - The decrypted private key.
 */
export function decryptPrivateKey(encryptedData: string, iv: string) {
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    ENCRYPTION_KEY,
    Buffer.from(iv, 'hex')
  );

  let decrypted = decipher.update(encryptedData, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');

  return decrypted;
}