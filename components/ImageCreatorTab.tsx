
import React, { useState, useEffect } from 'react';
import { Wand2, Sparkles, AlertCircle, History } from 'lucide-react';
import { ImageGeminiService } from '../services/geminiImageService';
import { AspectRatio, VisualStyle, GeneratedImage, GenerationState } from '../typesImage';
import AspectRatioPicker from './AspectRatioPicker';
import VisualStylePicker from './VisualStylePicker';
import { ImageResult } from './ImageResult';

export const ImageCreatorTab: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('1:1');
    const [selectedStyle, setSelectedStyle] = useState<VisualStyle>('Cinematic');
    const [state, setState] = useState<GenerationState>({
        isGenerating: false,
        error: null,
        currentImage: null,
        history: [],
    });

    useEffect(() => {
        const saved = localStorage.getItem('libroteca_images');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setState(prev => ({ ...prev, history: parsed }));
            } catch (e) {
                console.error("Error loading history", e);
            }
        }
    }, []);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setState(prev => ({ ...prev, isGenerating: true, error: null }));

        try {
            const service = ImageGeminiService.getInstance();
            const base64Image = await service.generateImage(prompt, selectedRatio, selectedStyle);

            const newImage: GeneratedImage = {
                id: Date.now().toString(),
                url: base64Image,
                prompt,
                aspectRatio: selectedRatio,
                visualStyle: selectedStyle,
                createdAt: new Date(),
            };

            const updatedHistory = [newImage, ...state.history];
            setState(prev => ({
                ...prev,
                isGenerating: false,
                currentImage: newImage,
                history: updatedHistory,
            }));

            localStorage.setItem('libroteca_images', JSON.stringify(updatedHistory));

        } catch (error: any) {
            setState(prev => ({
                ...prev,
                isGenerating: false,
                error: error.message || "Error desconocido al generar la imagen",
            }));
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">

            {/* Header */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-bold mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>IA Generativa 2.5 Flash</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    Creador de Portadas
                </h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                    Diseña portadas profesionales para tus audiolibros utilizando inteligencia artificial avanzada.
                </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">

                {/* Controls Column */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 space-y-6">

                        {/* Prompt Input */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                                ¿Qué quieres crear?
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Ej: Un paisaje futurista con ciudades de cristal flotantes al atardecer, estilo cyberpunk..."
                                className="w-full h-32 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400 transition-all font-medium text-sm"
                            />
                        </div>

                        {/* Visual Style */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                                Estilo Visual
                            </label>
                            <VisualStylePicker
                                selected={selectedStyle}
                                onSelect={setSelectedStyle}
                                disabled={state.isGenerating}
                            />
                        </div>

                        {/* Aspect Ratio */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                                Formato
                            </label>
                            <AspectRatioPicker
                                selected={selectedRatio}
                                onSelect={setSelectedRatio}
                                disabled={state.isGenerating}
                            />
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={!prompt.trim() || state.isGenerating}
                            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-3"
                        >
                            {state.isGenerating ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Generando...</span>
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-5 h-5" />
                                    <span>Generar Portada</span>
                                </>
                            )}
                        </button>

                        {/* Error Message */}
                        {state.error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-2xl text-sm flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p>{state.error}</p>
                            </div>
                        )}
                    </div>

                    {/* Tips */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-3xl border border-indigo-100 dark:border-indigo-900/50">
                        <h4 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm mb-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Tips para mejores resultados
                        </h4>
                        <ul className="text-xs text-indigo-800/80 dark:text-indigo-300/80 space-y-1.5 list-disc list-inside">
                            <li>Sé específico con la iluminación (ej: "luz dramática").</li>
                            <li>Menciona el ambiente (ej: "misterioso", "alegre").</li>
                            <li>Prueba diferentes estilos para la misma idea.</li>
                        </ul>
                    </div>
                </div>

                {/* Result Column */}
                <div className="lg:col-span-7">
                    <ImageResult
                        image={state.currentImage?.url || null}
                        isGenerating={state.isGenerating}
                        prompt={state.currentImage?.prompt || prompt}
                    />

                    {/* History Preview (Optional) */}
                    {state.history.length > 0 && (
                        <div className="mt-8">
                            <div className="flex items-center gap-2 mb-4 px-2">
                                <History className="w-4 h-4 text-slate-400" />
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Recientes</h3>
                            </div>
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                                {state.history.slice(0, 5).map((img) => (
                                    <button
                                        key={img.id}
                                        onClick={() => setState(prev => ({ ...prev, currentImage: img }))}
                                        className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${state.currentImage?.id === img.id
                                                ? 'border-indigo-600 ring-2 ring-indigo-100 dark:ring-indigo-900'
                                                : 'border-transparent hover:border-indigo-300'
                                            }`}
                                    >
                                        <img src={img.url} alt="mini" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
