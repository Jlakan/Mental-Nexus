// src/infrastructure/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 1. Configuración usando Variables de Entorno (Seguridad Primero)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID
};

// 2. Inicializar la App (Singleton)
const app = initializeApp(firebaseConfig);

// 3. Exportar los servicios listos para usar
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("🔥 Firebase Iniciado: ", app.options.projectId);