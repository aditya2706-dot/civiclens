const { GoogleGenAI, Type } = require('@google/genai');

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || 'dummy_key'
});

const analyzeImageGemini = async (imageBase64, mimeType) => {
    try {
        const prompt = `You are a civic issue analyzer for a 311-style city reporting app. 
        Analyze the provided image and generate a structured JSON response about the civic issue visible.
        Only consider issues like Litter, Open Dump, Pothole, Streetlight problems, or Sewage leaks.
        If it's none of those, categorize it as 'Other'.
        
        Provide the response strictly following this JSON structure, and nothing else:
        {
          "summary": "A 1-2 sentence description of the problem",
          "detectedObjects": ["list", "of", "relevant", "objects", "seen"],
          "suggestedCategory": "One of: Litter, Open Dump, Pothole, Streetlight, Sewage, Other",
          "estimatedSeverity": "One of: Low, Medium, High"
        }`;

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
                        estimatedSeverity: { type: Type.STRING }
                    },
                    required: ["summary", "detectedObjects", "suggestedCategory", "estimatedSeverity"]
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
        console.error("Gemini API Error:", error);
        throw new Error("Failed to analyze image with AI");
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
