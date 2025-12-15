import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { usePsicologoData } from '../../hooks/usePsicologoData';
import { Link } from 'react-router-dom';
import { User, Mail } from 'lucide-react';

// AGREGAMOS LA IMPORTACIÓN DE LA INTERFAZ CORRECTA
// Asumo que tu interfaz de perfil global está en '../types/index'
import { UserProfile } from '../../types'; 

// Eliminamos la interfaz Paciente local, ya que usamos UserProfile

export default function PatientsPage() {
    const { user } = useAuth();
    // El hook usePsicologoData debe retornar un arreglo de UserProfile[]
    const { pacientes, loading } = usePsicologoData(user?.uid || null);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex h-full items-center justify-center text-indigo-400">
                    Cargando lista de pacientes...
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <h1 className="text-3xl font-bold text-white mb-8 border-b border-gray-700 pb-3">
                Módulo de Pacientes ({pacientes.length} Activos)
            </h1>

            {pacientes.length === 0 ? (
                // ... (código de lista vacía)
                <div className="p-6 bg-gray-800 rounded-xl text-center shadow-lg">
                    <p className="text-gray-400 text-lg">Aún no tienes pacientes asignados.</p>
                    <p className="text-sm mt-2 text-indigo-400">Puedes agregarlos manualmente en Firestore para comenzar las pruebas.</p>
                </div>
            ) : (
                // Tabla de Pacientes con Tailwind CSS
                <div className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
                    {/* Encabezado de la Tabla */}
                    <div className="grid grid-cols-4 p-4 font-semibold text-gray-400 border-b border-gray-700">
                        <div className="col-span-2">Nombre del Paciente</div>
                        <div className="col-span-1">Contacto Principal</div>
                        <div className="col-span-1 text-right">Acción</div>
                    </div>

                    {/* Filas de Pacientes */}
                    {pacientes.map((paciente: UserProfile) => ( // <--- USAMOS USERPROFILE AQUÍ
                        <Link 
                            key={paciente.uid} 
                            // RUTA CRÍTICA: /pacientes/[pacienteId]
                            to={`/pacientes/${paciente.uid}`} 
                            className="grid grid-cols-4 p-4 border-b border-gray-700 hover:bg-gray-700 transition duration-150 cursor-pointer items-center"
                        >
                            <div className="col-span-2 flex items-center">
                                <User className="w-5 h-5 mr-3 text-indigo-400" />
                                <span className="font-medium">{paciente.displayName || 'Sin Nombre'}</span>
                            </div>
                            <div className="col-span-1 text-gray-300 flex items-center text-sm">
                                <Mail className="w-4 h-4 mr-2 text-gray-500" />
                                {paciente.email || 'N/A'}
                            </div>
                            <div className="col-span-1 text-right text-indigo-400 font-semibold hover:text-indigo-300">
                                Ver Perfil &rarr;
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </DashboardLayout>
    );
}