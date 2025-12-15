import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../infrastructure/firebase/config';

// Definimos qué información proveerá este contexto
interface AuthContextType {
  user: User | null;      // El usuario de Firebase (técnico)
  loading: boolean;       // ¿Estamos cargando la sesión?
}

// Creamos el contexto vacío
const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

// El Proveedor que envolverá la App
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Suscripción a cambios de estado (Login/Logout)
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        console.log("✅ Usuario detectado:", currentUser.email);
      } else {
        console.log("💤 Sin sesión activa");
      }
    });

    // Limpieza al desmontar
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto fácil (Sugar Syntax)
export const useAuth = () => useContext(AuthContext);