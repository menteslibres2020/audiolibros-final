
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

    // Validar que el aspectRatio sea uno de los permitidos explícitamente por el SDK
    const validRatios: AspectRatio[] = ['1:1', '4:3', '16:9', '9:16'];
    const finalRatio = validRatios.includes(aspectRatio) ? aspectRatio : '1:1';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `TASK: Professional aesthetic artistic visual for a book cover.
              SUBJECT: ${prompt}. 
              ARTISTIC STYLE: ${visualStyle}.
              
              STRICT NEGATIVE PROMPT:
              - NO TEXT, NO LETTERS, NO NUMBERS, NO SYMBOLS, NO WORDS.
              - NO WATERMARKS, NO LOGOS, NO SIGNATURES.
              - NO TYPOGRAPHY, NO FONTS.
              
              STRICT POSITIVE PROMPT:
              - Clean pictorial composition.
              - 100% Artistic representation only.
              - High definition, masterpiece quality.
              - Style should strictly be ${visualStyle}.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: finalRatio,
          },
        },
      });

      const candidate = response.candidates?.[0];
      if (!candidate?.content?.parts) {
        throw new Error("La IA no devolvió ninguna imagen. Intenta con otro prompt.");
      }

      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          // Verificar que el string no esté vacío
          if (!base64EncodeString || base64EncodeString.length < 100) {
            throw new Error("La imagen recibida es corrupta o está vacía.");
          }
          return `data:image/png;base64,${base64EncodeString}`;
        }
      }

      throw new Error("No se pudo extraer la imagen de la respuesta de la IA.");
    } catch (error: any) {
      console.error("Gemini Image Generation Error:", error);
      if (error.message?.includes("safety")) {
        throw new Error("El contenido fue bloqueado por filtros de seguridad. Prueba con un concepto distinto.");
      }
      throw new Error(error.message || "Error al conectar con el servidor de arte.");
    }
  }
}
