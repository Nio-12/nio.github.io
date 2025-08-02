// Test script for API endpoints
const testAPI = async (url) => {
  try {
    console.log(`🔍 Testing: ${url}`);
    const response = await fetch(url);
    const data = await response.json();
    console.log(`✅ Success:`, data);
    return true;
  } catch (error) {
    console.log(`❌ Error:`, error.message);
    return false;
  }
};

// Test local API
testAPI('http://localhost:3001/health');

// Test Vercel API
testAPI('https://nio-github-io.vercel.app/health'); 