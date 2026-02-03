
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface AuthProps {
    onAuthSuccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                onAuthSuccess();
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage('Registro exitoso! Por favor verifica tu correo si es necesario.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 md:p-6">
            <div className="bg-white rounded-[32px] md:rounded-[40px] shadow-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row shadow-indigo-500/20">
                {/* Lado Izquierdo: Marketing (Solo visible en desktop o muy sutil en movil) */}
                <div className="hidden md:flex md:w-5/12 bg-indigo-600 p-10 flex-col text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-900/20 rounded-full translate-y-1/3 -translate-x-1/3 blur-3xl"></div>

                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-6 border border-white/30">
                                <i className="fa-solid fa-microphone-lines text-2xl"></i>
                            </div>
                            <h2 className="text-3xl font-black leading-tight mb-4">Tu Estudio de Narración IA</h2>
                            <p className="text-indigo-100 text-sm font-medium leading-relaxed opacity-90">
                                Transforma textos y libros completos en audiolibros ultra-realistas con la potencia de Gemini 2.5.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs"><i className="fa-solid fa-check"></i></div>
                                <span className="text-sm font-bold">Voces Neuronales Humanas</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs"><i className="fa-solid fa-check"></i></div>
                                <span className="text-sm font-bold">Clonación de Emociones</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs"><i className="fa-solid fa-check"></i></div>
                                <span className="text-sm font-bold">Exportación Masiva (.Zip)</span>
                            </div>
                        </div>

                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                            © 2026 Voces Libres Studio
                        </div>
                    </div>
                </div>

                {/* Lado Derecho: Formulario */}
                <div className="flex-1 p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-white relative">
                    <div className="max-w-sm mx-auto w-full space-y-8">
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl font-black text-slate-900 mb-2">{isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}</h1>
                            <p className="text-slate-500 font-medium">
                                {isLogin ? 'Ingresa tus credenciales para continuar.' : 'Regístrate para acceder al estudio.'}
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                <i className="fa-solid fa-circle-exclamation text-red-500 mt-1 shrink-0"></i>
                                <div className="space-y-1">
                                    <p className="text-xs text-red-600 font-bold">{error}</p>
                                    {(error.includes('Failed to fetch') || error.includes('placeholder')) && (
                                        <p className="text-[10px] text-red-500 font-medium leading-tight mt-1">
                                            Faltan claves en Cloudflare Pages (`VITE_SUPABASE_URL`, etc).
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {message && (
                            <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                <i className="fa-solid fa-check-circle text-green-500 mt-1"></i>
                                <p className="text-xs text-green-600 font-bold">{message}</p>
                            </div>
                        )}

                        <form onSubmit={handleAuth} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Correo Electrónico</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <i className="fa-solid fa-envelope"></i>
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none font-bold text-slate-700 transition-all placeholder:text-slate-300"
                                        placeholder="hola@ejemplo.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Contraseña</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <i className="fa-solid fa-lock"></i>
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none font-bold text-slate-700 transition-all placeholder:text-slate-300"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <i className="fa-solid fa-circle-notch animate-spin"></i>
                                ) : (
                                    <i className={`fa-solid ${isLogin ? 'fa-arrow-right-to-bracket' : 'fa-rocket'}`}></i>
                                )}
                                {loading ? 'PROCESANDO...' : (isLogin ? 'INICIAR SESIÓN' : 'CREAR CUENTA')}
                            </button>
                        </form>

                        <div className="text-center">
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors py-2"
                            >
                                {isLogin ? '¿Nuevo aquí? Crea tu cuenta' : '¿Ya tienes cuenta? Ingresa aquí'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
