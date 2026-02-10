
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ttsService } from './services/geminiService.ts';
import { mergeAudioBuffers, audioBufferToWavBlob } from './utils/audioUtils.ts';
import { epubService, EpubChapter } from './services/epubService.ts';
import { persistenceService } from './services/persistenceService.ts';
import VoiceSelector from './components/VoiceSelector.tsx';
import HistoryItem from './components/HistoryItem.tsx';
import AudioMerger from './components/AudioMerger.tsx';

import { VOICES, EMOTIONS } from './constants.ts';
import { NarrationResult } from './types.ts';
import JSZip from 'jszip';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import { Session } from '@supabase/supabase-js';
import SubscriptionGate from './components/SubscriptionGate';
import { stripeService } from './services/stripeService';
import { cloudService } from './services/cloudService';
import ResetPasswordModal from './components/ResetPasswordModal';
import CoverGenerator from './components/CoverGenerator';

const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const [text, setText] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [voiceId, setVoiceId] = useState(VOICES[0].id);
  const [emotion, setEmotion] = useState(EMOTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [mergingChapterId, setMergingChapterId] = useState<string | null>(null);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [tempSegmentText, setTempSegmentText] = useState('');
  const [showStats, setShowStats] = useState(true);
  const [history, setHistory] = useState<NarrationResult[]>([]);
  const [projectCharCount, setProjectCharCount] = useState(0);
  const [error, setError] = useState<{ message: string, isQuota?: boolean } | null>(null);

  const [mode, setMode] = useState<'text' | 'epub' | 'merger' | 'music' | 'video'>('text');
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [chapters, setChapters] = useState<EpubChapter[]>([]);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [currentProgress, setCurrentProgress] = useState({ current: 0, total: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showCoverGenerator, setShowCoverGenerator] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setShowResetPassword(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const saved = await persistenceService.loadState();
        if (saved.text !== undefined) setText(saved.text);
        if (saved.projectTitle !== undefined) setProjectTitle(saved.projectTitle);
        if (saved.voiceId !== undefined) setVoiceId(saved.voiceId);
        if (saved.emotion !== undefined) setEmotion(saved.emotion);
        if (saved.mode !== undefined) setMode(saved.mode);
        if (saved.bookTitle !== undefined) setBookTitle(saved.bookTitle);
        if (saved.bookAuthor !== undefined) setBookAuthor(saved.bookAuthor || "");
        if (saved.chapters !== undefined) setChapters(saved.chapters);
        if (saved.history !== undefined) setHistory(saved.history);
        if (saved.projectCharCount !== undefined) setProjectCharCount(saved.projectCharCount);
      } catch (err) {
        console.error("Error cargando persistencia local:", err);
      } finally {
        setIsReady(true);
      }
    };
    init();
  }, []);

  // Reaccionar a cambios de sesión (Login/Logout) para verificar status PRO y nube
  useEffect(() => {
    const syncUser = async () => {
      if (session?.user) {
        // 1. Verificar Suscripción
        const params = new URLSearchParams(window.location.search);
        const status = await stripeService.checkSubscriptionStatus(session.user.id);
        const isSuccessParam = params.get('status') === 'success';

        if (isSuccessParam) {
          window.history.replaceState({}, document.title, "/");
          alert("¡Bienvenido a PRO! Gracias por suscribirte.");
        }

        setIsPro(status || isSuccessParam);

        // 2. Cargar historial de la nube (funde con local si es necesario, por ahora reemplaza o añade)
        // Nota: Idealmente deberíamos fusionar, por ahora solo añadimos si local está vacío o simple append
        cloudService.fetchUserNarrations().then(cloudHistory => {
          if (cloudHistory.length > 0) {
            // Evitar duplicados simples por ID
            setHistory(prev => {
              const combined = [...cloudHistory, ...prev];
              // Filtrar duplicados por ID
              const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
              // Ordenar por fecha (más reciente primero)
              return unique.sort((a, b) => b.timestamp - a.timestamp);
            });
          }
        });
      } else {
        setIsPro(false);
      }
    };

    syncUser();
  }, [session]);

  useEffect(() => {
    if (!isReady) return;
    const save = async () => {
      await persistenceService.saveState({
        text, projectTitle, voiceId, emotion, mode,
        bookTitle, bookAuthor, history, chapters, projectCharCount
      });
    };
    const timer = setTimeout(save, 1000);
    return () => clearTimeout(timer);
  }, [text, projectTitle, voiceId, emotion, mode, bookTitle, bookAuthor, history, chapters, isReady, projectCharCount]);

  const stats = useMemo(() => {
    const currentEpubChars = chapters.reduce((acc, ch) =>
      acc + (ch.segments?.reduce((sAcc, s) => sAcc + s.content.length, 0) || 0), 0
    );
    const totalChars = mode === 'epub' ? currentEpubChars : text.length;
    // Nivel 1 (Gratuito): El costo es 0.
    const costPerChar = 0;

    const totalCost = 0;
    const accumCost = 0;

    const marketCost = (totalChars / 1000) * 0.30;
    // Savings es todo el market cost porque no pagamos nada
    return { totalChars, costGemini: 0, savings: marketCost, accumChars: projectCharCount, accumCost: 0 };
  }, [chapters, text, mode, projectCharCount]);

  const processSegment = async (chapterId: string, segmentId: string) => {
    if (loading) return;
    setLoading(true);
    setProcessingId(segmentId);
    setError(null);
    try {
      let content = "";
      let sourceName = "";

      if (chapterId === 'manual') {
        content = text;
        sourceName = projectTitle || "Producción Manual";
      } else {
        const ch = chapters.find(c => c.id === chapterId);
        const seg = ch?.segments?.find(s => s.id === segmentId);
        if (seg) {
          content = seg.content;
          sourceName = ch.title;
        }
      }

      if (!content.trim()) return;

      const audioUrl = await ttsService.generateNarration(
        content,
        voiceId,
        emotion,
        (cur, tot) => setCurrentProgress({ current: cur, total: tot })
      );

      // Successfully generated audio, update project counter
      setProjectCharCount(prev => prev + content.length);

      const voiceName = VOICES.find(v => v.id === voiceId)?.name || 'Voz';

      let finalAudioUrl = audioUrl;
      let finalId = Date.now().toString() + Math.random().toString(36).substr(2, 5);

      // Auto-Sync a la Nube (Supabase) - DESACTIVADO POR PETICIÓN DEL USUARIO
      // El usuario prefiere descarga local inmediata y no guardar en DB para ahorrar espacio/ancho de banda.
      /*
      try {
        const res = await fetch(audioUrl);
        const blob = await res.blob();
        const cloudResult = await cloudService.uploadNarration(blob, {
          text: content,
          voiceId,
          emotion,
          projectTitle: sourceName
        });
        if (cloudResult) {
          finalAudioUrl = cloudResult.audioUrl;
          finalId = cloudResult.id;
        }
      } catch (cloudErr) {
        console.error("Error sync nube:", cloudErr);
      }
      */

      const historyItem: NarrationResult = {
        id: finalId,
        audioUrl: finalAudioUrl,
        timestamp: Date.now(),
        text: `[${sourceName}] ${content.substring(0, 50)}...`,
        voiceName
      };

      const newHistory = [historyItem, ...history];
      setHistory(newHistory);

      let newChapters = [...chapters];
      if (chapterId !== 'manual') {
        newChapters = chapters.map(ch => {
          if (ch.id !== chapterId) return ch;
          return {
            ...ch,
            segments: ch.segments?.map(s => s.id === segmentId ? { ...s, audioUrl, status: 'completed' } : s)
          };
        });
        setChapters(newChapters);
      }

      await persistenceService.saveState({ history: newHistory, chapters: newChapters });

    } catch (err: any) {
      setError({ message: err.message, isQuota: err.message.includes('429') });
    } finally {
      setLoading(false);
      setProcessingId(null);
      setCurrentProgress({ current: 0, total: 0 });
    }
  };

  const startEditing = (segId: string, currentText: string) => {
    setEditingSegmentId(segId);
    setTempSegmentText(currentText);
  };

  const saveEdit = (chapterId: string, segId: string) => {
    const newChapters = chapters.map(ch => {
      if (ch.id !== chapterId) return ch;
      return {
        ...ch,
        segments: ch.segments?.map(s => {
          if (s.id !== segId) return s;
          // Si el texto cambia, mantenemos el audioUrl anterior pero el usuario deberá regenerar si quiere que coincida
          return { ...s, content: tempSegmentText };
        })
      };
    });
    setChapters(newChapters);
    setEditingSegmentId(null);
    setTempSegmentText('');
  };

  const cancelEdit = () => {
    setEditingSegmentId(null);
    setTempSegmentText('');
  };

  const handleDownloadChapter = async (chapter: EpubChapter) => {
    if (!chapter.segments || chapter.segments.length === 0) return;
    const completedSegments = chapter.segments.filter(s => s.status === 'completed' && s.audioUrl);

    if (completedSegments.length === 0) {
      alert("No hay audios generados en este capítulo.");
      return;
    }

    if (completedSegments.length !== chapter.segments.length) {
      if (!confirm(`Solo hay ${completedSegments.length} de ${chapter.segments.length} fragmentos narrados. ¿Deseas descargar el capítulo incompleto?`)) {
        return;
      }
    }

    setMergingChapterId(chapter.id);
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffers: AudioBuffer[] = [];

      for (const seg of completedSegments) {
        if (!seg.audioUrl) continue;
        const response = await fetch(seg.audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        buffers.push(audioBuffer);
      }

      const mergedBuffer = mergeAudioBuffers(buffers, audioContext);
      const wavBlob = audioBufferToWavBlob(mergedBuffer);

      const url = URL.createObjectURL(wavBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Capitulo_${(chapter.title || 'audio').replace(/[^a-z0-9]/gi, '_').substring(0, 30)}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error("Error merging audio:", err);
      alert("Error al unir los audios del capítulo. Asegúrate de que los audios estén cargados correctamente.");
    } finally {
      setMergingChapterId(null);
    }
  };

  const deleteChapter = (chapterId: string) => {
    if (confirm("¿Eliminar este capítulo de la producción?")) {
      setChapters(chapters.filter(ch => ch.id !== chapterId));
      if (expandedChapter === chapterId) setExpandedChapter(null);
    }
  };

  const exportAllToZip = async () => {
    if (history.length === 0) return;
    setIsExporting(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("narraciones_libroteca");

      for (const item of history) {
        const response = await fetch(item.audioUrl);
        const blob = await response.blob();
        folder?.file(`${item.voiceName}_${item.id}.wav`, blob);
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Produccion_${bookTitle || 'Manual'}_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error al exportar ZIP:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleEpubUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const { title, author, chapters: extractedChapters } = await epubService.parseEpub(file);
      setBookTitle(title);
      setBookAuthor(author || "Autor Desconocido");
      setChapters(extractedChapters);
      setMode('epub');
    } catch (err: any) {
      setError({ message: "Error al leer ePub: " + err.message });
    } finally {
      setLoading(false);
      if (e.target) e.target.value = '';
    }
  };

  const clearSession = async () => {
    if (confirm("¿Borrar todo el estudio de producción actual?")) {
      await persistenceService.clearAll();
      window.location.reload();
    }
  };

  if (!isReady || authLoading) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-4 p-6 text-center">
      <i className="fa-solid fa-compact-disc animate-spin text-4xl text-indigo-500"></i>
      <span className="text-xs font-bold uppercase tracking-[0.3em]">{authLoading ? 'Verificando Credenciales...' : 'Sincronizando Estudio...'}</span>
    </div>
  );

  if (!session) {
    return <Auth onAuthSuccess={() => { }} />;
  }

  const handleDeleteNarration = async (id: string, storagePath?: string) => {
    if (confirm("¿Estás seguro de eliminar este audio? Esta acción no se puede deshacer de la nube.")) {
      // Optimistic update
      setHistory(prev => prev.filter(item => item.id !== id));

      const success = await cloudService.deleteNarration(id, storagePath);
      if (!success) {
        alert("Hubo un error al eliminar de la nube, pero se ha ocultado localmente.");
      } else {
        // Update local persistence
        const validHistory = history.filter(item => item.id !== id);
        persistenceService.saveState({ history: validHistory }).catch(console.error);
      }
    }
  };

  return (
    <SubscriptionGate userEmail={session.user.email!} isPro={isPro}>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        {/* Overlay global de narración activa */}
        {loading && processingId === 'manual' && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center text-white gap-6 p-6">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <i className="fa-solid fa-microphone-lines text-2xl animate-pulse text-indigo-400"></i>
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black uppercase tracking-widest">Narrando Maestro</h3>
              <p className="text-xs text-indigo-300 font-bold">Procesando audio de alta fidelidad...</p>
              {currentProgress.total > 0 && (
                <div className="mt-4 w-64 bg-slate-800 h-1.5 rounded-full overflow-hidden mx-auto">
                  <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${(currentProgress.current / currentProgress.total) * 100}%` }}></div>
                </div>
              )}
            </div>
          </div>
        )}

        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0">
                <i className="fa-solid fa-microphone-lines text-sm md:text-base"></i>
              </div>
              <div className="hidden xs:block">
                <h1 className="text-sm md:text-lg font-bold leading-none">Libroteca</h1>
                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Estudio</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto no-scrollbar">
              <button onClick={() => setMode('text')} className={`px-3 md:px-4 py-2 rounded-lg text-[11px] md:text-xs font-bold transition-all whitespace-nowrap ${mode === 'text' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}>
                <i className="fa-solid fa-pen-to-square sm:hidden"></i>
                <span className="hidden sm:inline">Texto Libre</span>
              </button>
              <button onClick={() => setMode('epub')} className={`px-3 md:px-4 py-2 rounded-lg text-[11px] md:text-xs font-bold transition-all whitespace-nowrap ${mode === 'epub' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}>
                <i className="fa-solid fa-book sm:hidden"></i>
                <span className="hidden sm:inline">Libro Maestro</span>
              </button>
              <button
                onClick={() => setMode('merger')}
                className={`px-3 md:px-4 py-2 rounded-lg text-[11px] md:text-xs font-bold transition-all whitespace-nowrap ${mode === 'merger' ? 'bg-purple-50 text-purple-600' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <i className="fa-solid fa-layer-group sm:hidden"></i>
                <span className="hidden sm:inline">Fusión</span>
              </button>


              <button onClick={() => setShowCoverGenerator(true)} className="px-3 md:px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[11px] md:text-xs font-bold shadow-md hover:shadow-lg transition-all whitespace-nowrap flex items-center gap-2" title="Crear Portada IA">
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                <span className="hidden sm:inline">Portada IA</span>
              </button>

              <button onClick={() => setShowStats(!showStats)} className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg transition-colors shrink-0 ${showStats ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`} title="Panel de Monitor"><i className="fa-solid fa-chart-column text-xs md:text-base"></i></button>
              <button onClick={() => fileInputRef.current?.click()} className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 shrink-0" title="Importar ePub"><i className="fa-solid fa-file-import text-xs md:text-base"></i></button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".epub" onChange={handleEpubUpload} />
              <button onClick={clearSession} className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg bg-slate-100 text-slate-400 hover:text-red-600 shrink-0" title="Limpiar todo"><i className="fa-solid fa-trash-can text-xs md:text-base"></i></button>
              <div className="w-px h-6 bg-slate-200 mx-1 md:mx-2 shrink-0"></div>
              <button onClick={() => setShowAccountModal(true)} className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 shrink-0" title="Mi Cuenta"><i className="fa-solid fa-user-gear text-xs md:text-base"></i></button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          <div className="lg:col-span-8 space-y-6">
            {showStats && stats.totalChars > 0 && (
              <div className="bg-slate-900 text-white rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-xl animate-in slide-in-from-top duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                  <div>
                    <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400">Volumen Narrativo</p>
                    <p className="text-xl md:text-2xl font-black mt-1">{stats.totalChars.toLocaleString()} <span className="text-[9px] md:text-[10px] opacity-40">CARACT.</span></p>
                  </div>
                  <div className="sm:border-l sm:border-slate-700/50 sm:pl-6">
                    <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-indigo-400">Inversión Actual</p>
                    <p className="text-xl md:text-2xl font-black mt-1 text-indigo-400">${stats.costGemini.toLocaleString('en-US', { minimumFractionDigits: 4 })}</p>
                    <p className="text-[8px] text-slate-500 mt-1 uppercase font-bold">Estimado del Texto</p>
                  </div>
                  <div className="sm:border-l sm:border-slate-700/50 sm:pl-6 bg-slate-800/50 rounded-xl p-2 sm:bg-transparent sm:p-0">
                    <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-green-400">Gasto Real Proyecto</p>
                    <p className="text-xl md:text-2xl font-black mt-1 text-green-400">${stats.accumCost.toLocaleString('en-US', { minimumFractionDigits: 4 })}</p>
                    <p className="text-[8px] text-slate-500 mt-1 uppercase font-bold">{stats.accumChars.toLocaleString()} Caract. Procesados</p>
                  </div>
                  <div className="bg-indigo-600/10 rounded-xl md:rounded-2xl p-3 md:p-4 border border-indigo-500/20">
                    <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-indigo-200">Ahorro Estimado</p>
                    <p className="text-base md:text-lg font-bold mt-1 text-indigo-100">${stats.savings.toFixed(2)} USD</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 p-4 md:p-5 rounded-2xl animate-in fade-in">
                <div className="flex gap-3 md:gap-4">
                  <i className="fa-solid fa-circle-exclamation text-red-600 text-lg md:text-xl"></i>
                  <div>
                    <p className="text-xs md:text-sm font-bold text-red-900">{error.message}</p>
                    <button onClick={() => setError(null)} className="text-[10px] md:text-xs text-red-600 font-bold underline mt-2">Cerrar error</button>
                  </div>
                </div>
              </div>
            )}

            {mode === 'merger' ? (
              <AudioMerger />
            ) : mode === 'text' ? (
              <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <input type="text" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="Título de la obra o capítulo..." className="w-full px-4 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none font-bold text-sm md:text-base" />
                <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Pega aquí el texto que deseas narrar..." className="w-full h-64 md:h-80 p-4 md:p-6 rounded-xl md:rounded-2xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none font-medium resize-none custom-scrollbar text-sm md:text-base" />
                <button
                  onClick={() => processSegment('manual', 'manual')}
                  disabled={loading || !text}
                  className={`w-full py-4 md:py-5 rounded-xl md:rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-3 text-sm md:text-base ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}
                >
                  {loading && <i className="fa-solid fa-spinner animate-spin"></i>}
                  {loading ? 'NARRANDO MAESTRO...' : 'GENERAR AUDIO MAESTRO'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {chapters.length === 0 ? (
                  <div className="bg-white p-10 md:p-20 rounded-2xl md:rounded-3xl border border-dashed border-slate-300 text-center space-y-4">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mx-auto text-2xl md:text-3xl"><i className="fa-solid fa-book-open-reader"></i></div>
                    <h3 className="text-lg md:text-xl font-bold text-slate-900">Importa un libro ePub para narrar</h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">He filtrado índices y metadatos automáticamente. Carga un archivo para comenzar.</p>
                    <button onClick={() => fileInputRef.current?.click()} className="px-6 md:px-8 py-2.5 md:py-3 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-bold shadow-lg text-sm">Cargar Libro</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
                      <div className="flex items-center gap-4 md:gap-6">
                        <div className="w-12 h-16 md:w-16 md:h-20 bg-indigo-600 rounded-lg shadow-md flex items-center justify-center text-white text-xl md:text-2xl shrink-0"><i className="fa-solid fa-book"></i></div>
                        <div className="min-w-0">
                          <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight truncate">{bookTitle}</h2>
                          <p className="text-xs md:text-sm font-bold text-indigo-600 uppercase tracking-widest mt-1 truncate">{bookAuthor}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-full">{chapters.length} CAPÍTULOS</span>
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-full">{chapters.reduce((acc, c) => acc + (c.segments?.length || 0), 0)} FRAGMENTOS</span>
                      </div>
                    </div>

                    {chapters.map((chapter) => (
                      <div key={chapter.id} className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                        <div className="flex items-center">
                          <button onClick={() => setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)} className="flex-1 flex items-center justify-between p-4 md:p-5 hover:bg-slate-50 text-left min-w-0">
                            <div className="flex items-center gap-3 md:gap-4 min-w-0">
                              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 ${expandedChapter === chapter.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>
                                <i className="fa-solid fa-list-ol text-xs md:text-base"></i>
                              </div>
                              <h3 className="font-bold text-xs md:text-sm text-slate-800 truncate">{chapter.title}</h3>
                            </div>
                            <i className={`fa-solid fa-chevron-right text-[10px] md:text-xs transition-transform shrink-0 ml-2 ${expandedChapter === chapter.id ? 'rotate-90 text-indigo-600' : 'text-slate-200'}`}></i>
                          </button>

                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownloadChapter(chapter); }}
                            disabled={mergingChapterId === chapter.id}
                            className="p-4 md:p-5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors border-l border-slate-50 relative"
                            title="Descargar Capítulo Completo (.WAV)"
                          >
                            {mergingChapterId === chapter.id ? (
                              <i className="fa-solid fa-circle-notch animate-spin text-xs md:text-sm"></i>
                            ) : (
                              <i className="fa-solid fa-file-audio text-xs md:text-sm"></i>
                            )}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteChapter(chapter.id); }}
                            className="p-4 md:p-5 text-slate-300 hover:text-red-500 transition-colors border-l border-slate-50"
                            title="Eliminar capítulo"
                          >
                            <i className="fa-solid fa-trash-can text-xs md:text-sm"></i>
                          </button>
                        </div>

                        {expandedChapter === chapter.id && (
                          <div className="p-4 md:p-6 pt-0 border-t border-slate-100 space-y-4 md:space-y-6 bg-white">
                            {chapter.segments?.map((seg, sIdx) => (
                              <div key={seg.id} className={`bg-slate-50 p-4 md:p-5 rounded-xl md:rounded-2xl border transition-all ${processingId === seg.id ? 'border-indigo-500 ring-2 ring-indigo-100 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-200'}`}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    FRAGMENTO {sIdx + 1} <span className="text-slate-300 mx-1">|</span> {seg.content.length.toLocaleString()} CARACT.
                                  </span>

                                  <div className="flex items-center gap-2">
                                    {editingSegmentId === seg.id ? (
                                      <>
                                        <button onClick={() => saveEdit(chapter.id, seg.id)} className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold rounded-lg transition-colors" title="Guardar cambios">
                                          <i className="fa-solid fa-check"></i>
                                        </button>
                                        <button onClick={cancelEdit} className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 text-[10px] font-bold rounded-lg transition-colors" title="Cancelar">
                                          <i className="fa-solid fa-xmark"></i>
                                        </button>
                                      </>
                                    ) : (
                                      <button onClick={() => startEditing(seg.id, seg.content)} className="px-3 py-2 bg-white border border-slate-200 hover:border-indigo-400 text-slate-400 hover:text-indigo-600 text-[10px] font-bold rounded-lg transition-colors" title="Editar texto">
                                        <i className="fa-solid fa-pen"></i>
                                      </button>
                                    )}

                                    <button
                                      onClick={() => processSegment(chapter.id, seg.id)}
                                      disabled={loading || editingSegmentId === seg.id}
                                      className={`px-4 md:px-6 py-2 border text-[10px] font-bold rounded-lg md:rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 ${processingId === seg.id
                                        ? 'bg-indigo-600 border-indigo-600 text-white animate-pulse'
                                        : 'bg-white border-slate-200 hover:border-indigo-600 text-slate-700'
                                        }`}
                                    >
                                      {processingId === seg.id ? (
                                        <><i className="fa-solid fa-circle-notch animate-spin"></i> NARRANDO...</>
                                      ) : (
                                        seg.status === 'completed' ? 'REGENERAR AUDIO' : 'NARRAR FRAGMENTO'
                                      )}
                                    </button>
                                  </div>
                                </div>
                                <div className="relative">
                                  {editingSegmentId === seg.id ? (
                                    <textarea
                                      value={tempSegmentText}
                                      onChange={(e) => setTempSegmentText(e.target.value)}
                                      className="w-full bg-white border-2 border-indigo-500 p-3 md:p-4 text-xs text-slate-800 rounded-lg md:rounded-xl outline-none font-medium h-28 md:h-32 custom-scrollbar resize-none shadow-inner"
                                      autoFocus
                                    />
                                  ) : (
                                    <textarea value={seg.content} readOnly className="w-full bg-white border border-slate-100 p-3 md:p-4 text-xs text-slate-600 rounded-lg md:rounded-xl outline-none font-medium h-28 md:h-32 custom-scrollbar resize-none" />
                                  )}
                                  {processingId === seg.id && (
                                    <div className="absolute inset-0 bg-white/40 flex items-center justify-center rounded-lg md:rounded-xl backdrop-blur-[1px]">
                                      <div className="flex flex-col items-center gap-2">
                                        <div className="flex gap-1">
                                          <div className="w-1.5 h-6 bg-indigo-500 rounded-full animate-[bounce_1s_infinite]"></div>
                                          <div className="w-1.5 h-6 bg-indigo-500 rounded-full animate-[bounce_1s_infinite_0.1s]"></div>
                                          <div className="w-1.5 h-6 bg-indigo-500 rounded-full animate-[bounce_1s_infinite_0.2s]"></div>
                                          <div className="w-1.5 h-6 bg-indigo-500 rounded-full animate-[bounce_1s_infinite_0.3s]"></div>
                                        </div>
                                        <span className="text-[9px] font-black text-indigo-700 uppercase tracking-tighter">Capturando Emoción...</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                {seg.audioUrl && (
                                  <div className="mt-4 bg-white p-2 md:p-3 rounded-xl border border-slate-100 flex items-center gap-2 md:gap-3 shadow-sm">
                                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0"><i className="fa-solid fa-check text-[10px] md:text-xs"></i></div>
                                    <audio src={seg.audioUrl} controls className="h-8 w-full" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <section className="bg-white p-5 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-200 shadow-sm space-y-6 md:space-y-8">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="w-8 h-8 md:w-9 md:h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-sm shrink-0"><i className="fa-solid fa-headset"></i></div>
                <div>
                  <h3 className="text-sm md:text-base font-black text-slate-900 leading-tight">Elenco de Narración Gratuito</h3>
                  <p className="text-[10px] md:text-xs text-slate-400 font-medium mt-1">Selecciona la voz ideal para tu proyecto.</p>
                </div>
              </div>

              <VoiceSelector selectedId={voiceId} onSelect={setVoiceId} />

              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Clima Emocional</h3>
                <div className="flex flex-wrap gap-2 md:gap-3">
                  {EMOTIONS.map(e => (
                    <button
                      key={e}
                      onClick={() => setEmotion(e)}
                      className={`px-3 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-bold border transition-all ${emotion === e
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg -translate-y-0.5'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-white'
                        }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-4">
            <aside className="lg:sticky lg:top-24 space-y-6 flex flex-col h-auto lg:h-[calc(100vh-120px)]">
              <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-widest">Producciones</h3>
                  <span className="bg-indigo-600 text-white px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg text-[9px] md:text-[10px] font-bold shadow-sm">{history.length}</span>
                </div>

                {history.length > 0 && (
                  <button
                    onClick={exportAllToZip}
                    disabled={isExporting}
                    className="w-full mb-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors border border-indigo-100"
                  >
                    {isExporting ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-file-zipper"></i>}
                    {isExporting ? 'Empaquetando...' : 'Exportar a PC (.ZIP)'}
                  </button>
                )}

                <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar min-h-[300px]">
                  {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 text-center py-10">
                      <i className="fa-solid fa-compact-disc text-5xl md:text-6xl mb-4 animate-spin-slow"></i>
                      <p className="text-[10px] font-bold uppercase tracking-widest">Sin producciones</p>
                    </div>
                  ) : (
                    history.map((item) => <HistoryItem key={item.id} item={item} onDelete={handleDeleteNarration} />)
                  )}
                </div>
              </div>
            </aside>
          </div>
        </main>
        <footer className="p-6 md:p-8 text-center text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] mt-auto">
          PRODUCIDO CON GEMINI FLASH 2.5 • VOCES LIBRES • 2024
        </footer>
      </div>

      {showAccountModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowAccountModal(false)}>
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900">Mi Cuenta</h3>
              <button onClick={() => setShowAccountModal(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center transition-colors">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="text-center space-y-4 mb-8">
              <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                <i className="fa-solid fa-user"></i>
              </div>
              <div>
                <p className="font-bold text-slate-900 truncate px-4" title={session?.user?.email}>{session?.user?.email}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isPro ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                  {isPro ? 'PLAN PRO ACTIVO 👑' : 'PLAN GRATUITO'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  const portalLink = import.meta.env.VITE_STRIPE_CUSTOMER_PORTAL;
                  if (portalLink) {
                    window.open(portalLink, '_blank');
                  } else {
                    alert("Para gestionar tu suscripción (cancelar, ver facturas, etc.), por favor revisa el correo de confirmación que recibiste de Stripe o usa el enlace del portal de cliente si lo tienes configurado.");
                  }
                }}
                className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-credit-card"></i> Gestionar Suscripción
              </button>

              <button
                onClick={() => {
                  setShowAccountModal(false);
                  supabase.auth.signOut();
                  // window.location.reload(); // signOut usually triggers session change
                }}
                className="w-full py-3 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
              </button>
            </div>

            <p className="text-[10px] text-center text-slate-400 mt-6 font-medium">
              ID: <span className="font-mono">{session?.user?.id?.substring(0, 8)}...</span>
            </p>
          </div>
        </div>
      )}

      {showCoverGenerator && (
        <CoverGenerator
          initialTitle={projectTitle || bookTitle}
          initialAuthor={bookAuthor}
          emotion={emotion}
          onClose={() => setShowCoverGenerator(false)}
        />
      )}

      {showResetPassword && <ResetPasswordModal onClose={() => setShowResetPassword(false)} />}

    </SubscriptionGate>
  );
};

export default App;
