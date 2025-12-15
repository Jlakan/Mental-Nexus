import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, BrainCircuit, Compass, Shield, Users, 
  Zap, Calendar, PlusCircle, Trash2 
} from 'lucide-react';
import { usePatientStore } from '../../store/patientStore';
import { Quest } from '../../types/patient';
import { Timestamp } from 'firebase/firestore';

export const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { patients, addQuest } = usePatientStore();
  const [isQuestModalOpen, setQuestModalOpen] = useState(false);

  // Encontrar al paciente en memoria
  const patient = patients.find(p => p.id === id);

  if (!patient) return <div className="p-10 text-white">Paciente no encontrado o cargando...</div>;

  // --- FORMULARIO DE NUEVA QUEST ---
  const [newQuest, setNewQuest] = useState({
    title: '',
    description: '',
    statReward: 'autocuidado' as const,
    frequency: 'diario' as const
  });

  const handleAddQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculamos fecha de caducidad (2 semanas)
    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(now.getDate() + 14);

    const questData: Quest = {
      id: Math.random().toString(36).substr(2, 9),
      title: newQuest.title,
      description: newQuest.description,
      statReward: newQuest.statReward as any,
      xpReward: 50, // Valor estándar
      goldReward: 10,
      frequency: newQuest.frequency,
      assignedAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiryDate),
      completed: false,
      streak: 0
    };

    await addQuest(patient.id, questData);
    setQuestModalOpen(false);
    setNewQuest({ title: '', description: '', statReward: 'autocuidado', frequency: 'diario' });
  };

  // --- CÁLCULO VISUAL DEL RADAR ---
  // Normalizamos los stats para el gráfico (Max 100)
  const stats = patient.stats;
  const getPoint = (value: number, angle: number) => {
    const radius = (value / 50) * 80; // Escala visual
    const x = 100 + radius * Math.cos(angle * Math.PI / 180);
    const y = 100 + radius * Math.sin(angle * Math.PI / 180);
    return `${x},${y}`;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* HEADER DE NAVEGACIÓN */}
      <button onClick={() => navigate('/app/pacientes')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
        <ArrowLeft size={20} /> Volver a la lista
      </button>

      {/* TARJETA DE PERFIL SUPERIOR */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-10 -mt-10" />
        
        <div className="flex flex-col md:flex-row gap-6 items-center relative z-10">
          {/* AVATAR & NIVEL */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-blue-500 flex items-center justify-center text-3xl font-bold text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]">
              {patient.firstName[0]}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full border border-gray-900">
              Lvl {patient.level}
            </div>
          </div>

          {/* INFO TEXTO */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-white">{patient.firstName} {patient.lastName}</h1>
            <div className="flex items-center justify-center md:justify-start gap-4 mt-2 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                {patient.therapyMode === 'tcc' ? <BrainCircuit size={16} /> : <Compass size={16} />}
                {patient.therapyMode === 'tcc' ? 'Ingeniero (TCC)' : 'Explorador (ACT)'}
              </span>
              <span className="text-yellow-500 font-medium">{patient.gold} Gold</span>
              <span className="text-purple-400 font-medium">{patient.nexos} Nexos</span>
            </div>
            {/* BARRA DE XP */}
            <div className="mt-4 w-full max-w-md">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>XP Actual</span>
                <span>{patient.currentXP} / {patient.nextLevelXP}</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${(patient.currentXP / patient.nextLevelXP) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* ACCIONES RÁPIDAS */}
          <div className="flex gap-2">
            <button 
              onClick={() => setQuestModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all"
            >
              <PlusCircle size={20} /> Asignar Misión
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: RADAR DE STATS */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col items-center">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Zap className="text-yellow-400" size={20} />
            Atributos del Héroe
          </h3>
          
          <div className="relative w-64 h-64">
            {/* SVG RADAR CHART */}
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
              {/* Fondo del radar (Hexágono base) */}
              <polygon points="100,20 170,60 170,140 100,180 30,140 30,60" fill="none" stroke="#374151" strokeWidth="1" />
              <polygon points="100,60 135,80 135,120 100,140 65,120 65,80" fill="none" stroke="#374151" strokeWidth="0.5" />
              
              {/* Ejes */}
              <line x1="100" y1="100" x2="100" y2="20" stroke="#374151" strokeWidth="0.5" /> {/* Arriba */}
              <line x1="100" y1="100" x2="170" y2="140" stroke="#374151" strokeWidth="0.5" /> {/* Der Abajo */}
              <line x1="100" y1="100" x2="30" y2="140" stroke="#374151" strokeWidth="0.5" /> {/* Izq Abajo */}

              {/* El área de stats del paciente */}
              {/* Mapeamos: Arriba=Autocuidado, DerAbajo=Desarrollo, IzqAbajo=Vinculación */}
              <polygon 
                points={`${getPoint(stats.autocuidado, -90)} ${getPoint(stats.desarrollo, 30)} ${getPoint(stats.vinculacion, 150)}`}
                fill="rgba(59, 130, 246, 0.4)" 
                stroke="#3B82F6" 
                strokeWidth="2"
              />
            </svg>

            {/* Etiquetas */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-2 text-xs font-bold text-green-400">Autocuidado</div>
            <div className="absolute bottom-10 right-0 text-xs font-bold text-blue-400">Desarrollo</div>
            <div className="absolute bottom-10 left-0 text-xs font-bold text-pink-400">Vinculación</div>
          </div>
          
          <div className="mt-4 grid grid-cols-3 gap-2 w-full text-center text-xs text-gray-400">
            <div className="bg-gray-800 p-2 rounded">Auto: {stats.autocuidado}</div>
            <div className="bg-gray-800 p-2 rounded">Des: {stats.desarrollo}</div>
            <div className="bg-gray-800 p-2 rounded">Vinc: {stats.vinculacion}</div>
          </div>
        </div>

        {/* COLUMNA DERECHA: MISIONES ACTIVAS (2 COLUMNAS DE ANCHO) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="text-green-400" size={20} />
            Misiones Activas ({patient.activeQuests?.length || 0}/4)
          </h3>

          {(!patient.activeQuests || patient.activeQuests.length === 0) ? (
            <div className="bg-gray-900/50 border border-dashed border-gray-700 rounded-xl p-10 text-center">
              <p className="text-gray-500 mb-4">No hay misiones asignadas.</p>
              <button onClick={() => setQuestModalOpen(true)} className="text-blue-400 hover:text-blue-300 font-medium">
                + Asignar primera misión
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {patient.activeQuests.map((quest, idx) => (
                <div key={idx} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center group hover:border-blue-500/50 transition-colors">
                  <div className="flex gap-4 items-center">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl
                      ${quest.statReward === 'autocuidado' ? 'bg-green-900/30 text-green-500' : 
                        quest.statReward === 'vinculacion' ? 'bg-pink-900/30 text-pink-500' : 'bg-blue-900/30 text-blue-500'
                      }`}>
                      {quest.statReward === 'autocuidado' ? <Shield size={24} /> : 
                       quest.statReward === 'vinculacion' ? <Users size={24} /> : <Zap size={24} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{quest.title}</h4>
                      <p className="text-xs text-gray-400">{quest.description}</p>
                      <div className="flex gap-3 mt-1 text-xs">
                        <span className="text-yellow-500">+{quest.goldReward} Gold</span>
                        <span className="text-gray-500">Expira: {new Date(quest.expiresAt.seconds * 1000).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <button className="text-gray-600 hover:text-red-400 p-2">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL PARA AGREGAR QUEST */}
      {isQuestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Nueva Misión Estratégica</h2>
            <form onSubmit={handleAddQuest} className="space-y-4">
              
              <div>
                <label className="text-xs text-gray-400">Título de la Tarea</label>
                <input 
                  required
                  placeholder="Ej: Caminar 15 min, Dormir a las 10pm..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                  value={newQuest.title}
                  onChange={e => setNewQuest({...newQuest, title: e.target.value})}
                />
              </div>

              <div>
                <label className="text-xs text-gray-400">Descripción (Instrucción para el paciente)</label>
                <textarea 
                  required
                  placeholder="Detalles de cómo cumplir la misión..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none h-24 resize-none"
                  value={newQuest.description}
                  onChange={e => setNewQuest({...newQuest, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400">Stat a Mejorar</label>
                  <select 
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white outline-none"
                    value={newQuest.statReward}
                    onChange={e => setNewQuest({...newQuest, statReward: e.target.value as any})}
                  >
                    <option value="autocuidado">🛡️ Autocuidado</option>
                    <option value="desarrollo">⚡ Desarrollo</option>
                    <option value="vinculacion">❤️ Vinculación</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Frecuencia</label>
                  <select 
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white outline-none"
                    value={newQuest.frequency}
                    onChange={e => setNewQuest({...newQuest, frequency: e.target.value as any})}
                  >
                    <option value="diario">🔄 Diaria</option>
                    <option value="semanal">📅 Semanal</option>
                    <option value="unico">🎯 Única vez</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setQuestModalOpen(false)} className="flex-1 py-3 text-gray-400 hover:text-white">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold">Asignar (Expira en 14 días)</button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};