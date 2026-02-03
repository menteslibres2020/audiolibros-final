
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("No se encontró el elemento raíz");
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Error crítico de inicialización:", error);
  document.body.innerHTML = `<div style="padding: 20px; color: red; font-family: sans-serif;">
    <h2>Error al cargar la aplicación</h2>
    <p>${error.message}</p>
    <p>Verifica la consola del navegador para más detalles.</p>
  </div>`;
}