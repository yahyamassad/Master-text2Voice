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

    const prompt = `You are an expert translator. Your task is to translate dialogue from ${sourceLang} to ${targetLang}.

**CRITICAL INSTRUCTIONS:**
1.  **Preserve all formatting EXACTLY.** This includes speaker names, colons, and ALL newline characters.
2.  If the source text has an empty line between two lines of dialogue (a double newline), the translated text MUST also have an empty line in the same position. DO NOT collapse multiple newlines into one.

**TASK TO PERFORM:**
Translate the following dialogue from ${sourceLang} to ${targetLang}.
Return a JSON object with two keys: "translatedText" (the translated string) and "speakerMapping" (an array mapping original speaker names to translated ones).

Original Speaker Names: ${JSON.stringify(originalSpeakerNames)}

Source Text:
\`\`\`
${text}
\`\`\`
`;

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
                        description: "The full translated dialogue, preserving the original formatting including speaker names and all newlines (including empty lines)."
                    },
                    speakerMapping: {
                        type: Type.ARRAY,
                        description: "An array of objects mapping original speaker names to their translated versions.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                original: { type: Type.STRING, description: "The original speaker name." },
                                translated: { type: Type.STRING, description: "The translated speaker name." }
                            },
                            required: ["original", "translated"]
                        }
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
