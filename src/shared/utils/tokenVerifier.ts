// 📁 app/src/lib/utils/tokenVerifier.ts

export interface TokenVerificationResult {
  success: boolean;
  partner?: string;
  tier?: string;
  docs?: string[];
  error?: string;
}

export async function verifyTokenClient(token: string): Promise<TokenVerificationResult> {
  try {
    const res = await fetch('/api/partner/verify-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.error('❌ Client-side token verification failed:', err);
    return { success: false, error: 'Request failed' };
  }
}