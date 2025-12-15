import { create } from 'zustand';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';

// 🦄 ADN UNICORNIO: Preparamos la estructura para B2B
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'psicologo' | 'paciente';
  isAdmin?: boolean; 
  
  // 🏢 ESTRUCTURA MULTI-TENANT (EMPRESARIAL)
  organizationId: string; // ID de tu "Clínica" o "Empresa" (Al inicio es tu mismo UID)
  organizationName?: string; // Nombre comercial (Ej: "Consultorio Dr. Stark")

  // 🤝 VINCULACIÓN VIRAL
  uniqueCode: string; // El código que compartirás (Ej: STARK-8821)
  
  createdAt: any;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  initializeListener: () => void;
  toggleUserRole: () => void;
  generateUniqueCode: () => Promise<void>; // 👈 Nueva función
}

// Generador de códigos aleatorios estilo "Agente Secreto"
const generateCode = (name: string) => {
  const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'NEX');
  const random = Math.floor(1000 + Math.random() * 9000); // 4 dígitos
  return `${prefix}-${random}`; // Ej: JUA-4921
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  loginWithGoogle: async () => {
    try {
      set({ loading: true });
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      let userProfile: UserProfile;

      if (userSnap.exists()) {
        userProfile = userSnap.data() as UserProfile;
        
        // 🛠️ MIGRACIÓN SILENCIOSA: Si es usuario viejo y no tiene código, se lo creamos
        if (!userProfile.uniqueCode || !userProfile.organizationId) {
           const code = generateCode(userProfile.displayName || 'DOC');
           const updates = {
             uniqueCode: userProfile.uniqueCode || code,
             organizationId: userProfile.organizationId || user.uid, // Por defecto eres tu propia org
           };
           await updateDoc(userRef, updates);
           userProfile = { ...userProfile, ...updates };
        }

      } else {
        // Nuevo Usuario (Nace con estructura Unicornio)
        const code = generateCode(user.displayName || 'NEXUS');
        userProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Agente Nexus',
          role: 'psicologo',
          
          organizationId: user.uid, // Eres el fundador de tu propia Org
          uniqueCode: code,
          
          createdAt: Timestamp.now(),
        };
        await setDoc(userRef, userProfile);
      }

      set({ user, profile: userProfile, loading: false });

    } catch (error) {
      console.error("Error en Login:", error);
      set({ loading: false });
    }
  },

  logout: async () => {
    await signOut(auth);
    set({ user: null, profile: null });
  },

  initializeListener: () => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data() as UserProfile;
          set({ user, profile: data, loading: false });
        } else {
          set({ user, loading: false }); 
        }
      } else {
        set({ user: null, profile: null, loading: false });
      }
    });
  },

  toggleUserRole: () => {
    const { profile } = get();
    if (!profile?.isAdmin) return;
    const newRole = profile.role === 'psicologo' ? 'admin' : 'psicologo';
    set({ profile: { ...profile, role: newRole } });
  },

  generateUniqueCode: async () => {
    // Función manual por si quieres regenerarlo
    const { profile } = get();
    if (!profile) return;
    const newCode = generateCode(profile.displayName);
    const userRef = doc(db, 'users', profile.uid);
    await updateDoc(userRef, { uniqueCode: newCode });
    set({ profile: { ...profile, uniqueCode: newCode } });
  }
}));