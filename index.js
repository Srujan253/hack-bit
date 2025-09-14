// Simple entry point that starts the backend
import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendPath = join(__dirname, 'backend');

console.log('🚀 Starting Transparent Fund Tracker Backend...');

try {
    // Change to backend directory and start the server
    process.chdir(backendPath);
    execSync('npm start', { stdio: 'inherit' });
} catch (error) {
    console.error('❌ Failed to start backend:', error.message);
    process.exit(1);
}
