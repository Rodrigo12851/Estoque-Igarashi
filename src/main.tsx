import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import * as XLSX from 'xlsx';
import App from './App.tsx';
import './index.css';
import { testarConexao } from './firebase.ts';

// Expose XLSX globally for the Agricultural Stock Manager import/export engine
(window as any).XLSX = (window as any).XLSX || XLSX;

// Test connection on boot as required by Firebase integration skill
testarConexao().then(conectado => {
  if (conectado) {
    console.log("Firebase Firestore conectado com sucesso.");
    if (typeof (window as any).notificarConexaoFirebase === 'function') {
      (window as any).notificarConexaoFirebase(true);
    }
  } else {
    console.warn("Firebase Firestore em modo offline.");
    if (typeof (window as any).notificarConexaoFirebase === 'function') {
      (window as any).notificarConexaoFirebase(false);
    }
  }
}).catch(err => {
  console.warn("Firebase Firestore aviso de inicialização:", err);
  if (typeof (window as any).notificarConexaoFirebase === 'function') {
    (window as any).notificarConexaoFirebase(false);
  }
});

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

