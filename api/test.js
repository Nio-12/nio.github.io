export default function handler(req, res) {
  res.status(200).json({ 
    message: 'Hello from Vercel serverless function!',
    timestamp: new Date().toISOString()
  });
} 