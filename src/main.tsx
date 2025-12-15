import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Asumo que Tailwind se inyectará aquí

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);