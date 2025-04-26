import QRCode from 'qrcode';

/**
 * Options for customizing QR code generation.
 */
interface QRCodeOptions {
  width?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
}

/**
 * Generates a QR code Data URL for a given text (usually a link).
 *
 * @param text - The URL or string to encode into a QR code.
 * @param options - Optional customization for size and colors.
 * @returns A Promise that resolves to the Data URL of the QR code image.
 */
export async function generateQRCode(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const {
    width = 200,                       // Default width
    margin = 2,                        // Default margin
    darkColor = '#000000',             // Default QR dot color
    lightColor = '#ffffff',            // Default background color
  } = options;

  try {
    const qrDataURL = await QRCode.toDataURL(text, {
      width,
      margin,
      color: {
        dark: darkColor,
        light: lightColor,
      },
    });
    return qrDataURL;
  } catch (error) {
    console.error('❌ Failed to generate QR code:', error);
    throw new Error('QR code generation failed.');
  }
}