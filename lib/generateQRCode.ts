import QRCode from 'qrcode';
import { createCanvas, loadImage } from 'canvas';
import { writeFile } from 'fs/promises';

interface QRCodeOptions {
  width?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
  outputFilePath?: string; // ✅ New: Optional path to save PNG
}

export async function generateQRCode(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const {
    width = 300,
    margin = 2,
    darkColor = '#ffffff',
    lightColor = '#000000',
    outputFilePath,
  } = options;

  try {
    if (outputFilePath) {
      const canvas = createCanvas(width, width);
      await QRCode.toCanvas(canvas, text, {
        margin,
        color: {
          dark: darkColor,
          light: lightColor,
        },
      });

      const buffer = canvas.toBuffer('image/png');
      await writeFile(outputFilePath, buffer);
      console.log(`✅ Saved QR code to: ${outputFilePath}`);
    }

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