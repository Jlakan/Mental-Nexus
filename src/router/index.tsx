import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importaciones de Páginas Públicas (¡CORREGIDO: usando LoginScreen!)
import LoginScreen from '../pages/auth/LoginScreen'; // <--- CORRECCIÓN AQUÍ
// Import NotFoundPage o similar
const NotFoundPage = () => <div className="flex h-screen items-center justify-center bg-gray-900 text-white text-2xl">404 | Página No Encontrada</div>;


// Importaciones de Componentes de Router y Páginas Protegidas
import { ProtectedRoute } from './ProtectedRoute';
import PsychDashboard from '../pages/dashboard/PsychDashboard';

// Importaciones del Módulo de Pacientes
import PatientsPage from '../pages/dashboard/PatientsPage';
import PatientProfile from '../pages/dashboard/PatientProfile';


/**
 * Componente Router principal que define todas las rutas de la aplicación.
 */
export const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                
                {/* RUTAS PÚBLICAS */}
                {/* Redirigir la raíz a la página de login */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginScreen />} /> {/* <--- CORRECCIÓN AQUÍ */}
                
                {/* ======================================================= */}
                {/* GRUPO DE RUTAS PROTEGIDAS (REQUIERE AUTENTICACIÓN) */}
                
                {/* Rutas para Admins y Psicólogos */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'psicologo']} />}>
                    
                    {/* DASHBOARD */}
                    <Route path="/dashboard" element={<PsychDashboard />} />

                    {/* MÓDULO DE PACIENTES */}
                    <Route path="/pacientes" element={<PatientsPage />} />
                    <Route path="/pacientes/:pacienteId" element={<PatientProfile />} />
                    
                    {/* ... otras rutas protegidas ... */}
                </Route>
                
                {/* ======================================================= */}
                {/* RUTA CATCH-ALL (404) */}
                <Route path="*" element={<NotFoundPage />} />

            </Routes>
        </BrowserRouter>
    );
};