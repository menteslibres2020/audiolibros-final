
import React from 'react';
import { GeneratedImage } from '../types';

interface ImageResultProps {
  image: GeneratedImage | null;
  isGenerating: boolean;
  isDark: boolean;
}

const ImageResult: React.FC<ImageResultProps> = ({ image, isGenerating, isDark }) => {
  if (isGenerating) {
    return (
      <div className="w-full min-h-[550px] bg-[#fdfaff] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 animate-pulse"></div>
        <div className="relative flex flex-col items-center z-10">
          <div className="w-24 h-24 relative mb-12">
            <div className="absolute inset-0 border-[6px] border-purple-100 rounded-full"></div>
            <div className="absolute inset-0 border-[6px] border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-4 border-[4px] border-purple-200 rounded-full border-b-transparent animate-[spin_1.5s_linear_infinite_reverse]"></div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-[13px] font-black uppercase tracking-[0.6em] text-indigo-600 animate-pulse">
              Esculpiendo Arte
            </p>
            <div className="flex gap-1.5 mt-2">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
        {/* Decorative elements for loading */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-indigo-100/30 rounded-full blur-3xl"></div>
      </div>
    );
  }

  if (!image) {
    return (
      <div className="w-full min-h-[550px] bg-[#fafbfc] flex flex-col items-center justify-center p-20 text-center">
        <div className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-[2.8rem] flex items-center justify-center text-gray-200 mb-8 bg-white shadow-sm group-hover:border-indigo-200 group-hover:text-indigo-200 transition-all duration-500">
           <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.5em] text-gray-300">Esperando Inspiración</p>
      </div>
    );
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `libroteca-${image.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative group bg-neutral-950 overflow-hidden shadow-2xl transition-all duration-700 ease-in-out min-h-[550px] flex items-center justify-center">
      <div className="relative w-full flex justify-center items-center">
        <img
          src={image.url}
          alt={image.prompt}
          className="max-w-full h-auto max-h-[85vh] object-contain transition-all duration-[8000ms] group-hover:scale-105 group-hover:opacity-60 ease-out"
        />

        {(image.title || image.subtitle) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 md:p-16 text-center pointer-events-none select-none">
            <div className="bg-black/25 backdrop-blur-2xl p-8 md:p-12 rounded-[3.5rem] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] transform transition-all duration-1000 group-hover:scale-110 group-hover:bg-black/15">
                {image.title && (
                  <h2 className="text-white text-3xl md:text-5xl lg:text-6xl font-extralight uppercase tracking-[0.3em] leading-tight drop-shadow-2xl">
                    {image.title}
                  </h2>
                )}
                {image.title && image.subtitle && (
                  <div className="w-12 md:w-20 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent my-6 md:my-10 mx-auto opacity-60"></div>
                )}
                {image.subtitle && (
                  <p className="text-indigo-100 text-[10px] md:text-xs font-black uppercase tracking-[0.5em] opacity-80 drop-shadow-lg">
                    {image.subtitle}
                  </p>
                )}
            </div>
          </div>
        )}
      </div>
      
      <div className="absolute top-8 right-8 flex gap-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out z-20">
        <button 
          onClick={handleDownload}
          className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/95 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-2xl active:scale-90 border border-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
        </button>
      </div>

      <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-700 delay-200 z-20">
         <div className="bg-black/40 backdrop-blur-xl px-6 py-2 rounded-full text-[9px] font-black text-white/90 uppercase tracking-widest border border-white/10">
            {image.visualStyle} • {image.aspectRatio}
         </div>
         <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">
            ID: {image.id}
         </div>
      </div>
    </div>
  );
};

export default ImageResult;
