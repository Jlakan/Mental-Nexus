// src/services/auth.ts
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from './firebaseConfig';

// Función para Iniciar Sesión con Google
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Error en login:", error);
    throw new Error(error.message);
  }
};

// Función para Cerrar Sesión
export const logout = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error: any) {
    console.error("Error en logout:", error);
    return false;
  }
};