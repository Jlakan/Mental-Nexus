// src/infrastructure/firebase/auth.ts
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "./config";

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error en Google Auth:", error);
    throw error;
  }
};

export const logoutFirebase = async () => {
  await signOut(auth);
};