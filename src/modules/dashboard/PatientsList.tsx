import React, { useEffect, useState } from 'react';
import { Plus, Search, MoreVertical, Shield, Zap, Trash2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { patientService } from '../../services/patientService';
import { useAuthStore } from '../../store/authStore';
import { Patient } from '../../types/patient';

export const PatientsList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar pacientes
  const fetchPatients = async () => {
    if (user?.uid) {
      setLoading(true);
      try {
        const data = await patientService.getMyPatients(user.uid);
        setPatients(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [user]);

  // 👇 FUNCIÓN DE ELIMINACIÓN
  const handleDelete = async (e: React.MouseEvent, patientId: string, patientName: string) => {
    e.stopPropagation(); // Evita que al dar click se abra el detalle del paciente
    
    const confirmDelete = window.confirm(
      `¿Estás seguro de que quieres dar de baja a ${patientName}?\n\nEsta acción eliminará su expediente de tu lista, pero el usuario conservará su cuenta.`
    );

    if (confirmDelete) {
      try {
        await patientService.deletePatient(patientId);
        // Actualizamos la lista localmente para que desaparezca al instante
        setPatients(prev => prev.filter(p => p.id !== patientId));
      } catch (error) {
        alert("Hubo un error al eliminar.");
      }
    }
  };

  // Filtrado de búsqueda
  const filteredPatients = patients.filter(p => 
    p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Expedientes Activos</h1>
          <p className="text-gray-400">Gestiona el progreso de tus Héroes.</p>
        </div>
        <button 
          onClick={() => alert("Usa tu código de invitación para agregar pacientes automáticamente.")}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
        >
          <Plus size={20} />
          Invocar Paciente
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nombre o expediente..." 
          className="w-full bg-gray-900 border border-gray-800 text-white pl-12 pr-4 py-3 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Lista de Tarjetas */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Cargando expedientes...</div>
      ) : filteredPatients.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-800 rounded-2xl">
          <p className="text-gray-500 mb-2">No se encontraron pacientes.</p>
          <p className="text-sm text-gray-600">Comparte tu código para empezar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => (
            <div 
              key={patient.id}
              onClick={() => navigate(`/app/pacientes/${patient.id}`)}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all cursor-pointer group relative overflow-hidden"
            >
              {/* Fondo decorativo hover */}
              <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-lg font-bold text-gray-400 border border-gray-700">
                    {patient.firstName[0]}{patient.lastName[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg leading-none">{patient.firstName} {patient.lastName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Nivel {patient.level}</span>
                      <span className="text-gray-600 text-[10px]">•</span>
                      <span className="text-xs text-gray-500 uppercase">{patient.therapyMode === 'tcc' ? 'TCC' : 'ACT'}</span>
                    </div>
                  </div>
                </div>
                
                {/* BOTÓN DE ELIMINAR (Protegido por stopPropagation) */}
                <button 
                  onClick={(e) => handleDelete(e, patient.id, patient.firstName)}
                  className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-900/20 rounded-lg transition-colors z-20"
                  title="Dar de baja expediente"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Barra de XP */}
              <div className="space-y-1 mb-4 relative z-10">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Experiencia (XP)</span>
                  <span>{patient.currentXP} / {patient.nextLevelXP}</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full" 
                    style={{ width: `${(patient.currentXP / patient.nextLevelXP) * 100}%` }}
                  />
                </div>
              </div>

              {/* Stats Footer */}
              <div className="flex gap-3 relative z-10">
                <div className="bg-yellow-900/20 text-yellow-500 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border border-yellow-900/30">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  {patient.gold} Gold
                </div>
                <div className="bg-purple-900/20 text-purple-400 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border border-purple-900/30">
                  <Zap size={10} />
                  {patient.nexos} Nexos
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};