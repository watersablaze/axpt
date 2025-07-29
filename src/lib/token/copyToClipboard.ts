// 📄 app/src/lib/token/copyToClipboard.ts

import clipboard from 'clipboardy';

export function copyToClipboard(content: string) {
  try {
    clipboard.writeSync(content);
    console.log('📋 Token copied to clipboard!');
  } catch {
    console.log('⚠️ Could not copy to clipboard.');
  }
}