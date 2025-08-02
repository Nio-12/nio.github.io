// Configuration for different environments
const config = {
  development: {
    apiUrl: 'http://localhost:3001',
    environment: 'development'
  },
  production: {
    apiUrl: 'https://nio-chatbot-backend-xxx.vercel.app', // Replace with your actual Vercel URL
    environment: 'production'
  }
};

// Auto-detect environment
const isProduction = window.location.hostname !== 'localhost' && 
                    window.location.hostname !== '127.0.0.1';

const currentConfig = isProduction ? config.production : config.development;

// Export for use in other files
window.appConfig = currentConfig; 