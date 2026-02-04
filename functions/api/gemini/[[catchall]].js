export async function onRequest(context) {
    const url = new URL(context.request.url);
    // Replicar el comportamiento de vercel.json rewrites
    // Input: /api/gemini/v1beta/...
    // Target: https://generativelanguage.googleapis.com/v1beta/...

    const targetPath = url.pathname.replace(/^\/api\/gemini/, '');
    const targetUrl = 'https://generativelanguage.googleapis.com' + targetPath + url.search;

    console.log(`Proxying request to: ${targetUrl}`);

    // Crear nueva request apuntando al target
    const newRequest = new Request(targetUrl, context.request);

    // Ejecutar el fetch desde el servidor de Cloudflare (evita CORS del navegador)
    return fetch(newRequest);
}
