import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';

type GeneratedImage = {
    id: string;
    url: string;
    prompt: string;
    aspectRatio: '1:1' | '16:9' | '9:16' | '4:5';
    timestamp: number;
};

const ImageCreator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:5'>('1:1');
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<GeneratedImage[]>([]);

    // Cargar historial
    useEffect(() => {
        const saved = localStorage.getItem('audiolibros_image_history');
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) {
                console.error("Error cargando historial de imágenes", e);
            }
        }
    }, []);

    // Guardar historial
    useEffect(() => {
        localStorage.setItem('audiolibros_image_history', JSON.stringify(history));
    }, [history]);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setError(null);
        // No limpiamos imageUrl inmediatamente para no causar "salto" visual feo, o sí?
        // Mejor mostramos loading overlay sobre la imagen anterior o placeholder.

        try {
            const url = await geminiService.generateImage(prompt, aspectRatio);
            setImageUrl(url);

            const newImage: GeneratedImage = {
                id: Date.now().toString(),
                url,
                prompt,
                aspectRatio,
                timestamp: Date.now()
            };

            setHistory(prev => [newImage, ...prev]);
        } catch (err: any) {
            setError(err.message || "Error al generar imagen");
        } finally {
            setLoading(false);
        }
    };

    const downloadImage = (url: string, id: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `imagen_ia_${id}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const deleteImage = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("¿Eliminar esta imagen del historial?")) {
            setHistory(prev => prev.filter(img => img.id !== id));
            if (imageUrl && history.find(h => h.id === id)?.url === imageUrl) {
                setImageUrl(null);
            }
        }
    };

    const selectFromHistory = (img: GeneratedImage) => {
        setImageUrl(img.url);
        setPrompt(img.prompt);
        setAspectRatio(img.aspectRatio);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {/* Main Creator Area */}
            <div className={`lg:col-span-2 space-y-6`}>
                <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-200">
                            <i className="fa-solid fa-wand-magic-sparkles"></i>
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-slate-900">Creador de Imágenes IA</h2>
                            <p className="text-xs md:text-sm text-slate-500 font-medium">Diseña ilustraciones con Gemini 2.5 Flash Image.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Prompt (Descripción)</label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe tu imagen con detalle (ej: Un paisaje futurista cyberpunk con luces de neón bajo la lluvia...)"
                                className="w-full h-28 p-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none font-medium resize-none text-sm md:text-base transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Formato</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { id: '1:1', label: 'Cuadrado', icon: 'fa-square' },
                                    { id: '16:9', label: 'Cine', icon: 'fa-tv' },
                                    { id: '9:16', label: 'Móvil', icon: 'fa-mobile-screen' },
                                    { id: '4:5', label: 'Social', icon: 'fa-image' },
                                ].map((format) => (
                                    <button
                                        key={format.id}
                                        onClick={() => setAspectRatio(format.id as any)}
                                        className={`py-3 px-2 rounded-xl border flex items-center justify-center gap-2 transition-all ${aspectRatio === format.id
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md transform scale-[1.02]'
                                            : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:bg-indigo-50'
                                            }`}
                                    >
                                        <i className={`fa-regular ${format.icon}`}></i>
                                        <span className="text-xs font-bold">{format.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={loading || !prompt}
                            className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-3 text-sm md:text-base ${loading
                                ? 'bg-indigo-400 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200 text-white'
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
                </div>

                {/* Preview Area */}
                {(imageUrl || loading) && (
                    <div className="bg-white p-4 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative min-h-[300px] flex items-center justify-center bg-slate-100">
                        {loading ? (
                            <div className="flex flex-col items-center gap-4 animate-pulse">
                                <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                                <p className="text-indigo-500 font-bold text-sm uppercase tracking-widest">Creando...</p>
                            </div>
                        ) : imageUrl ? (
                            <div className="relative group w-full">
                                <img src={imageUrl} alt="Generated AI Art" className="w-full h-auto object-contain max-h-[600px] rounded-xl shadow-md mx-auto" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 rounded-xl">
                                    <button
                                        onClick={() => downloadImage(imageUrl, Date.now().toString())}
                                        className="p-3 bg-white text-indigo-600 rounded-full hover:bg-indigo-50 hover:scale-110 transition-all shadow-lg"
                                        title="Descargar"
                                    >
                                        <i className="fa-solid fa-download"></i>
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(prompt);
                                            alert("Prompt copiado");
                                        }}
                                        className="p-3 bg-white text-slate-600 rounded-full hover:bg-slate-50 hover:scale-110 transition-all shadow-lg"
                                        title="Copiar Prompt"
                                    >
                                        <i className="fa-solid fa-copy"></i>
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>

            {/* History Sidebar */}
            <div className="lg:col-span-1">
                <div className="bg-white p-5 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm h-full max-h-[calc(100vh-120px)] overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-4 shrink-0">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Galería Reciente</h3>
                        <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-lg text-[10px] font-bold">{history.length}</span>
                    </div>

                    <div className="overflow-y-auto custom-scrollbar flex-1 space-y-3 pr-1">
                        {history.length === 0 ? (
                            <div className="text-center py-10 opacity-50">
                                <i className="fa-regular fa-images text-4xl mb-3 text-slate-300"></i>
                                <p className="text-xs text-slate-400 font-medium">Tus creaciones aparecerán aquí</p>
                            </div>
                        ) : (
                            history.map((img) => (
                                <div
                                    key={img.id}
                                    onClick={() => selectFromHistory(img)}
                                    className={`group relative rounded-xl overflow-hidden border cursor-pointer transition-all hover:shadow-md flex gap-3 p-2 ${imageUrl === img.url ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-100 hover:border-indigo-200 bg-white'
                                        }`}
                                >
                                    <div className="w-16 h-16 shrink-0 bg-slate-100 rounded-lg overflow-hidden">
                                        <img src={img.url} className="w-full h-full object-cover" loading="lazy" />
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <p className="text-[10px] text-slate-400 font-bold mb-0.5">{new Date(img.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        <p className="text-xs font-medium text-slate-700 line-clamp-2 leading-snug" title={img.prompt}>{img.prompt}</p>
                                    </div>
                                    <button
                                        onClick={(e) => deleteImage(img.id, e)}
                                        className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-white/80 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <i className="fa-solid fa-times text-[10px]"></i>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageCreator;
