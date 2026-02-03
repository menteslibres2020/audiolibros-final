import React, { useState } from 'react';
import { stripeService } from '../services/stripeService';

interface SubscriptionGateProps {
    userEmail: string;
    isPro: boolean;
    children: React.ReactNode;
}

const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ userEmail, isPro, children }) => {
    const [loading, setLoading] = useState(false);

    // Si es PRO, mostramos la App normal
    if (isPro) {
        return <>{children}</>;
    }

    // Si NO es PRO, mostramos el Paywall
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] p-8 md:p-12 max-w-lg w-full text-center space-y-8 animate-in zoom-in duration-300">

                <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner">
                    <i className="fa-solid fa-crown animate-pulse"></i>
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900">Actualiza a PRO</h1>
                    <p className="text-slate-500 font-medium text-lg">
                        Desbloquea el poder de la narración con IA ilimitada.
                    </p>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-left space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs ml-1"><i className="fa-solid fa-check"></i></div>
                        <span className="font-bold text-slate-700">Voces Ultra-Realistas (Gemini 2.5)</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs ml-1"><i className="fa-solid fa-check"></i></div>
                        <span className="font-bold text-slate-700">Narración Emocional Inteligente</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs ml-1"><i className="fa-solid fa-check"></i></div>
                        <span className="font-bold text-slate-700">Exportación Ilimitada</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-end justify-center gap-1">
                        <span className="text-4xl font-black text-slate-900">$9.99</span>
                        <span className="text-slate-500 font-bold mb-1.5">/ mes</span>
                    </div>

                    <button
                        onClick={async () => {
                            setLoading(true);
                            try {
                                await stripeService.startCheckout(userEmail);
                            } catch (e: any) {
                                alert("Error iniciando pago: " + e.message);
                                setLoading(false);
                            }
                        }}
                        disabled={loading}
                        className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-300 transition-all flex items-center justify-center gap-3 hover:-translate-y-1"
                    >
                        {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-rocket"></i>}
                        {loading ? 'CONECTANDO...' : 'SUSCRIBIRME AHORA'}
                    </button>

                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Pago seguro vía Stripe • Cancela cuando quieras
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionGate;
