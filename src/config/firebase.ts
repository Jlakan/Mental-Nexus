import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ⚠️ IMPORTANTE: Reemplaza los textos 'PEGAR_AQUI_...' con tus datos reales de la consola de Firebase.
// (Project Settings -> General -> Your apps -> SDK Setup and Configuration -> Config)

const firebaseConfig = {
  apiKey: "AIzaSyBPWPg9vkkXFuzdbc2icnHUz4_epjUUO9s",
  authDomain: "mental-nexus-ac4c6.firebaseapp.com",
  projectId: "mental-nexus-ac4c6",
  storageBucket: "mental-nexus-ac4c6.firebasestorage.app",
  messagingSenderId: "455120917108",
  appId: "1:455120917108:web:d7bc3df9f75c4ad204f721"
};

// 1. Inicializamos la aplicación de Firebase
const app = initializeApp(firebaseConfig);

// 2. Exportamos los servicios que usará toda la app
export const auth = getAuth(app);
export const db = getFirestore(app);

// 3. Configuración del proveedor de Google
export const googleProvider = new GoogleAuthProvider();

console.log("🔥 Firebase conectado y listo para la acción.");