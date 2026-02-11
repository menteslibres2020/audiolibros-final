
import React, { useState } from 'react';
import { imageGenService, ImageResult } from '../services/imageGenService';

const ImageCreator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ImageResult[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await imageGenService.generateCollection(prompt);
            setResult(data.images);
        } catch (err: any) {
            setError(err.message || "Error desconocido al generar imágenes.");
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
                    Genera 4 variantes de alta calidad para tus portadas, historias y redes sociales en un solo clic.
                </p>
            </div>

            {/* Input Section */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100 max-w-4xl mx-auto relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"></div>

                <div className="flex flex-col md:flex-row gap-4">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe tu imagen con todo detalle... (Ej: Un astronauta meditando en un jardín zen flotante en el espacio, estilo cyberpunk, neon lights, 8k)"
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
                                <span className="text-[10px]">Creando Arte...</span>
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-wand-magic-sparkles text-2xl text-yellow-400"></i>
                                <span>Generar</span>
                            </>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-3">
                        <i className="fa-solid fa-triangle-exclamation text-xl"></i>
                        {error}
                    </div>
                )}
            </div>

            {/* Gallery Section */}
            {result && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {result.map((img, idx) => (
                        <div key={idx} className="group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-slate-100">
                            {/* Image Container with Aspect Ratio */}
                            <div className="relative w-full bg-slate-100 overflow-hidden">
                                <div className={`
                   ${img.label === 'square' ? 'aspect-square' : ''}
                   ${img.label === 'portrait' ? 'aspect-[4/5]' : ''}
                   ${img.label === 'story' ? 'aspect-[9/16]' : ''}
                   ${img.label === 'landscape' ? 'aspect-video' : ''}
                `}>
                                    <img
                                        src={img.url}
                                        alt={img.label}
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                    />
                                </div>

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                        <p className="text-white font-bold text-lg capitalize mb-1">{img.label}</p>
                                        <p className="text-slate-300 text-xs font-mono mb-4">{img.size}</p>
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

            {/* Empty State / Loading Hints */}
            {!result && !loading && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-30 pointer-events-none filter grayscale">
                    <div className="aspect-square bg-slate-200 rounded-2xl animate-pulse"></div>
                    <div className="aspect-[4/5] bg-slate-200 rounded-2xl animate-pulse delay-75"></div>
                    <div className="aspect-[9/16] bg-slate-200 rounded-2xl animate-pulse delay-150"></div>
                    <div className="aspect-video bg-slate-200 rounded-2xl animate-pulse delay-300"></div>
                </div>
            )}
        </div>
    );
};

export default ImageCreator;
