#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

const aliases = {
  "@": "src",
  "@/lib": "src/lib",
  "@/abi": "src/abi",
};

console.log("🔍 Verifying Path Alias Resolution:");
Object.entries(aliases).forEach(([alias, target]) => {
  const resolvedPath = path.resolve(__dirname, target);
  const exists = fs.existsSync(resolvedPath);
  console.log(`${alias} → ${resolvedPath} ${exists ? "✅ Exists" : "❌ Missing"}`);
});