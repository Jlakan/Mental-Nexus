// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 🔴 REEMPLAZA ESTO CON TUS DATOS REALES DE FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "AIzaSyBPWPg9vkkXFuzdbc2icnHUz4_epjUUO9s",
  authDomain: "mental-nexus-ac4c6.firebaseapp.com",
  projectId: "mental-nexus-ac4c6",
  storageBucket: "mental-nexus-ac4c6.firebasestorage.app",
  messagingSenderId: "455120917108",
  appId: "1:455120917108:web:d7bc3df9f75c4ad204f721"
};
// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar herramientas para usarlas en la app
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();