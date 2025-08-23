/**
 * Test API endpoint for verifying server connection
 */

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Handle GET and POST requests
    if (req.method === 'GET' || req.method === 'POST') {
        const hasApiKey = !!process.env.GEMINI_API_KEY;
        
        return res.status(200).json({
            success: true,
            message: 'CheckVision API is running successfully',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            apiKeyConfigured: hasApiKey,
            version: '2.0.0'
        });
    }

    return res.status(405).json({ 
        error: 'Method not allowed' 
    });
}
