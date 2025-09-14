// Root index.js - Redirects to backend
// This file ensures compatibility with deployment platforms that expect index.js at root

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Transparent Fund Tracker Backend...');

// Start the backend server
const backendPath = join(__dirname, 'backend', 'index.js');
const child = spawn('node', [backendPath], {
    stdio: 'inherit',
    cwd: join(__dirname, 'backend')
});

child.on('error', (error) => {
    console.error('❌ Failed to start backend:', error);
    process.exit(1);
});

child.on('exit', (code) => {
    console.log(`Backend process exited with code ${code}`);
    process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    child.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down...');
    child.kill('SIGTERM');
});
