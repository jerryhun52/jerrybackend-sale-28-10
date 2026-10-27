// Hostinger Node.js Application Entry Point (ES Module compatible)
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

process.env.NODE_ENV = 'production';

const bundledServer = path.join(__dirname, 'dist', 'server.cjs');

if (fs.existsSync(bundledServer)) {
  require(bundledServer);
} else {
  console.error('[HOSTINGER ERROR] dist/server.cjs not found. Please run "npm run build" first.');
  process.exit(1);
}
