const { GoogleGenAI, Type } = require('@google/genai');

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || 'dummy_key'
});

const analyzeImageGemini = async (imageBase64, mimeType, addressContext = '', detectedWard = null, location = null) => {
    try {
        let prompt = `You are a professional civic issue analyzer for a city reporting application. Your job is to strictly validate and categorize photos of infrastructure problems.
        
        STRICT VALIDATION RULES:
        1. ONLY accept photos of PUBLIC CIVIC INFRASTRUCTURE issues.
        2. ACCEPTABLE CATEGORIES: Litter, Open Dump (Garbage pile), Pothole (Road damage), Streetlight (Broken/Dark), Sewage (Leaks/Flow), or General Infrastructure (Broken public benches, damaged sidewalks).
        3. REJECT IF: The photo is of a private interior (home floor, bedroom), personal items (furniture, electronics), pets, people, selfies, screenshots, or any non-infrastructure object.
        4. REJECT IF: The photo is a meme, stock image, or computer screen.

        GEOGRAPHIC IDENTIFICATION:
        If "Ward Context" is provided, use it for "suggestedWard".
        If "Ward Context" is NOT provided, use your internal knowledge of the provided GPS coordinates and image landmarks to identify the specific Ward Name or Local Area Name (e.g., "Shivaji Park, Alwar" or "Connaught Place, Delhi").

        RESPONSE PARAMETERS:
        - "isGenuine": Set to false if the photo is NOT a public civic infrastructure issue.
        - "fraudReason": If isGenuine is false, explain why (e.g., "Photo appears to be of a private residence floor, which is not a civic issue").
        - "suggestedCategory": Choose exactly one: Litter, Open Dump, Pothole, Streetlight, Sewage, Infrastructure.
        
        Provide the response strictly following this JSON structure:
        {
          "summary": "1-2 sentence description of the problem",
          "detectedObjects": ["list", "of", "relevant", "objects"],
          "suggestedCategory": "String category name",
          "estimatedSeverity": "Low, Medium, or High",
          "suggestedWard": "String or Unknown",
          "isGenuine": boolean,
          "fraudReason": "string explanation"
        }`;

        let context = '';
        if (addressContext) {
            context += `\nLOCATION CONTEXT: The photo was taken at "${addressContext}". Use this to refine the "suggestedWard" if possible.`;
        }
        if (detectedWard) {
            context += `\nWARD CONTEXT (Polygons): Precise mapping shows this is in "${detectedWard}". Please set "suggestedWard" to this value exactly.`;
        } else if (location && location.lat) {
            context += `\nGPS CONTEXT: Coordinates are Lat: ${location.lat}, Lng: ${location.lng}. Please identify the most likely municipal ward or descriptive area name for these coordinates.`;
        }

        if (!addressContext && !detectedWard && !location) {
            prompt += `\n\nFor "suggestedWard", return "Unknown".`;
        } else {
            prompt += context;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [
                prompt,
                {
                    inlineData: {
                        data: imageBase64,
                        mimeType: mimeType
                    }
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        detectedObjects: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        suggestedCategory: { type: Type.STRING },
                        estimatedSeverity: { type: Type.STRING },
                        suggestedWard: { type: Type.STRING },
                        isGenuine: { type: Type.BOOLEAN },
                        fraudReason: { type: Type.STRING }
                    },
                    required: ["summary", "detectedObjects", "suggestedCategory", "estimatedSeverity", "suggestedWard", "isGenuine", "fraudReason"]
                },
            }
        });

        const text = response.text;
        const parsed = JSON.parse(text);

        return {
            ...parsed,
            department: getDepartmentForCategory(parsed.suggestedCategory)
        };

    } catch (error) {
        console.error("Gemini API Error details:", error.response || error);
        throw new Error(error.message || "Failed to analyze image with AI");
    }
};

const getDepartmentForCategory = (category) => {
    const routing = {
        'Sanitation': 'sanitation authority',
        'Open Dump': 'sanitation authority',
        'Litter': 'sanitation authority',
        'Pothole': 'road department',
        'Streetlight': 'electricity department',
        'Sewage': 'water and sewage board',
        'Other': 'general civic administration'
    };
    return routing[category] || routing['Other'];
};

module.exports = {
    analyzeImageGemini,
    getDepartmentForCategory,
    translateText
};

async function translateText(text, targetLanguage = 'Hindi') {
    try {
        const prompt = `You are a professional translator. Translate the following civic issue report text to ${targetLanguage}. Keep technical terms and proper nouns (like road names, area names) as is. Return ONLY the translated text, nothing else.\n\nText to translate:\n"${text}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt
        });

        // Extract text from response candidates
        const translated = response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        return translated || text;
    } catch (error) {
        console.error('Translation error:', error.message);
        throw new Error('Translation failed');
    }
}
