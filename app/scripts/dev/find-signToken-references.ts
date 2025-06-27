// scripts/dev/find-signToken-references.ts
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const TARGETS = ['signToken', 'signToken.ts'];
const IGNORED_DIRS = ['node_modules', '.git', 'logs', 'dist', 'build'];

function shouldIgnore(filePath: string) {
  return IGNORED_DIRS.some(dir => filePath.includes(`${path.sep}${dir}${path.sep}`));
}

function searchDir(dir: string, matches: string[] = []) {
  const entries = fs.readdirSync(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);

    if (shouldIgnore(fullPath)) continue;

    if (fs.statSync(fullPath).isDirectory()) {
      searchDir(fullPath, matches);
    } else {
      const content = fs.readFileSync(fullPath, 'utf-8');
      for (const target of TARGETS) {
        if (content.includes(target)) {
          matches.push(fullPath);
          break;
        }
      }
    }
  }

  return matches;
}

const results = searchDir(ROOT);

console.log(`\n🔍 Found ${results.length} references to '${TARGETS.join("' or '")}'\n`);
for (const file of results) {
  console.log(`• ${file.replace(`${ROOT}${path.sep}`, '')}`);
}

if (results.length === 0) {
  console.log('✅ No references found. You are clean!');
}