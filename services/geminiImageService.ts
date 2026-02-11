
import { GoogleGenAI } from "@google/genai";
import { AspectRatio, VisualStyle } from "../typesImage";

export class ImageGeminiService {
  private static instance: ImageGeminiService;

  private constructor() { }

  public static getInstance(): ImageGeminiService {
    if (!ImageGeminiService.instance) {
      ImageGeminiService.instance = new ImageGeminiService();
    }
    return ImageGeminiService.instance;
  }

  public async generateImage(prompt: string, aspectRatio: AspectRatio, visualStyle: VisualStyle): Promise<string> {

    // Use Vite environment variable
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey || apiKey.includes("PLACEHOLDER")) {
      throw new Error("API KEY no encontrada. Verifica tu archivo .env.local y asegúrate de tener VITE_GEMINI_API_KEY.");
    }

    const ai = new GoogleGenAI({ apiKey });

    // Valid aspect ratios for Imagen 3 model
    const validRatios: AspectRatio[] = ['1:1', '4:3', '16:9', '9:16'];
    const finalRatio = validRatios.includes(aspectRatio) ? aspectRatio : '1:1';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', // or 'imagen-3.0-generate-001' if supported by your plan
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `TASK: Create a high-quality professional book cover visual.
                  SUBJECT: ${prompt}
                  STYLE: ${visualStyle}
                  
                  REQUIREMENTS:
                  - NO TEXT, NO LETTERS.
                  - High detail.
                  - Artistic composition.`
              }
            ]
          }
        ],
        config: {
          imageGenerationConfig: {
            aspectRatio: finalRatio,
            numberOfImages: 1,
          },
        },
      } as any); // Type assertion if SDK types are slightly behind API

      // Check different response structures depending on SDK version
      const candidate = response.candidates?.[0];
      const parts = candidate?.content?.parts;

      if (!parts || parts.length === 0) {
        throw new Error("La IA no devolvió contenido.");
      }

      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }

      throw new Error("No se encontró imagen en la respuesta.");

    } catch (error: any) {
      console.error("Gemini Image Generation Error:", error);
      if (error.message?.includes("API_KEY")) {
        throw new Error("Clave API inválida o no configurada.");
      }
      throw new Error(error.message || "Error generando la imagen.");
    }
  }
}
