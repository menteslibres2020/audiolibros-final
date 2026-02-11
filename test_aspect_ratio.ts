
import { GoogleGenAI } from "@google/genai";
import fs from 'node:fs';
import path from 'node:path';

// Manual .env loading
try {
    const envFiles = ['.env', '.env.local'];
    envFiles.forEach(file => {
        const envPath = path.resolve(process.cwd(), file);
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf-8');
            envContent.split(/\r?\n/).forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    console.log(`Found env key: ${key}`);
                    process.env[key] = match[2].trim();
                }
            });
        }
    });
} catch (e) {
    console.warn("Could not load .env file manually:", e);
}

const apiKey = process.env.VITE_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("No API_KEY found in .env");
    // process.exit(1); 
    // Don't exit here if we want to debug, but actually we need the key.
}

const ai = new GoogleGenAI({ apiKey: apiKey || "dummy" });

async function testGeneration(label: string, config: any, promptPrefix: string) {
    console.log(`\n--- Testing: ${label} ---`);
    try {
        const prompt = `${promptPrefix} A futuristic city with flying cars, cinematic lighting, 8k resolution.`;

        console.log("Model: gemini-2.5-flash-image");
        console.log("Config:", JSON.stringify(config));

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }]
            },
            config: config
        } as any);

        const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

        if (part) {
            console.log(`Success! Generated image type: ${part.inlineData.mimeType}`);
            // console.log(`Data length: ${part.inlineData.data.length}`);
        } else {
            console.log("No image data returned.");
            // console.log("Full response:", JSON.stringify(response, null, 2));
        }
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
    }
}

async function runTests() {
    if (!apiKey) return;

    // Test 1: Prompt Only
    await testGeneration("1. Prompt Only", {}, "[Format: Wide 16:9 landscape image].");

    // Test 2: Config aspectRatio (Undocumented attempt)
    await testGeneration("2. Config aspectRatio", { aspectRatio: "16:9" }, "");

    // Test 3: Response MIME Type (Maybe forcing mime type helps?)
    await testGeneration("3. Response MIME Type", { responseMimeType: "image/jpeg" }, "[Format: 16:9]");
}

runTests();
