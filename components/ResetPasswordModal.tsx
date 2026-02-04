import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface ResetPasswordModalProps {
    onClose: () => void;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ onClose }) => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setMessage('Contraseña actualizada correctamente. Redirigiendo...');
            setTimeout(() => {
                onClose();
                window.location.hash = ''; // Limpiar URL
            }, 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-2xl mb-4">
                        <i className="fa-solid fa-key"></i>
                    </div>
                    <h3 className="text-xl font-black text-slate-900">Nueva Contraseña</h3>
                    <p className="text-sm text-slate-500 mt-2">Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta.</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl mb-4 flex gap-2 items-center">
                        <i className="fa-solid fa-circle-exclamation"></i>
                        {error}
                    </div>
                )}

                {message && (
                    <div className="bg-green-50 text-green-600 text-xs font-bold p-3 rounded-xl mb-4 flex gap-2 items-center">
                        <i className="fa-solid fa-check-circle"></i>
                        {message}
                    </div>
                )}

                <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <i className="fa-solid fa-lock"></i>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-600 outline-none font-bold text-slate-700 placeholder:text-slate-300"
                            placeholder="Nueva contraseña..."
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all"
                    >
                        {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Actualizar Contraseña'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-2 text-slate-400 text-xs font-bold hover:text-slate-600 mt-2"
                    >
                        Cancelar
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordModal;
