import { Resend } from 'resend';

/**
 * Preserve the existing Resend interface without constructing
 * an outbound provider during module evaluation.
 *
 * Delivery requires a configured API key when first used.
 */
let provider: Resend | undefined;

function getResendProvider(): Resend {
  if (provider) return provider;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is required for email delivery');
  }

  provider = new Resend(apiKey);
  return provider;
}

export const resend: Resend = new Proxy({} as Resend, {
  get(_target, property) {
    const client = getResendProvider();
    return Reflect.get(client, property, client);
  },
});
