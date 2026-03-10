const { GoogleGenAI, Type } = require('@google/genai');

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || 'dummy_key'
});

const analyzeImageGemini = async (imageBase64, mimeType, addressContext = '') => {
    try {
        let prompt = `You are a civic issue analyzer for a 311-style city reporting app. 
        Analyze the provided image and generate a structured JSON response about the civic issue visible.
        Only consider issues like Litter, Open Dump, Pothole, Streetlight problems, or Sewage leaks.
        If it's none of those, categorize it as 'Other'.
        
        CRITICAL FRAUD CHECK: Is this a real, genuine photo taken live, or does it look like a downloaded stock image, a meme, or a computer screen capture? If it looks fake or unrelated, set "isGenuine" to false and briefly explain why in "fraudReason".
        
        Provide the response strictly following this JSON structure, and nothing else:
        {
          "summary": "A 1-2 sentence description of the problem",
          "detectedObjects": ["list", "of", "relevant", "objects", "seen"],
          "suggestedCategory": "One of: Litter, Open Dump, Pothole, Streetlight, Sewage, Other",
          "estimatedSeverity": "One of: Low, Medium, High",
          "suggestedWard": "String or Unknown",
          "isGenuine": true or false,
          "fraudReason": "string explanation if fake, otherwise empty string"
        }`;

        if (addressContext) {
            prompt += `\n\nAdditionally, the image was taken at this address in India: "${addressContext}". Based on this address, predict the specific Nagar Nigam Ward name or number (e.g. 'Ward 42', 'Civil Lines Ward'). If you cannot determine the specific ward, return the locality name. Put this prediction in the "suggestedWard" field.`;
        } else {
            prompt += `\n\nFor "suggestedWard", return "Unknown".`;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
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
    getDepartmentForCategory
};
