import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Para navegar
import { useAuthStore } from '../../store/authStore'; // Importamos el cerebro
import { ShieldCheck, Loader2 } from 'lucide-react'; // Iconos bonitos

export const LoginScreen = () => {
  const navigate = useNavigate();
  const { loginWithGoogle, user, profile, loading } = useAuthStore();

  // EFECTO: Si el usuario ya está logueado y tiene perfil, lo mandamos a su casa
  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'psicologo' || profile.role === 'admin') {
        navigate('/app/dashboard');
      } else if (profile.role === 'paciente') {
        navigate('/paciente/home');
      }
    }
  }, [user, profile, navigate]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900 text-white relative overflow-hidden">
      
      {/* Decoración de fondo (Estilo Sidney) */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80')] opacity-10 bg-cover bg-center" />

      <div className="z-10 bg-gray-800/80 p-8 rounded-2xl backdrop-blur-md border border-gray-700 shadow-2xl max-w-md w-full text-center">
        
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-gray-700 rounded-full border border-neon-blue">
            <ShieldCheck className="w-12 h-12 text-blue-400" />
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-2 text-white tracking-tighter">MENTAL NEXUS</h1>
        <p className="text-gray-400 mb-8 text-sm uppercase tracking-widest">Protocolo de Acceso Seguro</p>

        <button 
          onClick={loginWithGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Conectando...
            </>
          ) : (
            <>
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
              Entrar con Google
            </>
          )}
        </button>

        <p className="mt-6 text-xs text-gray-500">
          Versión Alpha 0.2.0 - Acceso Restringido
        </p>
      </div>
    </div>
  );
};