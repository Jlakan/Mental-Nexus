import { create } from 'zustand';
import { auth, googleProvider, db } from '../config/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, Timestamp, addDoc } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role?: 'psicologo' | 'paciente' | 'admin';
  organizationId?: string;
  uniqueCode?: string;
}

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  needsOnboarding: boolean;
  error: string | null;
  
  initializeListener: () => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  registerRole: (role: 'psicologo' | 'paciente', extraData?: { therapistCode?: string }) => Promise<void>;
  
  // 👇 RESTAURAMOS ESTA FUNCIÓN
  toggleUserRole: () => void; 
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  needsOnboarding: false,
  error: null,

  initializeListener: () => {
    set({ loading: true });
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          set({ 
            user: userData, 
            needsOnboarding: !userData.role, 
            loading: false 
          });
        } else {
          set({ user: null, loading: false });
        }
      } else {
        set({ user: null, loading: false });
      }
    });
  },

  loginWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const { uid, email, displayName, photoURL } = result.user;

      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const newUser: UserProfile = {
          uid,
          email: email || '',
          displayName: displayName || 'Usuario',
          photoURL: photoURL || '',
        };
        await setDoc(userRef, newUser);
        set({ user: newUser, needsOnboarding: true, loading: false });
      } else {
        const userData = userSnap.data() as UserProfile;
        set({ 
          user: userData, 
          needsOnboarding: !userData.role, 
          loading: false 
        });
      }
    } catch (error: any) {
      console.error(error);
      set({ error: error.message, loading: false });
    }
  },

  registerRole: async (role, extraData) => {
    const { user } = get();
    if (!user) return;
    set({ loading: true });

    try {
      const updates: any = { role };

      if (role === 'psicologo') {
        const codePrefix = user.displayName.split(' ')[0].toUpperCase().substring(0, 4) || 'USER';
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        updates.uniqueCode = `${codePrefix}-${randomNum}`;
        updates.organizationId = user.uid;
      }

      if (role === 'paciente' && extraData?.therapistCode) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uniqueCode', '==', extraData.therapistCode));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          throw new Error("Código de profesional inválido.");
        }

        const therapist = querySnapshot.docs[0].data();
        
        await addDoc(collection(db, 'patients'), {
          firstName: user.displayName.split(' ')[0],
          lastName: user.displayName.split(' ')[1] || '',
          email: user.email,
          therapistId: therapist.uid,
          linkedUserUid: user.uid,
          providerType: 'psicologo',
          therapyMode: 'tcc',
          active: true,
          level: 1,
          currentXP: 0,
          nextLevelXP: 100,
          gold: 50,
          nexos: 0,
          stats: { vitality: 10, wisdom: 10, social: 10, resilience: 10, strength: 10, autocuidado: 10, desarrollo: 10, vinculacion: 10 },
          inventory: [],
          activeQuests: [],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }

      await updateDoc(doc(db, 'users', user.uid), updates);
      set({ 
        user: { ...user, ...updates }, 
        needsOnboarding: false, 
        loading: false 
      });

    } catch (error: any) {
      console.error(error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  logout: async () => {
    await signOut(auth);
    set({ user: null, needsOnboarding: false });
  },

  // 👇 LA FUNCIÓN RESTAURADA (GOD MODE)
  toggleUserRole: () => {
    const currentUser = get().user;
    if (!currentUser) return;
    
    // Switch simple para pruebas (Solo memoria local)
    const newRole = currentUser.role === 'psicologo' ? 'admin' : 'psicologo';
    set({ user: { ...currentUser, role: newRole } });
  }
}));