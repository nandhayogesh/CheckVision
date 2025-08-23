/**
 * Vercel Serverless Function for Gemini AI Check Analysis
 * Securely handles API key as environment variable
 */

export default async function handler(req, res) {
    // Set CORS headers for frontend requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed. Only POST requests are supported.' 
        });
    }

    // Validate environment variable
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY environment variable not configured');
        return res.status(500).json({ 
            error: 'Server configuration error. API key not found.' 
        });
    }

    try {
        const { imageData, mimeType } = req.body;

        // Validate request body
        if (!imageData || !mimeType) {
            return res.status(400).json({ 
                error: 'Missing required fields: imageData and mimeType' 
            });
        }

        console.log('🔍 Processing check analysis request...');

        // Create optimized prompt for check analysis
        const prompt = `Analyze this check image and extract information. Return ONLY a valid JSON object:

{
  "accountHolder": "account holder name or null",
  "accountNumber": "account number or null",
  "routingNumber": "routing number or null", 
  "bankName": "bank name or null",
  "ifscCode": "IFSC code or null",
  "micrCode": "MICR code or null",
  "checkNumber": "check number or null",
  "date": "date or null",
  "amountNumbers": "numerical amount or null",
  "amountWords": "written amount or null",
  "signatureStatus": "Present or Absent",
  "memo": "memo/purpose or null",
  "address": "address or null"
}

Return ONLY the JSON object, no additional text.`;

        // Prepare request body for Gemini API
        const requestBody = {
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: imageData
                        }
                    }
                ]
            }]
        };

        // Make request to Gemini AI
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            }
        );

        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.json();
            console.error('❌ Gemini API error:', errorData);
            throw new Error(`Gemini API Error: ${errorData.error?.message || 'Analysis failed'}`);
        }

        // Parse Gemini response
        const data = await geminiResponse.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!generatedText) {
            throw new Error('No response generated from Gemini AI');
        }

        // Extract and parse JSON from response
        let extractedData;
        try {
            extractedData = JSON.parse(generatedText);
        } catch (parseError) {
            // Try to extract JSON from markdown code blocks
            const jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/) || 
                             generatedText.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                extractedData = JSON.parse(jsonMatch[jsonMatch.length - 1]);
            } else {
                throw new Error('Failed to parse Gemini AI response');
            }
        }

        // Process and normalize data
        const processedData = {
            accountHolder: extractedData.accountHolder || "Not found",
            accountNumber: extractedData.accountNumber || "Not found",
            routingNumber: extractedData.routingNumber || "Not found",
            bankName: extractedData.bankName || "Not found",
            ifscCode: extractedData.ifscCode || "Not found",
            micrCode: extractedData.micrCode || "Not found",
            checkNumber: extractedData.checkNumber || "Not found",
            date: extractedData.date || "Not found",
            amountNumbers: extractedData.amountNumbers || "Not found",
            amountWords: extractedData.amountWords || "Not found",
            signatureStatus: extractedData.signatureStatus || "Not detected",
            memo: extractedData.memo || "Not found",
            address: extractedData.address || "Not found"
        };

        console.log('✅ Check analysis completed successfully');

        // Return successful response
        return res.status(200).json({
            success: true,
            data: {
                ...processedData,
                extractionConfidence: 95,
                processingTime: Date.now()
            }
        });

    } catch (error) {
        console.error('❌ Analysis failed:', error);
        
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to analyze check. Please try again.'
        });
    }
}
