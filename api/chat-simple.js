export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({ error: 'Missing message or sessionId' });
    }

    console.log(`💬 Processing message: ${message} for session: ${sessionId}`);

    // Simple response for testing
    const aiResponse = `Xin chào! Tôi là NiO Assistant. Bạn đã gửi: "${message}". Đây là phiên bản test của serverless function.`;

    res.status(200).json({ response: aiResponse });

  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
} 