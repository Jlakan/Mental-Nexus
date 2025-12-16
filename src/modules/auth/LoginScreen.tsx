import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hexagon, BrainCircuit, ArrowRight, Loader } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const LoginScreen = () => {
  const { loginWithGoogle, loading, user, needsOnboarding, error } = useAuthStore();
  const navigate = useNavigate();

  // 🤖 EFECTO DE REDIRECCIÓN INTELIGENTE
  // Este es el "Cerebro" que decide a dónde va el usuario después de loguearse
  useEffect(() => {
    if (user) {
      if (needsOnboarding) {
        // Usuario nuevo o sin rol -> A elegir perfil
        navigate('/onboarding');
      } else if (user.role === 'paciente') {
        // Paciente registrado -> Al videojuego
        navigate('/paciente');
      } else if (user.role === 'psicologo') {
        // Profesional registrado -> Al dashboard
        navigate('/app/dashboard');
      }
    }
  }, [user, needsOnboarding, navigate]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Fondo Decorativo Cyberpunk */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10">
        
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Hexagon className="text-blue-600 fill-blue-900/20" size={64} strokeWidth={1.5} />
              <BrainCircuit className="text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Mental Nexus</h1>
          <p className="text-gray-400">Sistema de Gestión Terapéutica & RPG</p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-900 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <button
          onClick={loginWithGoogle}
          disabled={loading}
          className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader className="animate-spin" size={24} />
              <span>Conectando Neuro-Enlace...</span>
            </>
          ) : (
            <>
              <img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5" />
              <span>Entrar con Google</span>
              <ArrowRight size={20} className="text-gray-400" />
            </>
          )}
        </button>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-600">
            v1.2.0 • Protocolo Onboarding Activo
          </p>
        </div>
      </div>
    </div>
  );
};