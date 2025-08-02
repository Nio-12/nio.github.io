// Configuration for different environments
const config = {
  development: {
    apiUrl: 'http://localhost:3001',
    environment: 'development'
  },
  production: {
    // TODO: Replace with your actual Vercel URL from dashboard
    // Example: https://nio-chatbot-backend-abc123.vercel.app
    apiUrl: 'https://nio-chatbot-backend-production.up.railway.app', // Temporary URL - replace with actual Vercel URL
    environment: 'production'
  }
};

// Auto-detect environment
const isProduction = window.location.hostname !== 'localhost' && 
                    window.location.hostname !== '127.0.0.1';

const currentConfig = isProduction ? config.production : config.development;

// Export for use in other files
window.appConfig = currentConfig;

// Debug: Log current configuration
console.log('🔧 App Config:', currentConfig);
console.log('🌐 Current hostname:', window.location.hostname);
console.log('📡 API URL:', currentConfig.apiUrl); 