
import React, { useState, useRef, useEffect } from "react";
import { ttsService } from "../services/geminiService";

type VideoFormat = 'reel' | 'square' | 'landscape';

const ASPECT_RATIOS = {
    reel: { width: 1080, height: 1920, label: "Story / TikTok / Reel (9:16)", aspectClass: "aspect-[9/16]" },
    square: { width: 1080, height: 1080, label: "Post / Instagram (1:1)", aspectClass: "aspect-square" },
    landscape: { width: 1920, height: 1080, label: "YouTube / Landscape (16:9)", aspectClass: "aspect-video" }
};

const VideoStudio: React.FC = () => {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [prompts, setPrompts] = useState<string[]>([]);
    const [images, setImages] = useState<string[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [progress, setProgress] = useState(0);
    const [format, setFormat] = useState<VideoFormat>('reel');

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // Web Audio API refs for robust capture
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
    const destNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);

    const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAudioFile(e.target.files[0]);
            setPrompts([]);
            setImages([]);
            setProgress(0);
            setIsRecording(false);
        }
    };

    const analyzeAudio = async () => {
        if (!audioFile) return;
        setIsAnalyzing(true);
        try {
            const result = await ttsService.analyzeAudioForVideo(audioFile);
            setPrompts(result);
        } catch (error: any) {
            console.error("Error analyzing audio:", error);
            alert("Error al analizar el audio: " + (error.message || "Error desconocido"));
        } finally {
            setIsAnalyzing(false);
        }
    };

    const generateImages = async () => {
        if (prompts.length === 0) return;
        setIsGenerating(true);
        setImages([]);
        setProgress(0);

        try {
            const newImages: string[] = [];
            for (let i = 0; i < prompts.length; i++) {
                // FORCE Nano Banana (Gemini 2.5 Flash Preview Image) style prompt if needed, 
                // but we rely on geminiService to prioritize 'gemini-2.5-flash-image'
                const imgData = await ttsService.generateImage(prompts[i]);
                newImages.push(imgData);
                setImages([...newImages]);
                setProgress(((i + 1) / prompts.length) * 100);
            }
        } catch (error) {
            console.error("Error generating images:", error);
            alert("Error al generar imágenes.");
        } finally {
            setIsGenerating(false);
        }
    };

    const startRecording = async () => {
        if (!canvasRef.current || !audioRef.current || images.length === 0) return;

        try {
            const canvas = canvasRef.current;
            const audio = audioRef.current;
            audio.crossOrigin = "anonymous"; // Robustness check

            // 1. Setup AudioContext for robust mixing (Fixes captureStream bugs)
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioContextRef.current;

            // Resume context if suspended (common browser policy)
            if (ctx.state === 'suspended') {
                await ctx.resume();
            }

            // Create nodes only once
            if (!sourceNodeRef.current) {
                sourceNodeRef.current = ctx.createMediaElementSource(audio);
                destNodeRef.current = ctx.createMediaStreamDestination();

                // Connect: Source -> Dest (Recorder)
                sourceNodeRef.current.connect(destNodeRef.current);
                // Connect: Source -> Speakers (User hears it)
                sourceNodeRef.current.connect(ctx.destination);
            }

            // 2. Prepare Streams
            const canvasStream = canvas.captureStream(30); // 30 FPS
            const audioStream = destNodeRef.current!.stream;

            const combinedStream = new MediaStream([
                ...canvasStream.getVideoTracks(),
                ...audioStream.getAudioTracks()
            ]);

            // 3. Setup Recorder
            let recorder: MediaRecorder;
            try {
                recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp9' });
            } catch (e) {
                recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' }); // Fallback
            }

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `video_social_${format}_${Date.now()}.webm`;
                a.click();
                setIsRecording(false);
                chunksRef.current = [];
            };

            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            // 4. Start Everything
            recorder.start();
            await audio.play(); // Wait for playback to actually start
            setIsRecording(true);

            // 5. Animation Loop
            const duration = audio.duration || 1; // Prevent div by zero
            const imgDuration = duration / images.length;
            const startTime = Date.now();
            const canvasCtx = canvas.getContext("2d");

            const drawFrame = () => {
                if (!isRecording && (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive")) return;

                // Keep progress updated
                if (audio) {
                    const pct = (audio.currentTime / audio.duration) * 100;
                    setProgress(isNaN(pct) ? 0 : pct);
                }

                // Video Logic
                const currentTime = (Date.now() - startTime) / 1000;

                // Stop if finished
                if (currentTime >= duration || audio.ended) {
                    if (mediaRecorderRef.current?.state === "recording") {
                        mediaRecorderRef.current.stop();
                    }
                    return;
                }

                const imgIndex = Math.min(
                    Math.floor(currentTime / imgDuration),
                    images.length - 1
                );

                if (images[imgIndex] && canvasCtx) {
                    const img = new Image();
                    img.src = images[imgIndex];
                    // Only draw if loaded (using cache effectively)
                    if (img.complete) {
                        // Background blur
                        canvasCtx.filter = "blur(20px) brightness(0.6)";
                        canvasCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        canvasCtx.filter = "none";

                        // Center contain
                        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
                        const w = img.width * scale;
                        const h = img.height * scale;
                        const x = (canvas.width - w) / 2;
                        const y = (canvas.height - h) / 2;

                        canvasCtx.shadowColor = "rgba(0,0,0,0.5)";
                        canvasCtx.shadowBlur = 20;
                        canvasCtx.drawImage(img, x, y, w, h);
                        canvasCtx.shadowBlur = 0;
                    }
                }

                requestAnimationFrame(drawFrame);
            };

            drawFrame();

        } catch (err: any) {
            console.error("Recording error:", err);
            alert("Error al iniciar grabación: " + err.message);
            setIsRecording(false);
            if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
        }
    };

    const stopRecordingManual = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsRecording(false);
    };

    const currentConfig = ASPECT_RATIOS[format];

    return (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                    <i className="fa-solid fa-video"></i>
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900 leading-none">Video Social Studio</h2>
                    <p className="text-slate-500 text-sm font-medium mt-1">Crea videos virales con IA (Gemini Nano Banana).</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Paso 1: Config & Audio */}
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">0. FORMATO DE VIDEO</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setFormat('square')}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${format === 'square' ? 'bg-orange-100 border-orange-500 text-orange-700' : 'bg-white border-slate-200 text-slate-400 hover:border-orange-300'}`}
                            >
                                <i className="fa-regular fa-square text-lg"></i>
                                <span className="text-[10px] font-bold">1:1 (Post)</span>
                            </button>
                            <button
                                onClick={() => setFormat('reel')}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${format === 'reel' ? 'bg-orange-100 border-orange-500 text-orange-700' : 'bg-white border-slate-200 text-slate-400 hover:border-orange-300'}`}
                            >
                                <i className="fa-solid fa-mobile-screen text-lg"></i>
                                <span className="text-[10px] font-bold">9:16 (Reel)</span>
                            </button>
                            <button
                                onClick={() => setFormat('landscape')}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${format === 'landscape' ? 'bg-orange-100 border-orange-500 text-orange-700' : 'bg-white border-slate-200 text-slate-400 hover:border-orange-300'}`}
                            >
                                <i className="fa-brands fa-youtube text-lg"></i>
                                <span className="text-[10px] font-bold">16:9 (YT)</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">1. Sube tu Audio Narrado</label>
                        <input
                            type="file"
                            accept="audio/*"
                            onChange={handleAudioUpload}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                        />
                        {audioFile && (
                            <div className="mt-4">
                                <audio ref={audioRef} controls src={URL.createObjectURL(audioFile)} className="w-full h-10" />
                            </div>
                        )}
                    </div>

                    {audioFile && (
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">2. Análisis & Prompts</label>
                            <button
                                onClick={analyzeAudio}
                                disabled={isAnalyzing}
                                className="w-full py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {isAnalyzing ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-brain"></i>}
                                {isAnalyzing ? "Analizando Audio..." : "Generar Prompts Visuales"}
                            </button>
                            {prompts.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <p className="text-xs font-bold text-green-600">Prompts Generados:</p>
                                    {prompts.map((p, i) => (
                                        <div key={i} className="text-[10px] bg-white p-2 rounded border border-slate-200 text-slate-600 italic">"{p}"</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {prompts.length > 0 && (
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">3. Generación de Imagen (Nano Banana)</label>
                            <button
                                onClick={generateImages}
                                disabled={isGenerating}
                                className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                            >
                                {isGenerating ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                                {isGenerating ? `Generando... ${Math.round(progress)}%` : "Generar Imágenes"}
                            </button>
                        </div>
                    )}
                </div>

                {/* Preview & Export */}
                <div className="bg-slate-900 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[400px] border border-slate-800 relative overflow-hidden">
                    {/* Canvas for Video */}
                    <div className={`relative bg-black shadow-2xl rounded-lg border border-slate-700 overflow-hidden transition-all duration-500 flex items-center justify-center ${currentConfig.aspectClass}`} style={{ maxHeight: '500px', maxWidth: '100%', aspectRatio: format === 'landscape' ? '16/9' : format === 'reel' ? '9/16' : '1' }}>
                        <canvas
                            key={format}
                            ref={canvasRef}
                            width={currentConfig.width}
                            height={currentConfig.height}
                            className="w-full h-full object-contain"
                        />
                    </div>


                    {/* Overlay Controls */}
                    {images.length > 0 && !isRecording && (
                        <div className="absolute bottom-10 left-0 right-0 flex justify-center z-10">
                            <button
                                onClick={startRecording}
                                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-full shadow-xl flex items-center gap-3 animate-bounce"
                            >
                                <i className="fa-solid fa-circle-dot"></i>
                                GRABAR VIDEO FINAL
                            </button>
                        </div>
                    )}

                    {isRecording && (
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-700 shadow-2xl text-center space-y-4">
                                <div className="text-red-500 text-6xl animate-pulse">
                                    <i className="fa-regular fa-circle-dot"></i>
                                </div>
                                <div>
                                    <h3 className="text-white font-black text-xl">GRABANDO VIDEO...</h3>
                                    <p className="text-slate-400 text-xs mt-1">Espera a que termine el audio.</p>
                                </div>
                                <div className="w-64 bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-600 transition-all duration-200" style={{ width: `${progress}%` }}></div>
                                </div>
                                <p className="text-white font-bold font-mono">{Math.round(progress)}%</p>

                                <button onClick={stopRecordingManual} className="text-xs text-slate-500 hover:text-white underline mt-4">
                                    Dejar de grabar y guardar ahora
                                </button>
                            </div>
                        </div>
                    )}

                    {images.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <p className="text-slate-600 font-bold text-center px-6">
                                Las imágenes generadas aparecerán aquí.<br />
                                {currentConfig.label}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <p className="text-center text-[10px] text-slate-400">
                Powered by Gemini 2.5 Flash Preview Image (Nano Banana) & Web Audio API.
            </p>
        </div>
    );
};

export default VideoStudio;
