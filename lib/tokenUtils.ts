import crypto from 'crypto';

/**
 * Loads the token secret from environment variables.
 * Provides a fallback for development but should always be set in production.
 */
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'default-dev-secret-key';

/**
 * Generates an HMAC SHA256 signature for a given token using the shared TOKEN_SECRET.
 * @param token - The token string to sign.
 * @returns The hexadecimal HMAC signature.
 */
export function generateTokenSignature(token: string): string {
  return crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(token)
    .digest('hex');
}

/**
 * Verifies whether the provided signature matches the generated signature for the given token.
 * Uses timing-safe comparison to prevent timing attacks.
 * @param token - The original token string.
 * @param signature - The signature to verify against.
 * @returns True if the signature is valid, false otherwise.
 */
export function verifyTokenSignature(token: string, signature: string): boolean {
  const expectedSignature = generateTokenSignature(token);

  const signatureBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  // Ensure both buffers are the same length to avoid timing attacks
  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}