import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 👈 Importamos el hook de navegación
import { 
  Plus, 
  Search, 
  User, 
  BrainCircuit, 
  Compass, 
  MoreVertical,
} from 'lucide-react';
import { usePatientStore } from '../../store/patientStore';
import { useAuthStore } from '../../store/authStore';
import { TherapyMode } from '../../types/patient';

export const PatientsList = () => {
  const { user } = useAuthStore();
  const { patients, fetchPatients, addPatient, loading } = usePatientStore();
  const navigate = useNavigate(); // 👈 Inicializamos la navegación
  
  // Estado para el modal de crear paciente
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    therapyMode: 'tcc' as TherapyMode
  });

  useEffect(() => {
    if (user?.uid) {
      fetchPatients(user.uid);
    }
  }, [user, fetchPatients]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    
    await addPatient(user.uid, newPatientData);
    setIsModalOpen(false);
    setNewPatientData({ firstName: '', lastName: '', email: '', therapyMode: 'tcc' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Expedientes Activos</h1>
          <p className="text-gray-400">Gestiona el progreso de tus Héroes.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-blue-900/20"
        >
          <Plus size={20} />
          <span>Invocar Paciente</span>
        </button>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="flex gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o expediente..." 
            className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* GRID DE PACIENTES */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Cargando datos del servidor...</div>
      ) : patients.length === 0 ? (
        <div className="text-center py-20 bg-gray-900/30 rounded-2xl border border-dashed border-gray-800">
          <User size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-xl font-medium text-gray-400">No tienes pacientes activos</h3>
          <p className="text-gray-600">Invoca al primero para comenzar su aventura.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((patient) => (
            <div 
              key={patient.id} 
              onClick={() => navigate(`/app/pacientes/${patient.id}`)} // 👈 AL HACER CLIC, VAMOS AL DETALLE
              className="group bg-gray-900 border border-gray-800 hover:border-blue-500/50 rounded-xl p-5 transition-all hover:shadow-xl hover:shadow-blue-900/10 cursor-pointer relative overflow-hidden"
            >
              
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-600/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 text-xl font-bold text-gray-300">
                    {patient.firstName[0]}{patient.lastName[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg leading-tight group-hover:text-blue-400 transition-colors">
                      {patient.firstName} {patient.lastName}
                    </h3>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Nivel {patient.level} • {patient.therapyMode.toUpperCase()}</p>
                  </div>
                </div>
                <button className="text-gray-500 hover:text-white transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>

              {/* STATS RÁPIDOS */}
              <div className="space-y-3 mb-4 relative z-10">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Experiencia (XP)</span>
                  <span>{patient.currentXP} / {patient.nextLevelXP}</span>
                </div>
                <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${(patient.currentXP / patient.nextLevelXP) * 100}%` }}
                  />
                </div>
              </div>

              {/* FOOTER DEL CARD */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-800 relative z-10">
                <div className="flex items-center gap-2 text-xs text-yellow-500 font-medium bg-yellow-900/20 px-2 py-1 rounded">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  {patient.gold} Gold
                </div>
                <div className="flex items-center gap-2 text-xs text-purple-400 font-medium bg-purple-900/20 px-2 py-1 rounded">
                  <Compass size={12} />
                  {patient.nexos} Nexos
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* MODAL CREAR PACIENTE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Nuevo Expediente</h2>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Nombre</label>
                  <input 
                    required
                    value={newPatientData.firstName}
                    onChange={e => setNewPatientData({...newPatientData, firstName: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Apellido</label>
                  <input 
                    required
                    value={newPatientData.lastName}
                    onChange={e => setNewPatientData({...newPatientData, lastName: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Email del Paciente</label>
                <input 
                  type="email"
                  required
                  value={newPatientData.email}
                  onChange={e => setNewPatientData({...newPatientData, email: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-3">Modelo Terapéutico (Motor de Juego)</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewPatientData({...newPatientData, therapyMode: 'tcc'})}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      newPatientData.therapyMode === 'tcc'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750'
                    }`}
                  >
                    <BrainCircuit size={24} />
                    <span className="text-sm font-bold">Ingeniero (TCC)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewPatientData({...newPatientData, therapyMode: 'act'})}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      newPatientData.therapyMode === 'act'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750'
                    }`}
                  >
                    <Compass size={24} />
                    <span className="text-sm font-bold">Explorador (ACT)</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-gray-400 hover:text-white transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-all"
                >
                  Crear Expediente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};