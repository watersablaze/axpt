// lib/qrHelper.ts
import QRCode from 'qrcode';

export async function generateQRCode(data: string): Promise<string> {
  try {
    const qrBase64 = await QRCode.toDataURL(data);
    return qrBase64; // This is a data:image/png;base64,... string
  } catch (error) {
    console.error('Error generating QR Code:', error);
    throw new Error('Failed to generate QR Code');
  }
}