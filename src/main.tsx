import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import * as XLSX from 'xlsx';
import App from './App.tsx';
import './index.css';

// Expose XLSX globally for the Agricultural Stock Manager import/export engine
(window as any).XLSX = (window as any).XLSX || XLSX;

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
