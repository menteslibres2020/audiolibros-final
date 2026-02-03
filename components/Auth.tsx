
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
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg mb-4">
                        <i className="fa-solid fa-microphone-lines text-2xl"></i>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900">AudioLibros Pro</h1>
                    <p className="text-slate-500 font-bold text-sm tracking-wide">
                        {isLogin ? 'INICIAR SESIÓN' : 'CREAR CUENTA'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3">
                        <i className="fa-solid fa-circle-exclamation text-red-500 mt-1"></i>
                        <p className="text-xs text-red-600 font-bold">{error}</p>
                    </div>
                )}

                {message && (
                    <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex items-start gap-3">
                        <i className="fa-solid fa-check-circle text-green-500 mt-1"></i>
                        <p className="text-xs text-green-600 font-bold">{message}</p>
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-700 transition-colors"
                            placeholder="tu@email.com"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold text-slate-700 transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <i className="fa-solid fa-spinner animate-spin"></i>
                        ) : (
                            <i className={`fa-solid ${isLogin ? 'fa-arrow-right-to-bracket' : 'fa-user-plus'}`}></i>
                        )}
                        {loading ? 'Procesando...' : (isLogin ? 'Ingresar' : 'Registrarse')}
                    </button>
                </form>

                <div className="text-center pt-2 border-t border-slate-100">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                        {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;
