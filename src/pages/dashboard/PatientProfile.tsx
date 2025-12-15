import { useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { usePatientProfile } from '../../hooks/usePatientProfile'; 
import { Mail, User } from 'lucide-react'; 

export default function PatientProfile() {
    // 1. Obtener el ID de la URL
    const { pacienteId } = useParams<{ pacienteId: string }>();

    // 2. Usar el hook para obtener los datos del paciente en tiempo real
    const { paciente, loading } = usePatientProfile(pacienteId);

    // --- MANEJO DE ESTADOS ---

    // 3. Estado de Carga
    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex h-full items-center justify-center text-indigo-400 text-lg">
                    Cargando perfil clínico...
                </div>
            </DashboardLayout>
        );
    }

    // 4. Estado de No Encontrado (Si el hook retorna null y ya terminó de cargar)
    if (!paciente) {
        return (
            <DashboardLayout>
                <div className="p-10 bg-red-900/50 rounded-xl shadow-2xl border border-red-600">
                    <h1 className="text-3xl font-bold text-red-400 mb-4">
                        Paciente No Encontrado
                    </h1>
                    <p className="text-gray-200">
                        No existe un perfil en la base de datos para el ID: 
                        <span className="font-mono bg-red-800 p-1 rounded ml-2">{pacienteId}</span>.
                    </p>
                </div>
            </DashboardLayout>
        );
    }

    // --- VISTA PRINCIPAL (Datos cargados) ---

    return (
        <DashboardLayout>
            
            {/* Encabezado del Perfil */}
            <div className="flex items-center justify-between border-b border-gray-700 pb-4 mb-8">
                <div className="flex items-center">
                    <img 
                        src={paciente.photoURL || 'default-avatar.png'}
                        alt={paciente.displayName} 
                        className="w-16 h-16 rounded-full mr-4 border-2 border-indigo-500"
                    />
                    <div>
                        <h1 className="text-4xl font-extrabold text-white">
                            {paciente.displayName || 'Paciente sin nombre'}
                        </h1>
                        <p className="text-indigo-400 text-lg">
                            {/* Mostramos el rol, que debería ser 'paciente' */}
                            {paciente.role === 'paciente' ? 'Paciente Activo' : 'Rol: ' + paciente.role}
                        </p>
                    </div>
                </div>
                {/* Botones de acción aquí */}
            </div>

            {/* Tarjeta de Información Básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                
                {/* Email */}
                <div className="bg-gray-800 p-5 rounded-xl shadow-lg flex items-center">
                    <Mail className="w-6 h-6 mr-4 text-gray-500" />
                    <div>
                        <p className="text-sm font-medium text-gray-400">Email</p>
                        <p className="text-white">{paciente.email}</p>
                    </div>
                </div>
                
                {/* UID (Información de Depuración) */}
                <div className="bg-gray-800 p-5 rounded-xl shadow-lg flex items-center">
                    <User className="w-6 h-6 mr-4 text-gray-500" />
                    <div>
                        <p className="text-sm font-medium text-gray-400">ID del Paciente (UID)</p>
                        <p className="text-white font-mono text-sm break-all">{paciente.uid}</p>
                    </div>
                </div>
            </div>

            {/* SECCIONES CLÍNICAS FUTURAS */}
            <div className="mt-8">
                <h2 className="text-2xl font-semibold text-white mb-4">Historial y Notas Clínicas</h2>
                <div className="p-6 bg-gray-800 rounded-xl border-l-4 border-yellow-500">
                    <p className="text-gray-400">
                        Esta sección está lista para recibir la lógica de subcolecciones (Notas, Sesiones, Diagnósticos)
                        del paciente, completando así la arquitectura de Clean Architecture.
                    </p>
                </div>
            </div>

        </DashboardLayout>
    );
}