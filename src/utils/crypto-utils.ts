import crypto from 'crypto';

// AES Encryption Function
export const encryptPrivateKey = (privateKey: string, secretKey: string) => {
  const algorithm = 'aes-256-cbc';
  const iv = crypto.randomBytes(16); // Initialization vector (IV)
  const cipher = crypto.createCipheriv(algorithm, crypto.scryptSync(secretKey, 'salt', 32), iv);

  const encrypted = Buffer.concat([cipher.update(privateKey, 'utf8'), cipher.final()]);

  // Return IV + Encrypted Data (needed for decryption)
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted.toString('hex'),
  };
};

// AES Decryption Function
export const decryptPrivateKey = (encryptedData: string, iv: string, secretKey: string) => {
  const algorithm = 'aes-256-cbc';
  const decipher = crypto.createDecipheriv(
    algorithm,
    crypto.scryptSync(secretKey, 'salt', 32),
    Buffer.from(iv, 'hex')
  );

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedData, 'hex')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8'); // Decrypted private key as plain text
};