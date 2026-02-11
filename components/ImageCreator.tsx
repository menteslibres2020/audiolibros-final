
import React, { useState } from 'react';
import { imageGenService, ImageResult, IMAGE_CONFIGS, ImageLabel } from '../services/imageGenService';

const ImageCreator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [selectedLabel, setSelectedLabel] = useState<ImageLabel>('square');
    const [loading, setLoading] = useState(false);
    // Ahora el historial acumula imágenes generadas individualmente
    const [history, setHistory] = useState<ImageResult[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setError(null);

        try {
            const result = await imageGenService.generateSingle(prompt, selectedLabel);
            setHistory(prev => [result, ...prev]);
        } catch (err: any) {
            setError(err.message || "Error desconocido al generar imagen.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="text-center space-y-2">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                    Creador de Imágenes <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-600">IA</span>
                </h2>
                <p className="text-slate-500 font-medium max-w-2xl mx-auto">
                    Diseña portadas y escenas únicas. Tu imaginación es el límite.
                </p>
            </div>

            {/* Input Section */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100 max-w-4xl mx-auto relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"></div>

                <div className="space-y-4">
                    {/* Aspect Ratio Selector */}
                    <div className="flex flex-wrap gap-2 justify-center pb-4 border-b border-slate-100">
                        {IMAGE_CONFIGS.map(cfg => (
                            <button
                                key={cfg.label}
                                onClick={() => setSelectedLabel(cfg.label)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2
                            ${selectedLabel === cfg.label
                                        ? 'bg-purple-600 text-white border-purple-600 shadow-md transform scale-105'
                                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                    }`}
                            >
                                <i className={`fa-solid ${cfg.label === 'square' ? 'fa-square' :
                                        cfg.label === 'portrait' ? 'fa-file-image' : // Vertical
                                            cfg.label === 'story' ? 'fa-mobile-screen' : // Story
                                                'fa-image' // Landscape
                                    }`}></i>
                                {cfg.view}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe tu imagen... (Ej: Un guerrero espacial estilo cyberpunk, luces neón, 8k)"
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-800 font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none h-32 md:h-auto transition-all"
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !prompt.trim()}
                            className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-lg flex flex-col items-center justify-center gap-2 md:w-48
                ${loading
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-br from-slate-900 to-slate-800 text-white hover:scale-105 hover:shadow-purple-500/25 active:scale-95'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <i className="fa-solid fa-circle-notch animate-spin text-2xl text-purple-600"></i>
                                    <span className="text-[10px]">Generando...</span>
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-wand-magic-sparkles text-2xl text-yellow-400"></i>
                                    <span>Crear Arte</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-3 animate-in slide-in-from-top-2">
                        <i className="fa-solid fa-triangle-exclamation text-xl"></i>
                        {error}
                    </div>
                )}
            </div>

            {/* Gallery Section - History */}
            {history.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {history.map((img, idx) => (
                        <div key={idx} className="group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
                            {/* Image Container */}
                            <div className="relative w-full bg-slate-100 overflow-hidden text-center bg-checkered">
                                {/* 
                   Usamos flex center para que la imagen se vea completa sin importar el ratio del contenedor,
                   o ajustamos el contenedor al ratio de la imagen.
                   Aquí ajustamos el contenedor para preserver el flow.
                */}
                                <div className={`w-full relative
                   ${img.label === 'square' ? 'aspect-square' : ''}
                   ${img.label === 'portrait' ? 'aspect-[3/4]' : ''}
                   ${img.label === 'story' ? 'aspect-[9/16]' : ''}
                   ${img.label === 'landscape' ? 'aspect-video' : ''}
                `}>
                                    <img
                                        src={img.url}
                                        alt={img.label}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 space-y-3">
                                        <div>
                                            <p className="text-white font-bold text-lg capitalize">{img.label}</p>
                                            <p className="text-slate-300 text-xs font-mono">{img.size}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <a
                                                href={img.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex-1 bg-white/20 hover:bg-white text-white hover:text-black py-2 rounded-lg text-xs font-bold backdrop-blur-sm transition-colors text-center"
                                            >
                                                <i className="fa-solid fa-eye mr-2"></i> Ver
                                            </a>
                                            <a
                                                href={img.url}
                                                download={`imagen_${img.label}.webp`}
                                                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg text-xs font-bold transition-colors text-center shadow-lg shadow-purple-900/50"
                                            >
                                                <i className="fa-solid fa-download mr-2"></i> Guardar
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State Hint */}
            {history.length === 0 && !loading && (
                <div className="text-center py-20 opacity-50">
                    <i className="fa-solid fa-layer-group text-6xl text-slate-300 mb-4"></i>
                    <p className="text-slate-400 font-bold">Tus creaciones aparecerán aquí</p>
                </div>
            )}
        </div>
    );
};

export default ImageCreator;
