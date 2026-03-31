// Fix opengradient-sdk missing ABI files
// The npm package doesn't include the abi/ directory from src/
const fs = require('fs');
const path = require('path');

const abiDir = path.join(__dirname, '..', 'node_modules', 'opengradient-sdk', 'dist', 'abi');

if (fs.existsSync(path.join(abiDir, 'inference.json'))) {
  console.log('[fix-og-sdk] ABI files already present, skipping.');
  process.exit(0);
}

fs.mkdirSync(abiDir, { recursive: true });

const srcDir = path.join(__dirname, '..', 'abi');
for (const file of ['inference.json', 'precompile.json']) {
  fs.copyFileSync(path.join(srcDir, file), path.join(abiDir, file));
}

console.log('[fix-og-sdk] Copied ABI files to opengradient-sdk/dist/abi/');
