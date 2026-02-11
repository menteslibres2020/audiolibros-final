
import React, { useState, useEffect } from 'react';
import { ImageGeminiService } from '../services/geminiImageService';
import { AspectRatio, VisualStyle, GeneratedImage, GenerationState } from '../typesImage';
import AspectRatioPicker from './AspectRatioPicker';
import VisualStylePicker from './VisualStylePicker';
import ImageResult from './ImageResult';

const ImageCreatorTab: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [selectedRatio, setSelectedRatio] = useState<AspectRatio>('1:1');
    const [selectedStyle, setSelectedStyle] = useState<VisualStyle>('Cinematic');
    const [state, setState] = useState<GenerationState>({
        isGenerating: false,
        error: null,
        currentImage: null,
        history: [],
    });

    useEffect(() => {
        const savedHistory = localStorage.getItem('libroteca_studio_history_v2');
        if (savedHistory) {
            try {
                const parsed = JSON.parse(savedHistory);
                setState(prev => ({ ...prev, history: Array.isArray(parsed) ? parsed : [] }));
            } catch (e) {
                console.error("Error loading history", e);
            }
        }
    }, []);

    useEffect(() => {
        if (state.history.length > 0) {
            localStorage.setItem('libroteca_studio_history_v2', JSON.stringify(state.history.slice(0, 20)));
        }
    }, [state.history]);

    const handleGenerate = async () => {
        if (!prompt.trim() || state.isGenerating) return;

        setState(prev => ({ ...prev, isGenerating: true, error: null }));

        try {
            const gemini = ImageGeminiService.getInstance();
            const imageUrl = await gemini.generateImage(prompt, selectedRatio, selectedStyle);

            const newImage: GeneratedImage = {
                id: Math.random().toString(36).substr(2, 6).toUpperCase(),
                url: imageUrl,
                prompt: prompt,
                title: title,
                subtitle: subtitle,
                aspectRatio: selectedRatio,
                visualStyle: selectedStyle,
                timestamp: Date.now(),
            };

            setState(prev => ({
                ...prev,
                isGenerating: false,
                currentImage: newImage,
                history: [newImage, ...prev.history],
            }));
        } catch (err: any) {
            console.error("Generation failed:", err);
            setState(prev => ({
                ...prev,
                isGenerating: false,
                error: err.message || "Fallo en la conexión creativa.",
            }));
        }
    };

    return (
        <div className="bg-[#f8fafc] font-['Inter'] selection:bg-indigo-100 selection:text-indigo-900 rounded-[3rem] overflow-hidden">
            <div className="max-w-[1600px] mx-auto w-full p-6 md:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

                    <div className="lg:col-span-8 space-y-10">
                        <div className="bg-white rounded-[3.5rem] border border-[#f1f5f9] p-6 md:p-12 shadow-[0_8px_40px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_40px_rgba(0,0,0,0.05)]">
                            <div className="flex items-center gap-6 mb-12">
                                <div className="w-16 h-16 bg-gradient-to-br from-[#a78bfa] to-[#8b5cf6] rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-purple-200">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-[#1e293b] tracking-tight">Estudio Creativo</h2>
                                    <p className="text-[11px] text-[#8b5cf6] font-extrabold uppercase tracking-widest mt-1">Generación de Portadas IA</p>
                                </div>
                            </div>

                            <div className="space-y-12">
                                <div className="bg-[#fcfdfe] p-6 md:p-10 rounded-[3rem] border border-[#f1f5f9] transition-all focus-within:ring-4 focus-within:ring-indigo-50/50 focus-within:bg-white focus-within:border-indigo-200 shadow-inner">
                                    <label className="block text-[10px] font-black text-[#94a3b8] uppercase tracking-widest mb-4 px-2">Concepto Visual</label>
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        className="w-full bg-transparent border-none outline-none text-lg font-medium text-[#334155] placeholder:text-[#cbd5e1] min-h-[120px] resize-none leading-relaxed px-2"
                                        placeholder="Describe el alma de tu obra para la IA..."
                                    />

                                    {state.error && (
                                        <div className="mt-6 p-5 bg-red-50 border border-red-100 rounded-[1.5rem] flex items-center gap-4 text-red-600 text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                            </div>
                                            {state.error}
                                        </div>
                                    )}

                                    <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-end border-t border-[#f1f5f9] pt-10">
                                        <VisualStylePicker
                                            selected={selectedStyle}
                                            onSelect={setSelectedStyle}
                                            disabled={state.isGenerating}
                                        />

                                        <div className="flex flex-col">
                                            <button
                                                onClick={handleGenerate}
                                                disabled={state.isGenerating || !prompt.trim()}
                                                className="relative overflow-hidden group bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white px-8 py-6 rounded-full text-[14px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50 shadow-[0_12px_32px_-4px_rgba(99,102,241,0.4)] transition-all hover:shadow-[0_16px_40px_-4px_rgba(99,102,241,0.5)] hover:-translate-y-1 active:translate-y-0 active:scale-95 border border-white/20"
                                            >
                                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
                                                {state.isGenerating ? (
                                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : (
                                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" /></svg>
                                                )}
                                                <span className="relative z-10">{state.isGenerating ? 'Revelando...' : 'Generar Arte IA'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="p-8 bg-white rounded-[2.5rem] border border-[#f1f5f9] shadow-sm hover:border-indigo-200 transition-all group">
                                        <label className="block text-[10px] font-black text-[#94a3b8] uppercase tracking-widest mb-2 group-hover:text-indigo-400 transition-colors">Título Principal</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full bg-transparent border-none outline-none text-xl font-black text-[#1e293b] tracking-tight placeholder:text-slate-200"
                                            placeholder="Ej: La Metamorfosis"
                                        />
                                    </div>
                                    <div className="p-8 bg-white rounded-[2.5rem] border border-[#f1f5f9] shadow-sm hover:border-indigo-200 transition-all group">
                                        <label className="block text-[10px] font-black text-[#94a3b8] uppercase tracking-widest mb-2 group-hover:text-indigo-400 transition-colors">Bajada o Autor</label>
                                        <input
                                            type="text"
                                            value={subtitle}
                                            onChange={(e) => setSubtitle(e.target.value)}
                                            className="w-full bg-transparent border-none outline-none text-xl font-bold text-[#64748b] placeholder:text-slate-200"
                                            placeholder="Ej: Franz Kafka"
                                        />
                                    </div>
                                </div>

                                <div className="p-8 md:p-12 bg-[#fcfdfe] rounded-[3.5rem] border border-[#f1f5f9] shadow-inner">
                                    <label className="block text-[11px] font-black text-[#94a3b8] uppercase tracking-[0.4em] mb-10 text-center">Relación de Aspecto</label>
                                    <AspectRatioPicker
                                        selected={selectedRatio}
                                        onSelect={setSelectedRatio}
                                        disabled={state.isGenerating}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[3.5rem] overflow-hidden border border-[#f1f5f9] shadow-xl shadow-gray-100/50 min-h-[550px] flex flex-col">
                            <ImageResult
                                image={state.currentImage}
                                isGenerating={state.isGenerating}
                                isDark={false}
                            />
                        </div>
                    </div>

                    <div className="lg:col-span-4 lg:sticky lg:top-36 h-fit">
                        <div className="bg-white rounded-[3rem] border border-[#f1f5f9] p-8 flex flex-col max-h-[calc(100vh-180px)] shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#1e293b]">Galería Personal</h3>
                                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg shadow-indigo-100">
                                        {state.history.length}
                                    </div>
                                </div>
                            </div>

                            {/* Contenedor de lista ajustado para evitar recortes */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                                <div className="space-y-6 py-4 px-2">
                                    {state.history.map((img) => (
                                        <div
                                            key={img.id}
                                            onClick={() => {
                                                setState(prev => ({ ...prev, currentImage: img, error: null }));
                                                setTitle(img.title);
                                                setSubtitle(img.subtitle);
                                                setPrompt(img.prompt);
                                                setSelectedRatio(img.aspectRatio);
                                                setSelectedStyle(img.visualStyle || 'Cinematic');
                                            }}
                                            className={`p-6 rounded-[2.5rem] border-2 cursor-pointer transition-all duration-300 group relative ${state.currentImage?.id === img.id
                                                    ? 'bg-gradient-to-br from-[#f8faff] to-[#fcfaff] border-indigo-200 shadow-[0_15px_30px_-5px_rgba(99,102,241,0.15)] scale-[1.02]'
                                                    : 'bg-white border-transparent hover:border-indigo-100 hover:bg-slate-50/50'
                                                }`}
                                        >
                                            <div className="flex gap-5 items-center">
                                                <div className="w-16 h-16 bg-[#f1f5f9] rounded-2xl overflow-hidden flex-shrink-0 shadow-sm border border-white/50">
                                                    <img src={img.url} className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-[4000ms]" alt="" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-[14px] font-black uppercase tracking-tight truncate text-[#1e293b]">{img.title || 'Proyecto Sin Nombre'}</h4>
                                                    </div>
                                                    <p className="text-[10px] text-[#94a3b8] font-bold uppercase mt-1">
                                                        {new Date(img.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {img.visualStyle || 'Estilo Libre'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {state.history.length === 0 && (
                                        <div className="h-64 flex flex-col items-center justify-center text-[#cbd5e1] border-2 border-dashed rounded-[3rem] border-[#f1f5f9] bg-slate-50/30">
                                            <svg className="w-12 h-12 mb-5 opacity-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40">Sin Producciones</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <footer className="py-14 text-center text-[11px] font-black text-[#cbd5e1] uppercase tracking-[1em] mt-auto">
                Libroteca Studio © 2025
            </footer>
        </div>
    );
};

export default ImageCreatorTab;
