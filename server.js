/**
 * Production Server Entry Point
 * Used by Hostinger, cPanel, VPS, Passenger, and cloud hosting platforms
 * which look for a root 'server.js' entry file.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distServerPath = path.join(__dirname, 'dist', 'server.cjs');

async function launch() {
  // If dist/server.cjs is missing, automatically trigger build
  if (!fs.existsSync(distServerPath)) {
    console.log('[FLOW COIN] Pre-built server bundle not found. Building project...');
    try {
      execSync('npm run build', { stdio: 'inherit' });
    } catch (err) {
      console.error('[FLOW COIN] Build execution failed:', err);
      process.exit(1);
    }
  }

  // Import the compiled CommonJS server bundle
  const serverUrl = pathToFileURL(distServerPath).href;
  await import(serverUrl);
}

launch().catch((err) => {
  console.error('[FLOW COIN] Server failed to start:', err);
  process.exit(1);
});
