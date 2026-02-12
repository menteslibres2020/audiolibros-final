
import { GoogleGenAI } from "@google/genai";
import { AspectRatio, VisualStyle } from "../typesImage";
import { supabase } from "../lib/supabaseClient";

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

    // Valid aspect ratios for Imagen 3 model (expanded)
    const validRatios: AspectRatio[] = ['1:1', '4:3', '16:9', '9:16', '3:4', '4:5'];
    // Default to 1:1 if not in list, but allow all valid ones
    const finalRatio = validRatios.includes(aspectRatio) ? aspectRatio : '1:1';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
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
      } as any);

      const candidate = response.candidates?.[0];
      const parts = candidate?.content?.parts;

      if (!parts || parts.length === 0) {
        throw new Error("La IA no devolvió contenido.");
      }

      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const base64Data = part.inlineData.data;

          // Convert Base64 to Blob
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/png' });

          // Upload to Supabase
          const fileName = `covers/cover_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;

          // Try 'images' bucket first, fallback to 'public' if needed (based on common patterns)
          // We use 'images' as seen in other services
          const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(fileName, blob, {
              contentType: 'image/png',
              upsert: true
            });

          if (uploadError) {
            console.error("Supabase Upload Error:", uploadError);
            // Fallback: return base64 if upload fails
            console.warn("Retornando base64 por fallo en subida.");
            return `data:image/png;base64,${base64Data}`;
          }

          const { data: publicUrlData } = supabase.storage
            .from('images')
            .getPublicUrl(fileName);

          return publicUrlData.publicUrl;
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
