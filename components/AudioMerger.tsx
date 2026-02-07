import React, { useState, useRef } from 'react';
import { mergeAudioBuffers, audioBufferToWavBlob } from '../utils/audioUtils';

interface AudioFile {
    id: string;
    file: File;
    name: string;
}

const AudioMerger: React.FC = () => {
    const [files, setFiles] = useState<AudioFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map((file: File) => ({
                id: Math.random().toString(36).substr(2, 9),
                file,
                name: file.name
            }));
            setFiles(prev => [...prev, ...newFiles]);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const moveFile = (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === files.length - 1)
        ) return;

        const newFiles = [...files];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
        setFiles(newFiles);
    };

    const removeFile = (id: string) => {
        setFiles(files.filter(f => f.id !== id));
    };

    const handleMerge = async () => {
        if (files.length === 0) return;
        setIsProcessing(true);
        setProgress(0);

        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const buffers: AudioBuffer[] = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const arrayBuffer = await file.file.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                buffers.push(audioBuffer);
                setProgress(((i + 1) / files.length) * 80); // 80% progress for decoding
            }

            const mergedBuffer = mergeAudioBuffers(buffers, audioContext);
            setProgress(90);
            const wavBlob = audioBufferToWavBlob(mergedBuffer);
            setProgress(100);

            const url = URL.createObjectURL(wavBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Audio_Fusionado_${Date.now()}.wav`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Error merging files:", err);
            alert("Error al procesar los archivos. Asegúrate de que son formatos de audio válidos.");
        } finally {
            setIsProcessing(false);
            setProgress(0);
        }
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto text-3xl mb-4">
                    <i className="fa-solid fa-layer-group"></i>
                </div>
                <h2 className="text-2xl font-black text-slate-900">Estudio de Fusión</h2>
                <p className="text-slate-500 text-sm font-medium">Sube múltiples audios, ordénalos y crea un track maestro único.</p>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 border-dashed p-8 text-center space-y-4">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    accept="audio/*"
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-white text-purple-600 font-bold rounded-xl shadow-sm border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all flex items-center gap-2 mx-auto"
                >
                    <i className="fa-solid fa-cloud-arrow-up"></i>
                    <span>Seleccionar Audios</span>
                </button>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Soporta MP3, WAV, M4A</p>
            </div>

            {files.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Secuencia de Reproducción ({files.length})</span>
                        <button onClick={() => setFiles([])} className="text-[10px] text-red-500 font-bold hover:underline">Limpiar Todo</button>
                    </div>

                    <div className="space-y-2">
                        {files.map((file, index) => (
                            <div key={file.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3 shadow-sm group hover:border-purple-200 transition-colors">
                                <span className="w-6 h-6 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">{index + 1}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-700 truncate">{file.name}</p>
                                    <p className="text-[10px] text-slate-400">{(file.file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>

                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => moveFile(index, 'up')}
                                        disabled={index === 0}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-purple-600 disabled:opacity-30 transition-colors"
                                    >
                                        <i className="fa-solid fa-chevron-up"></i>
                                    </button>
                                    <button
                                        onClick={() => moveFile(index, 'down')}
                                        disabled={index === files.length - 1}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-purple-600 disabled:opacity-30 transition-colors"
                                    >
                                        <i className="fa-solid fa-chevron-down"></i>
                                    </button>
                                    <div className="w-px h-4 bg-slate-200 mx-1"></div>
                                    <button
                                        onClick={() => removeFile(file.id)}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <button
                onClick={handleMerge}
                disabled={isProcessing || files.length < 2}
                className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-3 ${isProcessing || files.length < 2
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-xl hover:scale-[1.01]'
                    }`}
            >
                {isProcessing ? (
                    <>
                        <i className="fa-solid fa-circle-notch animate-spin"></i>
                        <span>Fusionando ({Math.round(progress)}%)...</span>
                    </>
                ) : (
                    <>
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                        <span>Fusionar y Descargar Master</span>
                    </>
                )}
            </button>
        </div>
    );
};

export default AudioMerger;
