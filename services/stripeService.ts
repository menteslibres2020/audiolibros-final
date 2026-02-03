import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../lib/supabaseClient';

// Inicializa Stripe con la clave pública (de entorno)
// NOTA: Si usas la clave 'pk_live', COBRARÁ DINERO REAL.
// Si usas 'pk_test', puedes usar tarjetas falsas (4242 4242...).
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const stripeService = {
    // Función para redirigir al Checkout de Stripe
    async startCheckout(userEmail: string) {
        // Opción 1 (RECOMENDADA): Payment Links (No-Code, más robusto)
        // Crea un link en Stripe Dashboard > Productos > [Tu Producto] > Crear Link de Pago
        // Y ponlo en tu .env como VITE_STRIPE_PAYMENT_LINK
        const paymentLink = import.meta.env.VITE_STRIPE_PAYMENT_LINK;

        if (paymentLink) {
            // Añadimos el email para que el usuario no tenga que escribirlo de nuevo
            const separator = paymentLink.includes('?') ? '&' : '?';
            const finalUrl = `${paymentLink}${separator}prefilled_email=${encodeURIComponent(userEmail)}`;
            window.location.href = finalUrl;
            return;
        }

        // Opción 2 (LEGACY/FALLBACK): Client-Only Checkout
        // Esto a menudo está desactivado por defecto en cuentas nuevas de Stripe o versiones recientes del SDK.
        // Si ves el error "redirectToCheckout no supported", USA LA OPCIÓN 1.
        const stripe = await stripePromise;
        if (!stripe) throw new Error("Stripe no pudo cargarse.");

        console.warn("Intentando redirección legacy... Si falla, configura VITE_STRIPE_PAYMENT_LINK.");

        const { error } = await stripe.redirectToCheckout({
            lineItems: [{
                price: import.meta.env.VITE_STRIPE_PRICE_ID,
                quantity: 1,
            }],
            mode: 'subscription',
            successUrl: window.location.origin + '/?status=success',
            cancelUrl: window.location.origin + '/?status=cancel',
            customerEmail: userEmail,
        });

        if (error) {
            console.error("Error Stripe SDK:", error);
            throw new Error(error.message + " (Sugerencia: Usa PAYMENT LINKS en lugar de API key directa)");
        }
    },

    // Verificar si el usuario ya es PRO (Consultando Supabase)
    async checkSubscriptionStatus(userId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('profiles')
            .select('is_pro')
            .eq('id', userId)
            .single();

        if (error) {
            console.warn("No se pudo verificar suscripción:", error.message);
            return false;
        }
        return data?.is_pro || false;
    }
};
