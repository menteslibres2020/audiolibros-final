import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';

const ImageCreator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:5'>('1:1');
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setError(null);
        setImageUrl(null);
        try {
            const url = await geminiService.generateImage(prompt, aspectRatio);
            setImageUrl(url);
        } catch (err: any) {
            setError(err.message || "Error al generar imagen");
        } finally {
            setLoading(false);
        }
    };

    const downloadImage = () => {
        if (imageUrl) {
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = `imagen_ia_${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-purple-200">
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                </div>
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900">Creador de Imágenes IA</h2>
                    <p className="text-xs md:text-sm text-slate-500 font-medium">Diseña ilustraciones personalizadas con comandos de texto.</p>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Prompt (Descripción)</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe tu imagen con detalle (ej: Un paisaje futurista cyberpunk con luces de neón bajo la lluvia...)"
                        className="w-full h-32 p-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-purple-500 outline-none font-medium resize-none text-sm md:text-base transition-colors"
                        autoFocus
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Formato</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { id: '1:1', label: 'Cuadrado', icon: 'fa-square' },
                            { id: '16:9', label: 'Landscape', icon: 'fa-tv' },
                            { id: '9:16', label: 'Portrait', icon: 'fa-mobile-screen' },
                            { id: '4:5', label: 'Instagram', icon: 'fa-image' },
                        ].map((format) => (
                            <button
                                key={format.id}
                                onClick={() => setAspectRatio(format.id as any)}
                                className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${aspectRatio === format.id
                                        ? 'bg-purple-600 border-purple-600 text-white shadow-md transform scale-[1.02]'
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-purple-300 hover:bg-purple-50'
                                    }`}
                            >
                                <i className={`fa-regular ${format.icon}`}></i>
                                <span className="text-xs font-bold">{format.label}</span>
                                <span className="text-[10px] opacity-60 ml-1">({format.id})</span>
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={loading || !prompt}
                    className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-3 text-sm md:text-base ${loading
                            ? 'bg-purple-400 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-700 hover:shadow-xl hover:shadow-purple-200 text-white'
                        }`}
                >
                    {loading ? (
                        <>
                            <i className="fa-solid fa-circle-notch animate-spin"></i>
                            GENERANDO ARTE...
                        </>
                    ) : (
                        <>
                            <i className="fa-solid fa-paintbrush"></i>
                            GENERAR IMAGEN
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-3">
                    <i className="fa-solid fa-triangle-exclamation text-lg"></i>
                    {error}
                </div>
            )}

            {imageUrl && (
                <div className="mt-8 space-y-4 animate-in slide-in-from-bottom duration-500">
                    <div className="relative group rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-100">
                        {/* Container con aspect ratio dinámico si fuera posible, pero img lo maneja */}
                        <img src={imageUrl} alt="Generated AI Art" className="w-full h-auto object-contain max-h-[600px] mx-auto" />

                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                            <button
                                onClick={downloadImage}
                                className="px-6 py-3 bg-white text-slate-900 rounded-full font-bold shadow-lg hover:scale-110 transition-transform flex items-center gap-2"
                            >
                                <i className="fa-solid fa-download text-purple-600"></i>
                                Descargar
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <p className="text-xs text-slate-400 font-medium bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                            Imagen generada con Gemini 2.5 Flash Image
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageCreator;
