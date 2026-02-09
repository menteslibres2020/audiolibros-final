
import React, { useState, useRef } from 'react';
import { audioBufferToWavBlob, resampleBuffer } from '../utils/audioUtils';
import { mixAudioWithDucking, generateAmbientPad } from '../utils/audioMixerUtils';

const MusicStudio: React.FC = () => {
    const [voiceFile, setVoiceFile] = useState<File | null>(null);
    const [musicFile, setMusicFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [duckingRatio, setDuckingRatio] = useState(0.2); // 20% volume during narration
    const [musicVolume, setMusicVolume] = useState(0.4);   // 40% base music volume
    const [generatedMood, setGeneratedMood] = useState<'tense' | 'hopeful' | 'neutral' | null>(null);

    const voiceInputRef = useRef<HTMLInputElement>(null);
    const musicInputRef = useRef<HTMLInputElement>(null);

    const handleVoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setVoiceFile(e.target.files[0]);
        }
    };

    const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setMusicFile(e.target.files[0]);
            setGeneratedMood(null); // Clear generated mood if uploading custom music
        }
    };

    const handleGenerateAmbient = (mood: 'tense' | 'hopeful' | 'neutral') => {
        setGeneratedMood(mood);
        setMusicFile(null); // Clear custom file if generating
    };

    const processMix = async () => {
        if (!voiceFile || (!musicFile && !generatedMood)) return;
        setIsProcessing(true);

        try {
            // 1. Create a standard context for decoding (browser usually picks 44100 or 48000)
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const MASTER_SAMPLE_RATE = 44100; // Force standard CD quality to avoid playback speed issues

            // 2. Decode Voice & Resample to Master Rate
            const voiceArrayBuffer = await voiceFile.arrayBuffer();
            const rawVoiceBuffer = await audioContext.decodeAudioData(voiceArrayBuffer);
            const voiceBuffer = await resampleBuffer(rawVoiceBuffer, MASTER_SAMPLE_RATE);

            // 3. Prepare Music Buffer & Resample to Master Rate
            let musicBuffer: AudioBuffer;

            if (musicFile) {
                const musicArrayBuffer = await musicFile.arrayBuffer();
                const rawMusicBuffer = await audioContext.decodeAudioData(musicArrayBuffer);
                musicBuffer = await resampleBuffer(rawMusicBuffer, MASTER_SAMPLE_RATE);
            } else if (generatedMood) {
                // Generate Ambient Pad at correct rate
                // Pass a dummy context with correct rate or use OfflineAudioContext
                const genContext = new OfflineAudioContext(2, 1, MASTER_SAMPLE_RATE);
                const rawGenBuffer = generateAmbientPad(genContext as unknown as AudioContext, voiceBuffer.duration + 5, generatedMood);
                musicBuffer = rawGenBuffer;
            } else {
                throw new Error("No music source selected");
            }

            // 4. Mix with Ducking
            // Create context at master rate for mixing params
            const mixContext = new OfflineAudioContext(2, 1, MASTER_SAMPLE_RATE);

            const mixedBuffer = mixAudioWithDucking(voiceBuffer, musicBuffer, mixContext as unknown as AudioContext, {
                duckingThreshold: 0.02, // Sensitivity
                duckingRatio: duckingRatio,
                attackTime: 0.2, // 200ms fade down
                releaseTime: 0.8, // 800ms fade up
                musicVolume: musicVolume
            });

            // 4. Export
            const wavBlob = audioBufferToWavBlob(mixedBuffer);
            const url = URL.createObjectURL(wavBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Master_Final_${generatedMood || 'Custom'}_${Date.now()}.wav`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (err) {
            console.error("Error mixing audio:", err);
            alert("Error al procesar el audio. Intenta con archivos diferentes.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="w-14 h-14 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900 leading-none">Musicalización IA</h2>
                    <p className="text-slate-500 text-sm font-medium mt-1">Mezcla inteligente con auto-ducking y generación de ambientes.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Step 1: Voice Input */}
                <div className="space-y-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Paso 1: Voz Narrador</span>
                    <div
                        onClick={() => voiceInputRef.current?.click()}
                        className={`cursor-pointer border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all group ${voiceFile ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-pink-400 hover:bg-pink-50'}`}
                    >
                        <input type="file" ref={voiceInputRef} onChange={handleVoiceUpload} className="hidden" accept="audio/*" />

                        {voiceFile ? (
                            <>
                                <i className="fa-solid fa-microphone-lines text-3xl text-green-600 mb-3"></i>
                                <p className="font-bold text-slate-800 text-sm">{voiceFile.name}</p>
                                <p className="text-[10px] text-green-600 font-bold uppercase mt-1">Cargado Correctamente</p>
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-cloud-arrow-up text-3xl text-slate-300 group-hover:text-pink-400 mb-3 transition-colors"></i>
                                <p className="font-bold text-slate-600 text-sm">Subir Audio de Voz</p>
                                <p className="text-[10px] text-slate-400 mt-1">MP3, WAV o M4A</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Step 2: Music Input */}
                <div className="space-y-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Paso 2: Música de Fondo</span>

                    <div className="space-y-3">
                        {/* Option A: Upload */}
                        <div
                            onClick={() => musicInputRef.current?.click()}
                            className={`cursor-pointer border-2 border-dashed rounded-2xl p-4 flex items-center gap-4 transition-all group ${musicFile ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}
                        >
                            <input type="file" ref={musicInputRef} onChange={handleMusicUpload} className="hidden" accept="audio/*" />
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${musicFile ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                <i className="fa-solid fa-music"></i>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-xs text-slate-800 truncate">{musicFile ? musicFile.name : "Subir mi propia música"}</p>
                                {musicFile && <p className="text-[9px] text-indigo-600 font-bold uppercase">Archivo Personal Seleccionado</p>}
                            </div>
                            {musicFile && <i className="fa-solid fa-check text-indigo-500"></i>}
                        </div>

                        <div className="flex items-center gap-2 my-2">
                            <div className="h-px bg-slate-200 flex-1"></div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">O generar Ambiente IA</span>
                            <div className="h-px bg-slate-200 flex-1"></div>
                        </div>

                        {/* Option B: AI Generation */}
                        <div className="grid grid-cols-3 gap-2">
                            {(['tense', 'hopeful', 'neutral'] as const).map(mood => (
                                <button
                                    key={mood}
                                    onClick={() => handleGenerateAmbient(mood)}
                                    className={`p-2 rounded-xl border flex flex-col items-center gap-2 transition-all ${generatedMood === mood ? 'border-pink-500 bg-pink-600 text-white shadow-md' : 'border-slate-200 bg-white text-slate-500 hover:border-pink-200 hover:bg-pink-50'}`}
                                >
                                    <i className={`fa-solid ${mood === 'tense' ? 'fa-bolt' : mood === 'hopeful' ? 'fa-sun' : 'fa-water'} text-lg`}></i>
                                    <span className="text-[9px] font-bold uppercase">{mood === 'tense' ? 'Suspenso' : mood === 'hopeful' ? 'Esperanza' : 'Neutro'}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold text-slate-700">Volumen Música (Base)</label>
                            <span className="text-xs font-bold text-indigo-600">{Math.round(musicVolume * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0.1" max="1.0" step="0.1"
                            value={musicVolume}
                            onChange={e => setMusicVolume(parseFloat(e.target.value))}
                            className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold text-slate-700" title="Volumen de la música cuando habla el narrador">Intensidad Ducking</label>
                            <span className="text-xs font-bold text-indigo-600" title="Nivel al que baja la música">{Math.round(duckingRatio * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0.0" max="0.6" step="0.05"
                            value={duckingRatio}
                            onChange={e => setDuckingRatio(parseFloat(e.target.value))}
                            className="w-full accent-pink-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-[9px] text-slate-400 mt-1">Menor % = Música más baja cuando hay voz.</p>
                    </div>
                </div>

                <button
                    onClick={processMix}
                    disabled={isProcessing || !voiceFile || (!musicFile && !generatedMood)}
                    className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg ${isProcessing || !voiceFile || (!musicFile && !generatedMood)
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-pink-500 to-indigo-600 text-white hover:scale-[1.01] hover:shadow-xl'
                        }`}
                >
                    {isProcessing ? (
                        <>
                            <i className="fa-solid fa-compact-disc animate-spin"></i>
                            <span>Procesando Mezcla Maestra...</span>
                        </>
                    ) : (
                        <>
                            <i className="fa-solid fa-volume-high"></i>
                            <span>Generar Audio Final</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default MusicStudio;
