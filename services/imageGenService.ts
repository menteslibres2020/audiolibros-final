
// services/imageGenService.ts

import { geminiService } from './geminiService';
import { supabase } from '../lib/supabaseClient';

export interface ImageResult {
  label: 'square' | 'portrait' | 'story' | 'landscape';
  size: string;
  url: string;
}

export interface ImageJob {
  jobId: string;
  images: ImageResult[];
}

const MAX_RETRIES = 3;

// Mapeo detallado de configuraciones
export const IMAGE_CONFIGS = [
  { label: 'square', size: '1024x1024', ratio: '1:1', view: 'Cuadrado (1:1)' },
  { label: 'portrait', size: '1080x1350', ratio: '3:4', view: 'Retrato (3:4)' },
  { label: 'story', size: '1080x1920', ratio: '9:16', view: 'Historia (9:16)' },
  { label: 'landscape', size: '1920x1080', ratio: '16:9', view: 'Paisaje (16:9)' }
] as const;

export type ImageLabel = typeof IMAGE_CONFIGS[number]['label'];

export const imageGenService = {
  // Ahora genera UNA sola imagen basada en el label seleccionado
  async generateSingle(prompt: string, label: ImageLabel): Promise<ImageResult> {
    const config = IMAGE_CONFIGS.find(c => c.label === label);
    if (!config) throw new Error("Configuración de imagen no válida");

    console.log(`[ImageGen] Iniciando generación: ${label} (${config.ratio})`);

    let attempt = 0;
    while (attempt < MAX_RETRIES) {
      try {
        // 1. Generar con Gemini (Service base)
        const base64Image = await geminiService.generateImage(prompt, config.ratio as any);

        // 2. Convertir a Blob
        const res = await fetch(base64Image);
        const blob = await res.blob();

        // 3. Subir a Supabase
        const jobId = crypto.randomUUID();
        const fileName = `${jobId}/${config.label}_${config.size}.webp`;

        let publicUrl = '';

        // Intento 1: Bucket 'images'
        const { error: uploadError1 } = await supabase.storage
          .from('images')
          .upload(fileName, blob, { contentType: 'image/webp', upsert: true });

        if (!uploadError1) {
          const { data } = supabase.storage.from('images').getPublicUrl(fileName);
          publicUrl = data.publicUrl;
        } else {
          console.warn("Fallo subida a 'images', probando 'narrations/images'...", uploadError1);
          // Intento 2: Bucket 'narrations' folder 'images'
          const { error: uploadError2 } = await supabase.storage
            .from('narrations')
            .upload(`images/${fileName}`, blob, { contentType: 'image/webp', upsert: true });

          if (uploadError2) throw uploadError2;

          const { data } = supabase.storage.from('narrations').getPublicUrl(`images/${fileName}`);
          publicUrl = data.publicUrl;
        }

        console.log(`[ImageGen] Éxito: ${publicUrl}`);

        return {
          label: config.label,
          size: config.size,
          url: publicUrl
        };

      } catch (e: any) {
        console.error(`Error generando ${config.label} (Intento ${attempt + 1}):`, e);
        attempt++;
        if (attempt >= MAX_RETRIES) {
          throw new Error(`Fallo definitivo al generar imagen ${config.label}: ${e.message}`);
        }
        // Esperar un poco antes de reintentar
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    throw new Error("Error inesperado en loop de reintentos.");
  }
};
