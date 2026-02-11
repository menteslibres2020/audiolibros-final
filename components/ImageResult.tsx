
import React from 'react';
import { Download, Loader2, Wand2 } from 'lucide-react';

interface ImageResultProps {
  image: string | null;
  isGenerating: boolean;
  prompt: string;
}

export const ImageResult: React.FC<ImageResultProps> = ({ image, isGenerating, prompt }) => {
  if (isGenerating) {
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-700">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-600 dark:text-slate-300 font-medium animate-pulse">
          Creando tu portada...
        </p>
        <p className="text-xs text-slate-400 mt-2">Esto puede tomar unos segundos</p>
      </div>
    );
  }

  if (!image) {
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
          <Wand2 className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-slate-900 dark:text-slate-200 font-bold mb-1">
          Listo para crear
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
          Describe tu idea y selecciona un estilo para generar una portada única.
        </p>
      </div>
    );
  }

  return (
    <div className="relative group w-full rounded-3xl overflow-hidden shadow-lg bg-slate-900">
      <img
        src={image}
        alt={prompt}
        className="w-full h-auto object-contain max-h-[600px] bg-slate-900"
      />

      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-4 p-6 text-center backdrop-blur-sm">
        <p className="text-white/90 text-sm font-medium line-clamp-3 max-w-md">
          {prompt}
        </p>
        <a
          href={image}
          download={`portada-libroteca-${Date.now()}.png`}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full font-bold transition-transform hover:scale-105 shadow-xl shadow-indigo-900/20"
        >
          <Download className="w-5 h-5" />
          Descargar Portada
        </a>
      </div>
    </div>
  );
};
