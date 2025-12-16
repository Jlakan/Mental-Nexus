import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, BrainCircuit, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const OnboardingScreen = () => {
  const navigate = useNavigate();
  const { registerRole, user } = useAuthStore();
  
  const [step, setStep] = useState<'select' | 'patient-code'>('select');
  const [loading, setLoading] = useState(false);
  const [therapistCode, setTherapistCode] = useState('');
  const [error, setError] = useState('');

  // OPCIÓN A: SOY PROFESIONAL
  const handleProfessionalSelect = async () => {
    if(!window.confirm("¿Confirmas que eres un Profesional de la Salud? Se creará una cuenta de gestión.")) return;
    
    setLoading(true);
    try {
      await registerRole('psicologo');
      navigate('/app/dashboard');
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  // OPCIÓN B: SOY PACIENTE (Validar Código)
  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Intentamos registrar como paciente vinculando el código
      await registerRole('paciente', { therapistCode });
      navigate('/paciente');
    } catch (err: any) {
      setError('Código inválido o error de conexión.');
      setLoading(false);
    }
  };

  // OPCIÓN C: PACIENTE SIN CÓDIGO (Demo)
  const handleDemoPatient = () => {
     alert("Funcionalidad 'Buscar Terapeuta' próximamente. Por favor pide el código a tu profesional.");
  };

  if (step === 'patient-code') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl w-full max-w-md">
          <button onClick={() => setStep('select')} className="text-gray-500 mb-4 hover:text-white">← Volver</button>
          <h2 className="text-2xl font-bold text-white mb-2">Código de Vinculación</h2>
          <p className="text-gray-400 mb-6 text-sm">Ingresa el código que te dio tu profesional (Ej: STARK-8821).</p>
          
          <form onSubmit={handlePatientSubmit} className="space-y-4">
            <input 
              type="text" 
              placeholder="CÓDIGO (Ej: ALEX-1234)"
              className="w-full bg-gray-950 border border-gray-700 rounded-xl p-4 text-center text-xl tracking-widest text-white uppercase focus:border-blue-500 outline-none"
              value={therapistCode}
              onChange={(e) => setTherapistCode(e.target.value.toUpperCase())}
            />
            
            {error && <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded">{error}</div>}

            <button disabled={loading || !therapistCode} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold disabled:opacity-50">
              {loading ? 'Vinculando...' : 'Comenzar Aventura'}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-gray-800 pt-4">
            <button onClick={handleDemoPatient} className="text-xs text-gray-500 hover:text-white">
              ¿No tienes código?
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white">Bienvenido, {user?.displayName}</h1>
        <p className="text-gray-400">Selecciona tu perfil para configurar Mental Nexus</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        
        {/* TARJETA PACIENTE */}
        <button 
          onClick={() => setStep('patient-code')}
          className="group bg-gray-900 border border-gray-800 hover:border-blue-500 p-8 rounded-3xl text-left transition-all hover:shadow-2xl hover:shadow-blue-900/20 flex flex-col items-center text-center"
        >
          <div className="w-20 h-20 bg-blue-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <User className="text-blue-400" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Soy Paciente</h3>
          <p className="text-gray-400 text-sm mb-6">
            Quiero mejorar mi salud mental, cumplir misiones y subir de nivel.
          </p>
          <span className="text-blue-500 font-bold flex items-center gap-2">
            Continuar <ArrowRight size={18} />
          </span>
        </button>

        {/* TARJETA PROFESIONAL */}
        <button 
          onClick={handleProfessionalSelect}
          className="group bg-gray-900 border border-gray-800 hover:border-purple-500 p-8 rounded-3xl text-left transition-all hover:shadow-2xl hover:shadow-purple-900/20 flex flex-col items-center text-center"
        >
          <div className="w-20 h-20 bg-purple-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <BrainCircuit className="text-purple-400" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Soy Profesional</h3>
          <p className="text-gray-400 text-sm mb-6">
            Soy Psicólogo, Coach o Nutriólogo. Quiero gestionar pacientes.
          </p>
          <div className="flex gap-2 mb-4">
             <span className="text-[10px] bg-purple-900/30 text-purple-300 px-2 py-1 rounded border border-purple-500/30">Psicología</span>
             <span className="text-[10px] bg-gray-800 text-gray-500 px-2 py-1 rounded border border-gray-700">Nutrición (Pronto)</span>
          </div>
          <span className="text-purple-500 font-bold flex items-center gap-2">
            Crear Consultorio <ArrowRight size={18} />
          </span>
        </button>

      </div>
    </div>
  );
};