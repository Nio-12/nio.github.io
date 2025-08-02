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

// Test production API (replace with your actual Vercel URL)
// testAPI('https://your-vercel-url.vercel.app/health'); 