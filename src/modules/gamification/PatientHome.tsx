import React, { useEffect, useState } from 'react';
import { 
  Zap, Shield, Users, Trophy, CheckCircle2, Flame, Menu, ShoppingBag, LogOut, Loader
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { patientService } from '../../services/patientService';
import { Patient } from '../../types/patient';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';

export const PatientHome = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Efecto para cargar y escuchar cambios en tiempo real
  useEffect(() => {
    const loadPatient = async () => {
      if (!user?.email) return;
      
      // A. Buscamos el expediente por el email del usuario logueado
      const foundPatient = await patientService.getPatientByEmail(user.email);
      
      if (foundPatient) {
        // B. Si existe, nos suscribimos a cambios en tiempo real (Live Listen)
        const unsub = onSnapshot(doc(db, 'patients', foundPatient.id), (doc) => {
          setPatient({ id: doc.id, ...doc.data() } as Patient);
          setLoading(false);
        });
        return () => unsub();
      } else {
        setLoading(false);
      }
    };

    loadPatient();
  }, [user]);

  // Manejar el completado de misión
  const handleComplete = async (questId: string) => {
    if (!patient) return;
    // Disparamos la acción real a Firebase
    // (La UI se actualizará sola gracias al onSnapshot de arriba)
    await patientService.completeQuest(patient.id, questId);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
      <Loader className="animate-spin text-blue-500" size={40} />
    </div>
  );

  // Si no hay expediente vinculado al email
  if (!patient) return (
    <div className="min-h-screen bg-gray-950 p-6 flex flex-col items-center justify-center text-center text-white">
      <Shield size={60} className="text-gray-700 mb-4" />
      <h2 className="text-2xl font-bold mb-2">Cuenta no Vinculada</h2>
      <p className="text-gray-400 mb-6">
        No encontramos un expediente clínico asociado al correo 
        <span className="text-blue-400 block font-bold mt-1">{user?.email}</span>
      </p>
      <p className="text-sm text-gray-500 mb-8">
        Pide a tu profesional que cree tu expediente usando exactamente este correo.
      </p>
      <button onClick={logout} className="text-red-400 font-bold border border-red-900/50 px-6 py-2 rounded-lg hover:bg-red-900/20">
        Cerrar Sesión
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans pb-24">
      
      {/* 1. HEADER GAMIFICADO */}
      <div className="bg-gradient-to-b from-blue-900 to-gray-900 p-6 rounded-b-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        
        {/* Barra Superior */}
        <div className="flex justify-between items-center relative z-10 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-blue-400 bg-gray-800 flex items-center justify-center font-bold text-xl uppercase">
              {patient.firstName[0]}
            </div>
            <div>
              <h2 className="font-bold text-lg leading-none">{patient.firstName}</h2>
              <span className="text-xs text-blue-300 capitalize">{patient.therapyMode === 'tcc' ? 'Ingeniero' : 'Explorador'}</span>
            </div>
          </div>
          
          <button onClick={logout} className="bg-black/40 p-2 rounded-full border border-gray-700 hover:text-red-400 transition-colors">
            <LogOut size={16} />
          </button>
        </div>

        {/* Círculo de Nivel */}
        <div className="flex flex-col items-center justify-center relative z-10">
          <div className="w-24 h-24 bg-gray-900 rounded-full border-4 border-blue-500 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.6)] mb-2 relative animate-pulse-slow">
            <span className="text-4xl font-black italic">{patient.level}</span>
            <div className="absolute -bottom-2 bg-blue-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Nivel</div>
          </div>
          
          {/* Barra de XP */}
          <div className="w-full max-w-xs mt-2">
            <div className="flex justify-between text-xs text-blue-200 mb-1 px-2">
              <span>{patient.currentXP} XP</span>
              <span>{patient.nextLevelXP} XP</span>
            </div>
            <div className="h-4 bg-gray-800 rounded-full border border-gray-700 overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600 transition-all duration-1000 ease-out"
                style={{ width: `${(patient.currentXP / patient.nextLevelXP) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Monedas */}
        <div className="flex justify-center gap-6 mt-6 relative z-10">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-yellow-400 drop-shadow-md">{patient.gold}</span>
            <span className="text-[10px] uppercase tracking-widest text-yellow-600">Gold</span>
          </div>
          <div className="w-px h-10 bg-gray-700"></div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-purple-400 drop-shadow-md">{patient.nexos}</span>
            <span className="text-[10px] uppercase tracking-widest text-purple-600">Nexos</span>
          </div>
        </div>
      </div>

      {/* 2. TABLERO DE MISIONES */}
      <div className="p-6 space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2 text-white">
          <Trophy className="text-yellow-500" />
          Misiones Activas
        </h3>

        {(!patient.activeQuests || patient.activeQuests.length === 0) ? (
          <div className="text-center py-10 opacity-50 border border-dashed border-gray-700 rounded-xl">
            <p>No tienes misiones activas.</p>
            <p className="text-sm">¡Disfruta tu descanso!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {patient.activeQuests.map((quest, idx) => (
              <div 
                key={idx}
                className={`relative p-4 rounded-2xl border transition-all duration-300 ${
                  quest.completed 
                    ? 'bg-green-900/10 border-green-500/30 opacity-60 grayscale-[0.5]' 
                    : 'bg-gray-900 border-gray-800 hover:border-blue-500 shadow-lg'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner
                      ${quest.statReward === 'autocuidado' ? 'bg-green-500/20 text-green-400' : 
                        quest.statReward === 'desarrollo' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'
                      }`}>
                      {quest.statReward === 'autocuidado' ? <Shield /> : 
                       quest.statReward === 'desarrollo' ? <Zap /> : <Users />}
                    </div>

                    <div>
                      <h4 className={`font-bold text-lg ${quest.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                        {quest.title}
                      </h4>
                      <p className="text-sm text-gray-400 leading-tight mb-2">{quest.description}</p>
                      
                      {!quest.completed && (
                        <div className="flex gap-3 text-xs font-bold">
                          <span className="text-yellow-500 bg-yellow-900/20 px-2 py-1 rounded">+{quest.goldReward} G</span>
                          <span className="text-blue-400 bg-blue-900/20 px-2 py-1 rounded">+{quest.xpReward} XP</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => !quest.completed && handleComplete(quest.id)}
                    disabled={quest.completed}
                    className={`p-3 rounded-full transition-all active:scale-90 ${
                      quest.completed 
                        ? 'bg-transparent text-green-500 border border-green-500/50' 
                        : 'bg-gray-800 text-gray-400 hover:bg-green-600 hover:text-white border border-gray-700'
                    }`}
                  >
                    <CheckCircle2 size={24} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. NAVEGACIÓN INFERIOR */}
      <div className="fixed bottom-0 left-0 w-full bg-gray-900/90 backdrop-blur-md border-t border-gray-800 p-4 flex justify-around items-center z-50">
        <button className="flex flex-col items-center gap-1 text-blue-500">
          <Menu size={20} />
          <span className="text-[10px] font-bold">Inicio</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-white">
          <ShoppingBag size={20} />
          <span className="text-[10px] font-bold">Tienda</span>
        </button>
      </div>
    </div>
  );
};