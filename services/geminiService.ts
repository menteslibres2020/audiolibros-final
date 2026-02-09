
import { GoogleGenAI, Modality } from "@google/genai";
import { decodeBase64, decodeAudioData, audioBufferToWavBlob, mergeAudioBuffers } from "../utils/audioUtils.ts";

export class GeminiTTSService {
  // Reducimos drásticamente el tamaño del chunk para evitar degradación/susurros en textos largos.
  // 600 caracteres es un buen balance (aprox 40-60 segs) para mantener la inferencia fresca y potente.
  private MAX_CHARS_PER_CHUNK = 600;

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

      // Mapeo de estilos para el NUEVO ELENCO (9 Voces)
      let baseVoiceName = 'Fenrir'; // Default fallback
      let styleInstruction = "";

      switch (voiceName) {
        // --- FEMENINAS ---
        case 'Sofia': // Base: Zephyr (Suave)
          baseVoiceName = 'Zephyr';
          styleInstruction = "Voz FEMENINA suave, cálida, empática y maternal. Tono reconfortante, ideal para cuentos o romance. Volumen suave pero CLARO.";
          break;
        case 'Valentina': // Base: Kore (Equilibrada)
          baseVoiceName = 'Kore';
          styleInstruction = "Voz FEMENINA profesional, objetiva, periodística y directa. Dicción perfecta, tono serio y confiable. Estilo informativo.";
          break;
        case 'Camila': // Base: Aoede (Expresiva)
          baseVoiceName = 'Aoede';
          styleInstruction = "Voz FEMENINA vibrante, dramática y llena de vida. Actuación teatral intensa, mucha variabilidad emocional pero siempre con volumen firme.";
          break;

        // --- MASCULINAS ---
        case 'Mateo': // Base: Puck (Enérgico)
          baseVoiceName = 'Puck';
          styleInstruction = "Voz MASCULINA juvenil, rápida, dinámica y entusiasta. Tono fresco, moderno, estilo youtuber o amigo cercano.";
          break;
        case 'Diego': // Base: Fenrir (Autoritario)
          baseVoiceName = 'Fenrir';
          styleInstruction = "Voz MASCULINA estándar de narrador de libros. Equilibrada, firme, masculina y confiable. Tono medio, perfecto para literatura general.";
          break;
        case 'Alejandro': // Base: Charon (Profundo)
          baseVoiceName = 'Charon';
          styleInstruction = "Voz MASCULINA muy grave, profunda y resonante. Voz de bajo, con mucho cuerpo y presencia. Impactante.";
          break;
        case 'Leonardo': // Base: Fenrir (Heroico)
          baseVoiceName = 'Fenrir';
          styleInstruction = "Voz MASCULINA épica, heroica y motivacional. Proyecta mucha seguridad, fuerza y liderazgo. Estilo cinematográfico de acción.";
          break;
        case 'Ricardo': // Base: Charon (Anciano)
          baseVoiceName = 'Charon';
          styleInstruction = "Voz MASCULINA de hombre anciano (65+ años), sabio, pausado y reflexivo. Voz con textura de edad, solemne y académica. NO TIEMBLA, solo suena mayor.";
          break;
        case 'Gabriel': // Base: Fenrir (Misterio)
          baseVoiceName = 'Fenrir';
          styleInstruction = "Voz MASCULINA intrigante, 'Noir' y de suspenso. Levemente rasposa (whiskey voice) pero POTENTE. Estilo de detective privado. NO susurres, solo baja el tono.";
          break;

        default:
          baseVoiceName = 'Fenrir';
          styleInstruction = "Voz profesional y clara. Volumen constante.";
          break;
      }

      const prompt = `Rol: Eres el MEJOR narrador de audiolibros del mundo.
Objetivo: Narrar el texto con CALIDAD DE ESTUDIO, sin errores y sin efectos extraños.

TU PERFIL DE VOZ:
${styleInstruction}

Emoción Requerida: ${emotion.toUpperCase()}.

REGLAS ABSOLUTAS (PROHIBIDO ROMPERLAS):
1. PROHIBIDO SUSURRAR: Bajo ninguna circunstancia susurres, a menos que el texto diga explícitamente "susurró". El usuario ODIA los susurros. Mantén la voz PLENA y SONORA.
2. VOLUMEN CONSTANTE: No bajes el volumen al final de las frases. Mantén la misma potencia de voz desde la primera hasta la última palabra del fragmento.
3. ANTI-LATA: Usa tu registro más rico y resonante. Evita sonar metálico o telefónico. Queremos "High Fidelity".
4. NATURALIDAD: Habla como un ser humano real, conecta las frases con fluidez.

Texto a narrar:
${chunk}`;

      const fetchChunk = async (retryCount = 0): Promise<string> => {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: baseVoiceName },
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


    // Intentar con varios modelos conocidos - GEMINI 2.5 PRIORIZADO
    const models = [
      'gemini-2.5-flash-image', // SOLICITADO POR EL USUARIO (Oficial)
      'gemini-2.0-flash-image',
      'gemini-2.0-flash-image-preview',
      'imagen-3.0-generate-001',
      'imagen-3.0-generate-002',
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
              speechConfig: undefined, // Asegurar que no vaya config de audio
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
  async analyzeAudioForVideo(audioBlob: Blob): Promise<string[]> {
    const ai = this.getAIInstance();

    // Convert Blob to Base64
    const base64Audio = await this.blobToBase64(audioBlob);

    const prompt = `Analiza este audio detalladamente.
    Tu tarea es generar 3 PROMPTS DE IMAGEN (en inglés) que representen visualmente la narrativa o el ambiente de este audio.
    Estas imágenes se usarán para crear un video para redes sociales.
    
    Reglas:
    1. Devuelve SOLO un array JSON de strings. Ejemplo: ["A dark forest with fog", "A knight standing in the rain", "A castle in the distance"]
    2. Los prompts deben ser visualmente ricos, detallados y artísticos.
    3. NO incluyas texto extra, solo el JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", // 1.5 Flash is reliable for Multimodal Audio
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { data: base64Audio, mimeType: audioBlob.type || 'audio/mp3' } }
          ]
        }
      ]
    });

    const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    try {
      // Clean markdown code blocks if present
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error("Error parsing AI response", e);
      return [
        "A cinematic shot of a audiobook storytelling session, dramatic lighting, 8k",
        "Abstract visualization of sound waves and magic, digital art",
        "A cozy reading nook with books and headphones, warm lighting"
      ];
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export const ttsService = new GeminiTTSService();
