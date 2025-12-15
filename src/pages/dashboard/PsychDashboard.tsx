import { useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Users, Clock, AlertTriangle, ArrowUpRight } from 'lucide-react';
// Importaciones de Contexto y Hooks
import { useAuth } from '../../context/AuthContext'; 
import { usePsicologoData } from '../../hooks/usePsicologoData';
import { useCitasData } from '../../hooks/useCitasData'; // <--- NUEVA IMPORTACIÓN

export default function PsychDashboard() {
  const { user } = useAuth();
  
  // Llamada al hook de datos para pacientes
  const { pacientes, loading: loadingPacientes } = usePsicologoData(user?.uid || null);
  
  // Llamada al hook de datos para citas
  const { citasHoy, proximaCita, loading: loadingCitas } = useCitasData(user?.uid || null); // <--- NUEVA LLAMADA

  // El Dashboard está cargando si cualquiera de los hooks está cargando
  const loading = loadingPacientes || loadingCitas; 
  
  // Función auxiliar para formatear la hora de la próxima cita
  const formatProximaHora = (cita) => {
      if (!cita) return "No hay citas";
      // Convertir el Timestamp de Firestore a objeto Date de JS
      const date = cita.fechaHora.toDate(); 
      // Formatear a hora local (ej: "14:00")
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };


  // --- LÓGICA DE PRUEBA Y DIAGNÓSTICO EN CONSOLA ---
  useEffect(() => {
      if (!loading) {
          console.log("--- RESULTADO GLOBAL DEL DASHBOARD ---");
          console.log(`Pacientes Activos (REAL): ${pacientes.length}`);
          console.log(`Citas Hoy (REAL): ${citasHoy.length}`); // <--- DATO REAL
          console.log(`Próxima Cita: ${proximaCita ? formatProximaHora(proximaCita) : 'N/A'}`); // <--- DATO REAL
          console.log("----------------------------------");
      }
  }, [loading, pacientes, citasHoy, proximaCita]);


  // 1. Manejo del estado de carga combinado
  if (loading) {
      return (
          <DashboardLayout>
              <div className="text-white text-lg">Cargando todos los datos del panel...</div>
          </DashboardLayout>
      );
  }

  // 2. VISTA PRINCIPAL (Usamos los datos reales de ambos hooks)
  return (
    <DashboardLayout>
      {/* Título y Saludo */}
      <h1 className="text-2xl font-bold text-white mb-6">
        Vista General de {user?.displayName || "Psicólogo"}
      </h1>

      {/* Sección de Indicadores (Tarjetas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Indicador de Pacientes Activos */}
        <CardIndicador 
          title="Pacientes Activos" 
          value={pacientes.length} // DATO REAL
          icon={Users} 
          trend="+2 esta semana"
        />
        
        {/* Indicador de Citas Hoy */}
        <CardIndicador 
          title="Citas Hoy" 
          value={citasHoy.length} // <--- DATO REAL
          icon={Clock} 
          // Reemplazamos 14:00 por la hora real
          trend={`Próxima: ${formatProximaHora(proximaCita)}`} 
        />

        {/* Otros indicadores fijos */}
        <CardIndicador 
          title="Alertas de Riesgo" 
          value={0}
          icon={AlertTriangle} 
          trend="Todo normal"
        />
      </div>

    </DashboardLayout>
  );
}

// ------------------------------------------------------------------
// --- COMPONENTES AUXILIARES (DEJADOS COMO ESTÁN) ---

interface CardProps {
    title: string;
    value: number | string;
    icon: any; 
    trend: string;
}

const CardIndicador: React.FC<CardProps> = ({ title, value, icon: Icon, trend }) => (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg text-white">
        <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-400">{title}</h3>
            <Icon className="w-5 h-5 text-indigo-400" />
        </div>
        <p className="text-3xl font-bold mt-2">{value}</p>
        <div className="flex items-center text-sm text-green-400 mt-1">
            <ArrowUpRight className="w-4 h-4 mr-1" />
            <span>{trend}</span>
        </div>
    </div>
);