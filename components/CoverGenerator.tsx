import React, { useState, useRef, useEffect } from 'react';
import { ttsService } from '../services/geminiService';

interface CoverGeneratorProps {
    initialTitle?: string;
    initialAuthor?: string;
    emotion?: string;
    onClose: () => void;
}

const CoverGenerator: React.FC<CoverGeneratorProps> = ({
    initialTitle = '',
    initialAuthor = '',
    emotion = 'Neutral',
    onClose
}) => {
    const [title, setTitle] = useState(initialTitle);
    const [author, setAuthor] = useState(initialAuthor);
    const [style, setStyle] = useState('Cinematic');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageData, setImageData] = useState<string | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const STYLES = ['Cinematic', 'Abstract Art', 'Oil Painting', 'Minimalist', 'Fantasy', 'Dark Noir'];

    const generateCover = async () => {
        setLoading(true);
        setError(null);
        try {
            // Create a rich prompt
            // Create a rich prompt - Explicitly requesting NO TEXT
            const prompt = `Professional book cover illustration for "${title}", emotion: "${emotion}", style: ${style}. High resolution, 1:1 square. IMPORTANT: NO text, NO letters, NO characters in the image. Create only the visual background artwork. The title will be overlayed separately.`;

            const base64Image = await ttsService.generateImage(prompt);
            setImageData(base64Image);
        } catch (err: any) {
            setError(err.message || "Error generando imagen");
        } finally {
            setLoading(false);
        }
    };

    // Draw composition
    useEffect(() => {
        if (!canvasRef.current || !imageData) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageData;

        img.onload = () => {
            // 1. Draw Image
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // 2. Add Dark Gradient Overlay for Text Readability
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, 'rgba(0,0,0,0.1)');
            gradient.addColorStop(0.5, 'rgba(0,0,0,0)');
            gradient.addColorStop(0.8, 'rgba(0,0,0,0.6)');
            gradient.addColorStop(1, 'rgba(0,0,0,0.9)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 3. Draw Title (Bottom Center usually looks modern, or Top)
            // Let's do a nice layout: Title big, Author small below
            const centerX = canvas.width / 2;

            // Title
            ctx.shadowColor = "black";
            ctx.shadowBlur = 10;
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";

            // Dynamic font size based on length
            const fontSize = title.length > 20 ? 60 : 80;
            ctx.font = `bold ${fontSize}px "Inter", sans-serif`;

            // Wrap text
            const maxWidth = canvas.width - 60;
            const words = title.split(' ');
            let line = '';
            let y = canvas.height - 120;
            const lineHeight = fontSize + 10;

            // Simple wrapping (reverse for bottom up? No, let's draw from a set point)
            // Actually, let's draw author at bottom, title above it.

            // Author at bottom
            ctx.font = `500 30px "Inter", sans-serif`;
            ctx.fillStyle = "#e0e7ff"; // Indigo-100ish
            ctx.fillText(author.toUpperCase(), centerX, canvas.height - 40);

            // Title above Author
            ctx.font = `900 ${fontSize}px "Inter", sans-serif`;
            ctx.fillStyle = "white";

            // Handle multi-line title drawing upwards from author
            const lines = [];
            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && n > 0) {
                    lines.push(line);
                    line = words[n] + ' ';
                } else {
                    line = testLine;
                }
            }
            lines.push(line);

            // Draw lines
            let titleY = canvas.height - 100 - (lines.length * lineHeight);
            lines.forEach((l, i) => {
                ctx.fillText(l.trim(), centerX, titleY + (i * lineHeight) + lineHeight);
            });
        };
    }, [imageData, title, author]);

    const downloadCover = () => {
        const link = document.createElement('a');
        link.download = `Portada-${title.replace(/\s+/g, '-')}.png`;
        link.href = canvasRef.current?.toDataURL() || '';
        link.click();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95">

                {/* Left: Controls */}
                <div className="w-full md:w-1/2 p-6 md:p-8 space-y-6 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black text-slate-900 leading-tight">Diseñador de Portadas</h3>
                        <button onClick={onClose} className="md:hidden w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Título del Libro</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-sm font-bold bg-white" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Autor</label>
                            <input type="text" value={author} onChange={e => setAuthor(e.target.value)} className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-sm font-bold bg-white" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estilo Visual</label>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                {STYLES.map(s => (
                                    <button key={s} onClick={() => setStyle(s)} className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${style === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'}`}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {error && <p className="text-xs text-red-600 font-bold bg-red-50 p-3 rounded-lg">{error}</p>}

                    <button
                        onClick={generateCover}
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-black shadow-lg flex items-center justify-center gap-2 text-sm uppercase tracking-wider text-white transition-all ${loading ? 'bg-indigo-400' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-indigo-500/30'}`}
                    >
                        {loading ? <><i className="fa-solid fa-spinner animate-spin"></i> Creando...</> : <><i className="fa-solid fa-wand-magic-sparkles"></i> Generar Arte IA</>}
                    </button>
                </div>

                {/* Right: Preview */}
                <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col items-center justify-center bg-slate-900 relative">
                    <button onClick={onClose} className="hidden md:flex absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 items-center justify-center transition-colors"><i className="fa-solid fa-xmark"></i></button>

                    <div className="relative shadow-2xl rounded-lg overflow-hidden group">
                        {/* Canvas */}
                        <canvas
                            ref={canvasRef}
                            width={1024}
                            height={1024}
                            className="w-full max-w-[320px] aspect-square bg-white object-cover"
                        />

                        {!imageData && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-500 flex-col gap-2">
                                <i className="fa-solid fa-image text-4xl"></i>
                                <span className="text-xs font-bold uppercase">Vista Previa</span>
                            </div>
                        )}
                    </div>

                    {imageData && (
                        <button onClick={downloadCover} className="mt-8 px-8 py-3 bg-white text-slate-900 rounded-full font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                            <i className="fa-solid fa-download"></i> Descargar Portada
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default CoverGenerator;
