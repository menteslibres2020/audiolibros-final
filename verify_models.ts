
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY;
if (!apiKey) {
    console.error("No API_KEY found");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function listModels() {
    try {
        console.log("Listing models...");
        const response = await ai.models.list();
        console.log("Models found:");
        // The response structure might be paged, let's treat it carefully
        if (response && response.models) {
            response.models.forEach((m: any) => {
                if (m.name.includes('gemini') || m.name.includes('imagen')) {
                    console.log(`- ${m.name} (Supported methods: ${m.supportedGenerationMethods})`);
                }
            });
        } else {
            console.log("No models property in response", response);
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
