/*
 * main.tsx
 * React application entry point — mounts the root component into the DOM,
 * wraps the app with BrowserRouter for client-side routing, and configures
 * the global toast notification system.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter> {/* Enables HTML5 history-based routing */}
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { fontFamily: 'Inter, sans-serif', fontSize: '14px' }, // Match app typography
        }}
      />
    </BrowserRouter>
  </StrictMode>
);
