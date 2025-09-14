// Simple entry point that installs dependencies and starts the backend
import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendPath = join(__dirname, 'backend');

console.log('🚀 Starting Transparent Fund Tracker Backend...');

try {
    // Change to backend directory
    process.chdir(backendPath);
    
    // Check if node_modules exists, if not install dependencies
    if (!existsSync('node_modules')) {
        console.log('📦 Installing backend dependencies...');
        execSync('npm install', { stdio: 'inherit' });
    }
    
    // Start the server
    console.log('🌟 Starting backend server...');
    execSync('npm start', { stdio: 'inherit' });
} catch (error) {
    console.error('❌ Failed to start backend:', error.message);
    process.exit(1);
}
