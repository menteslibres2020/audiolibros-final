
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

// Mapeo de labels a aspectos de Gemini y tamaños teóricos
const IMAGE_CONFIGS = [
  { label: 'square', size: '1024x1024', ratio: '1:1' },
  { label: 'portrait', size: '1080x1350', ratio: '3:4' }, // 3:4 es lo más cercano a 4:5 en Gemini
  { label: 'story', size: '1080x1920', ratio: '9:16' },
  { label: 'landscape', size: '1920x1080', ratio: '16:9' }
] as const;

export const imageGenService = {
  async generateCollection(prompt: string): Promise<ImageJob> {
    const jobId = crypto.randomUUID();
    const results: ImageResult[] = [];

    // Paralelizamos las peticiones para velocidad, pero con control de errores individual
    const promises = IMAGE_CONFIGS.map(async (config) => {
      let attempt = 0;
      let url = '';

      while (attempt < MAX_RETRIES && !url) {
        try {
          // 1. Generar con Gemini
          const base64Image = await geminiService.generateImage(prompt, config.ratio as any);

          // 2. Convertir a Blob
          const res = await fetch(base64Image);
          const blob = await res.blob();

          // 3. Subir a Supabase
          const fileName = `${jobId}/${config.label}_${config.size}.webp`;
          const { data, error } = await supabase.storage
            .from('images') // Intentamos bucket 'images'
            .upload(fileName, blob, {
              contentType: 'image/webp',
              upsert: true
            });

          if (error) {
            // Fallback a 'narrations' si 'images' no existe
             const { data: data2, error: error2 } = await supabase.storage
              .from('narrations')
              .upload(`images/${fileName}`, blob, {
                  contentType: 'image/webp',
                  upsert: true
              });
              
             if (error2) throw error2;
             
             // Get Public URL fallback
             const py = supabase.storage.from('narrations').getPublicUrl(`images/${fileName}`);
             url = py.data.publicUrl;
          } else {
             // Get Public URL standard
             const py = supabase.storage.from('images').getPublicUrl(fileName);
             url = py.data.publicUrl;
          }

        } catch (e) {
          console.error(`Error generando ${config.label} (Intento ${attempt + 1}):`, e);
          attempt++;
          if (attempt >= MAX_RETRIES) {
             throw new Error(`Fallo definitivo en ${config.label} tras 3 intentos.`);
          }
        }
      }

      return {
        label: config.label,
        size: config.size,
        url: url
      } as ImageResult;
    });

    const images = await Promise.all(promises);

    return {
      jobId,
      images
    };
  }
};
