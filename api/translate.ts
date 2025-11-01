import { GoogleGenAI, Type } from "@google/genai";

// Vercel Serverless Function handler for translation
export default async function handler(request, response) {
  // Only allow POST requests for this endpoint
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Only POST requests allowed' });
  }
  
  try {
    const { text, sourceLang, targetLang, speakerAName, speakerBName } = request.body;

    // Validate that required fields are present
    if (!text || !sourceLang || !targetLang) {
      return response.status(400).json({ message: 'Missing required fields in request body' });
    }
    
    // Securely initialize the AI client on the server using environment variables
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-2.5-flash';
    const originalSpeakerNames = [speakerAName, speakerBName].filter(name => name && name.trim() !== '');

    const prompt = `Translate the following dialogue from ${sourceLang} to ${targetLang}, preserving empty newlines. Also, provide a mapping of the original speaker names to their translated versions.
Original Speaker Names: ${JSON.stringify(originalSpeakerNames)}

Source Text:
"${text}"`;

    const result = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            temperature: 0.1,
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    translatedText: {
                        type: Type.STRING,
                        description: "The full translated dialogue, preserving the original formatting including speaker names and newlines."
                    },
                    speakerMapping: {
                        type: Type.OBJECT,
                        description: "An object mapping original speaker names to their translated versions.",
                        properties: {} // Allows for arbitrary key-value pairs
                    }
                },
                required: ["translatedText", "speakerMapping"]
            }
        }
    });
    
    const geminiResponseText = result.text;
    
    // Add a defensive check to ensure the response is not empty before parsing
    if (!geminiResponseText || geminiResponseText.trim() === '') {
        console.error('Error in /api/translate: Gemini returned an empty response.');
        return response.status(500).json({ message: 'Internal Server Error: Empty response from AI' });
    }
    
    // Parse the JSON string from Gemini before sending it back to the client
    const parsedResult = JSON.parse(geminiResponseText);

    // Return the successful response
    return response.status(200).json(parsedResult);

  } catch (error) {
    console.error('Error in /api/translate:', error);
    return response.status(500).json({ message: 'Internal Server Error' });
  }
}
