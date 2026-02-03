import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../lib/supabaseClient';

// Inicializa Stripe con la clave pública (de entorno)
// NOTA: Si usas la clave 'pk_live', COBRARÁ DINERO REAL.
// Si usas 'pk_test', puedes usar tarjetas falsas (4242 4242...).
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export const stripeService = {
    // Función para redirigir al Checkout de Stripe
    async startCheckout(userEmail: string) {
        const stripe = await stripePromise;
        if (!stripe) throw new Error("Stripe no pudo cargarse.");

        // Crear sesión de Checkout (Client-Only Checkout)
        // Para producción real segura, esto idealmente se hace desde un Backend (Edge Function),
        // pero para este MVP usaremos "Client-Only" o "Payment Links" si es posible,
        // o el enfoque estándar de Checkout client-side si tienes habilitado 'Client-only integration' en Stripe.

        // OPCIÓN: Usar 'line_items' directo requiere habilitación en Stripe Dashboard.
        // Vamos a usar la redirección directa por ID de Precio.
        const { error } = await stripe.redirectToCheckout({
            lineItems: [{
                price: import.meta.env.VITE_STRIPE_PRICE_ID, // Tu ID: price_1Swpfj...
                quantity: 1,
            }],
            mode: 'subscription',
            successUrl: window.location.origin + '/?status=success&session_id={CHECKOUT_SESSION_ID}',
            cancelUrl: window.location.origin + '/?status=cancel',
            customerEmail: userEmail, // Pre-rellenar el email del usuario logueado
        });

        if (error) {
            console.error("Error Stripe:", error);
            throw error;
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
