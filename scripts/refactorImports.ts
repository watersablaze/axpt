import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '../');
const targetExtensions = ['.tsx', '.ts'];

function walkDir(dir: string, callback: (filePath: string) => void) {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath, callback);
    } else if (targetExtensions.includes(path.extname(fullPath))) {
      callback(fullPath);
    }
  });
}

function refactorImports(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Example replacement pattern:
  content = content.replace(
    /import\s+styles\s+from\s+['"]\.\.\/partner\/whitepaper\/Whitepaper\.module\.css['"]/g,
    `import styles from 'styles/Whitepaper.module.css'`
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated imports in: ${filePath}`);
  }
}

console.log('🔄 Starting import refactor...');
walkDir(projectRoot, refactorImports);
console.log('🎉 Refactor complete!');