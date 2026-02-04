
import { GoogleGenAI, Modality } from "@google/genai";
import { decodeBase64, decodeAudioData, audioBufferToWavBlob, mergeAudioBuffers } from "../utils/audioUtils.ts";

export class GeminiTTSService {
  private MAX_CHARS_PER_CHUNK = 5000;

  private getAIInstance() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private splitText(text: string): string[] {
    const chunks: string[] = [];
    let currentPos = 0;

    while (currentPos < text.length) {
      let endPos = currentPos + this.MAX_CHARS_PER_CHUNK;

      if (endPos < text.length) {
        const lastPeriod = text.lastIndexOf('.', endPos);
        const lastNewline = text.lastIndexOf('\n', endPos);
        const bestSplit = Math.max(lastPeriod, lastNewline);

        if (bestSplit > currentPos) {
          endPos = bestSplit + 1;
        }
      }

      const chunk = text.substring(currentPos, endPos).trim();
      if (chunk) chunks.push(chunk);
      currentPos = endPos;
    }
    return chunks;
  }

  async generateNarration(
    text: string,
    voiceName: string,
    emotion: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<string> {
    const chunks = this.splitText(text);
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const buffers: AudioBuffer[] = [];
    const ai = this.getAIInstance();

    for (let i = 0; i < chunks.length; i++) {
      if (onProgress) onProgress(i + 1, chunks.length);

      const chunk = chunks[i];

      // Prompt altamente enfático en la emoción requerida
      const prompt = `Actúa como un locutor profesional. Tu tarea primordial es narrar el siguiente texto capturando perfectamente una atmósfera ${emotion.toUpperCase()}. Cada palabra debe estar impregnada de esa emoción específica (${emotion}). No seas neutral; sé evocador y asegúrate de que el tono de voz refleje la intención emocional del contenido: ${chunk}`;

      const fetchChunk = async (retryCount = 0): Promise<string> => {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName },
                },
              },
            },
          });

          const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (!data) throw new Error("Audio no disponible.");
          return data;
        } catch (error: any) {
          if ((error.message.includes('429') || error.message.includes('limit')) && retryCount < 3) {
            await new Promise(r => setTimeout(r, 4000 * (retryCount + 1)));
            return fetchChunk(retryCount + 1);
          }
          throw error;
        }
      };

      const base64Audio = await fetchChunk();
      const audioBytes = decodeBase64(base64Audio);
      const buffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
      buffers.push(buffer);

      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }

    const fullBuffer = mergeAudioBuffers(buffers, audioContext);
    const wavBlob = audioBufferToWavBlob(fullBuffer);
    return URL.createObjectURL(wavBlob);
  }

  async generateImage(prompt: string): Promise<string> {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("API Key no configurada.");
    }


    // Intentar con varios modelos conocidos
    const models = [
      'imagen-3.0-generate-001',
      'imagen-3.0-generate-002',
      'gemini-2.0-flash-image-preview', // Nuevo modelo sugerido
      'image-generation-002',
    ];

    let lastError = null;

    for (const model of models) {
      try {
        let url = '';
        let body = {};

        // Lógica para diferenciar API de Imagen vs Gemini
        if (model.includes('gemini')) {
          // API Gemini: generateContent
          url = `/api/gemini/v1beta/models/${model}:generateContent`;
          body = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ["IMAGE"], // Forzar salida de imagen
              imageGenerationConfig: {
                sampleCount: 1,
                aspectRatio: "1:1",
                personGeneration: "allow_adult",
              }
            }
          };
        } else {
          // API Imagen: predict
          url = `/api/gemini/v1beta/models/${model}:predict`;
          body = {
            instances: [
              { prompt: prompt }
            ],
            parameters: {
              sampleCount: 1,
              aspectRatio: "1:1",
              safetySetting: "block_medium_and_above",
              personGeneration: "allow_adult",
            }
          };
        }

        console.log(`Intentando generar imagen con modelo ${model} en URL ${url}...`);

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errText = await response.text();
          // Si es 404, probamos el siguiente modelo
          if (response.status === 404) {
            console.warn(`Modelo ${model} no encontrado (404). Probando siguiente...`);
            lastError = new Error(`Error API Imagen (${response.status}): ${errText}`);
            continue;
          }
          console.error("API Error Body:", errText);
          throw new Error(`Error API Imagen (${response.status}): ${errText.substring(0, 100)}`);
        }

        const data = await response.json();

        let base64Image = null;

        // 1. Respuesta tipo Gemini (generateContent)
        if (data.candidates && data.candidates[0]?.content?.parts) {
          const part = data.candidates[0].content.parts.find((p: any) => p.inlineData);
          if (part && part.inlineData && part.inlineData.data) {
            base64Image = part.inlineData.data;
          }
        }
        // 2. Respuesta tipo Imagen Vertex (:predict)
        else if (data.predictions && data.predictions.length > 0) {
          const prediction = data.predictions[0];
          if (prediction.bytesBase64Encoded) {
            base64Image = prediction.bytesBase64Encoded;
          } else if (typeof prediction === 'string') {
            base64Image = prediction;
          }
        }
        // 3. Respuesta tipo Imagen Legacy
        else if (data.images && data.images.length > 0 && data.images[0].image64) {
          base64Image = data.images[0].image64;
        }

        if (base64Image) {
          return base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`;
        }
      } catch (error: any) {
        console.error(`Error con modelo ${model}:`, error);
        lastError = error;
      }
    }

    throw lastError || new Error("No se pudo generar imagen con ninguno de los modelos disponibles.");
  }
}

export const ttsService = new GeminiTTSService();
