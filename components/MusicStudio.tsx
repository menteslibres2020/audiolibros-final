
import React, { useState, useRef, useEffect } from 'react';
import { resampleBuffer, audioBufferToWavBlob } from '../utils/audioUtils.ts';

const MusicStudio: React.FC = () => {
    const [baseTrack, setBaseTrack] = useState<File | null>(null);
    const [voiceTrack, setVoiceTrack] = useState<File | null>(null);
    const [baseVolume, setBaseVolume] = useState(0.5);
    const [voiceVolume, setVoiceVolume] = useState(1.0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [mixedAudioBlob, setMixedAudioBlob] = useState<Blob | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodesRef = useRef<AudioBufferSourceNode[]>([]);
    const gainNodesRef = useRef<GainNode[]>([]);
    const startTimeRef = useRef<number>(0);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            stopAudio();
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const handleBaseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setBaseTrack(e.target.files[0]);
    };

    const handleVoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setVoiceTrack(e.target.files[0]);
    };

    const loadAudioFile = async (file: File, ctx: AudioContext): Promise<AudioBuffer> => {
        const arrayBuffer = await file.arrayBuffer();
        return await ctx.decodeAudioData(arrayBuffer);
    };

    const stopAudio = () => {
        sourceNodesRef.current.forEach(node => {
            try { node.stop(); } catch (e) { /* ignore */ }
        });
        sourceNodesRef.current = [];
        gainNodesRef.current = [];
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        setIsPlaying(false);
    };

    const playPreview = async () => {
        if (isPlaying) {
            stopAudio();
            return;
        }

        if (!baseTrack && !voiceTrack) return;

        setIsProcessing(true);
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = ctx;

            const sources: AudioBufferSourceNode[] = [];
            const gains: GainNode[] = [];

            let maxDuration = 0;

            if (baseTrack) {
                const buffer = await loadAudioFile(baseTrack, ctx);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                const gain = ctx.createGain();
                gain.gain.value = baseVolume;
                source.connect(gain).connect(ctx.destination);
                sources.push(source);
                gains.push(gain);
                if (buffer.duration > maxDuration) maxDuration = buffer.duration;
            }

            if (voiceTrack) {
                const buffer = await loadAudioFile(voiceTrack, ctx);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                const gain = ctx.createGain();
                gain.gain.value = voiceVolume;
                source.connect(gain).connect(ctx.destination);
                sources.push(source);
                gains.push(gain);
                if (buffer.duration > maxDuration) maxDuration = buffer.duration;
            }

            sourceNodesRef.current = sources;
            gainNodesRef.current = gains;
            setDuration(maxDuration);

            startTimeRef.current = ctx.currentTime;
            sources.forEach(source => source.start(0));
            setIsPlaying(true);

            const updateProgress = () => {
                if (!ctx) return;
                const elapsed = ctx.currentTime - startTimeRef.current;
                if (elapsed >= maxDuration) {
                    stopAudio();
                    setCurrentTime(0);
                } else {
                    setCurrentTime(elapsed);
                    animationFrameRef.current = requestAnimationFrame(updateProgress);
                }
            };
            updateProgress();

        } catch (err) {
            console.error("Error playing audio:", err);
            alert("Error al reproducir audio. Verifica los formatos.");
        } finally {
            setIsProcessing(false);
        }
    };

    const exportMix = async () => {
        if (!baseTrack && !voiceTrack) return;
        setIsProcessing(true);
        try {
            // 1. Setup Offline Context
            // We need to know duration first.
            const tempCtx = new OfflineAudioContext(1, 1, 44100); // Dummy context to decode length
            let maxDuration = 0;
            let baseBuffer: AudioBuffer | null = null;
            let voiceBuffer: AudioBuffer | null = null;

            if (baseTrack) {
                baseBuffer = await tempCtx.decodeAudioData(await baseTrack.arrayBuffer());
                if (baseBuffer.duration > maxDuration) maxDuration = baseBuffer.duration;
            }
            if (voiceTrack) {
                voiceBuffer = await tempCtx.decodeAudioData(await voiceTrack.arrayBuffer());
                if (voiceBuffer.duration > maxDuration) maxDuration = voiceBuffer.duration;
            }

            // 2. Real Offline Context
            const offlineCtx = new OfflineAudioContext(2, maxDuration * 44100, 44100);

            if (baseBuffer) {
                // Resample if needed
                const resampled = await resampleBuffer(baseBuffer, 44100);
                const source = offlineCtx.createBufferSource();
                source.buffer = resampled;
                const gain = offlineCtx.createGain();
                gain.gain.value = baseVolume;
                source.connect(gain).connect(offlineCtx.destination);
                source.start(0);
            }

            if (voiceBuffer) {
                const resampled = await resampleBuffer(voiceBuffer, 44100);
                const source = offlineCtx.createBufferSource();
                source.buffer = resampled;
                const gain = offlineCtx.createGain();
                gain.gain.value = voiceVolume;
                source.connect(gain).connect(offlineCtx.destination);
                source.start(0);
            }

            const renderedBuffer = await offlineCtx.startRendering();
            const blob = await audioBufferToWavBlob(renderedBuffer);
            setMixedAudioBlob(blob);

        } catch (err) {
            console.error("Error exporting mix:", err);
            alert("Error al exportar la mezcla.");
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        // Update volume in real-time if playing
        if (isPlaying && gainNodesRef.current.length > 0) {
            // Assuming order: base is 0 (if present), voice is 1 (if present).
            // This logic is simplistic; robust implementation would track by ID.
            // For now, re-triggering play stops specific adjustment not ideal but volume state is used at start.
            // To allow real-time volume adjustment:
            let index = 0;
            if (baseTrack && gainNodesRef.current[index]) {
                gainNodesRef.current[index].gain.setValueAtTime(baseVolume, audioContextRef.current?.currentTime || 0);
                index++;
            }
            if (voiceTrack && gainNodesRef.current[index]) {
                gainNodesRef.current[index].gain.setValueAtTime(voiceVolume, audioContextRef.current?.currentTime || 0);
            }
        }
    }, [baseVolume, voiceVolume, isPlaying, baseTrack, voiceTrack]);


    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <i className="fa-solid fa-music text-9xl"></i>
                </div>

                <div className="flex items-center gap-4 mb-8 relative z-10">
                    <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
                        <i className="fa-solid fa-sliders text-xl"></i>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Estudio Musical</h2>
                        <p className="text-slate-500 font-medium text-sm">Mezcla música de fondo con tu narración profesional.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    {/* BASE TRACK */}
                    <div className={`p-6 rounded-2xl border-2 transition-all ${baseTrack ? 'border-orange-500/50 bg-orange-50/30' : 'border-slate-100 bg-slate-50'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Pista de Fondo (Música)</h3>
                            {baseTrack && <i className="fa-solid fa-check-circle text-orange-500"></i>}
                        </div>

                        <label className="block w-full cursor-pointer group">
                            <input type="file" accept="audio/*" onChange={handleBaseUpload} className="hidden" />
                            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-slate-300 rounded-xl group-hover:border-orange-400 group-hover:bg-white transition-all">
                                <i className={`fa-solid fa-compact-disc text-3xl mb-3 ${baseTrack ? 'text-orange-500 animate-spin-slow' : 'text-slate-300'}`}></i>
                                <span className="text-xs font-bold text-slate-500 group-hover:text-orange-600">
                                    {baseTrack ? baseTrack.name : 'Subir Música (MP3/WAV)'}
                                </span>
                            </div>
                        </label>

                        <div className="mt-6 space-y-2">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                                <span>Silencio</span>
                                <span>Volumen: {Math.round(baseVolume * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="1" step="0.05"
                                value={baseVolume}
                                onChange={(e) => setBaseVolume(parseFloat(e.target.value))}
                                className="w-full accent-orange-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* VOICE TRACK */}
                    <div className={`p-6 rounded-2xl border-2 transition-all ${voiceTrack ? 'border-indigo-500/50 bg-indigo-50/30' : 'border-slate-100 bg-slate-50'}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Pista de Voz (Narración)</h3>
                            {voiceTrack && <i className="fa-solid fa-check-circle text-indigo-500"></i>}
                        </div>

                        <label className="block w-full cursor-pointer group">
                            <input type="file" accept="audio/*" onChange={handleVoiceUpload} className="hidden" />
                            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-slate-300 rounded-xl group-hover:border-indigo-400 group-hover:bg-white transition-all">
                                <i className={`fa-solid fa-microphone-lines text-3xl mb-3 ${voiceTrack ? 'text-indigo-500' : 'text-slate-300'}`}></i>
                                <span className="text-xs font-bold text-slate-500 group-hover:text-indigo-600">
                                    {voiceTrack ? voiceTrack.name : 'Subir Voz (MP3/WAV)'}
                                </span>
                            </div>
                        </label>

                        <div className="mt-6 space-y-2">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                                <span>Silencio</span>
                                <span>Volumen: {Math.round(voiceVolume * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="1.5" step="0.05"
                                value={voiceVolume}
                                onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
                                className="w-full accent-indigo-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* CONTROLS */}
                <div className="mt-8 flex items-center justify-center gap-4 relative z-10">
                    <button
                        onClick={playPreview}
                        disabled={!baseTrack && !voiceTrack}
                        className={`h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all ${isPlaying ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                    >
                        {isProcessing ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className={`fa-solid ${isPlaying ? 'fa-stop' : 'fa-play'}`}></i>}
                    </button>

                    <button
                        onClick={exportMix}
                        disabled={(!baseTrack && !voiceTrack) || isProcessing}
                        className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold shadow-lg hover:shadow-orange-200 hover:-translate-y-0.5 transition-all flex items-center gap-3"
                    >
                        {isProcessing ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-file-export"></i>}
                        <span>Exportar Mezcla Final</span>
                    </button>
                </div>

                {mixedAudioBlob && (
                    <div className="mt-8 p-4 bg-green-50 border border-green-100 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><i className="fa-solid fa-check"></i></div>
                            <div>
                                <p className="text-sm font-bold text-green-800">Mezcla lista para descargar</p>
                                <p className="text-xs text-green-600">{(mixedAudioBlob.size / 1024 / 1024).toFixed(2)} MB • WAV 32-bit Float</p>
                            </div>
                        </div>
                        <a
                            href={URL.createObjectURL(mixedAudioBlob)}
                            download="Mezcla_Maestra_Libroteca.wav"
                            className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Descargar
                        </a>
                    </div>
                )}

            </div>
        </div>
    );
};

export default MusicStudio;
