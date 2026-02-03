
import { GoogleGenAI, Modality } from "@google/genai";
import { decodeBase64, decodeAudioData, audioBufferToWavBlob, mergeAudioBuffers } from "../utils/audioUtils.ts";

export class GeminiTTSService {
  private MAX_CHARS_PER_CHUNK = 1500; 

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
}

export const ttsService = new GeminiTTSService();
