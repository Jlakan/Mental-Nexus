import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Layout Principal (Menú Lateral)
import { DashboardLayout } from './components/layout/DashboardLayout';

// Pantallas de Autenticación y Onboarding
import { LoginScreen } from './modules/auth/LoginScreen';
import { OnboardingScreen } from './modules/auth/OnboardingScreen'; // 👈 NUEVA PANTALLA

// Pantallas del Profesional (Dashboard)
import { TherapistDashboard } from './modules/dashboard/TherapistDashboard';
import { PatientsList } from './modules/dashboard/PatientsList';
import { PatientDetail } from './modules/dashboard/PatientDetail';
import { ConnectionCenter } from './modules/dashboard/ConnectionCenter';

// Pantalla del Paciente (App Gamificada)
import { PatientHome } from './modules/gamification/PatientHome';

// Componente simple para errores 404
const NotFound = () => (
  <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
    <h1 className="text-4xl">404 - Sector No Encontrado</h1>
  </div>
);

// Componente simple para secciones en construcción
const Placeholder = ({ title }: { title: string }) => (
  <div className="p-12 text-center border-2 border-dashed border-gray-800 rounded-xl m-4">
    <h2 className="text-2xl font-bold mb-2 text-gray-500">{title}</h2>
    <p className="text-gray-600">Módulo en desarrollo por el equipo de ingeniería.</p>
  </div>
);

function App() {
  // Inicializamos el listener de Auth al arrancar la app
  const initializeAuth = useAuthStore((state) => state.initializeListener);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* 1. RUTAS PÚBLICAS Y DE ENTRADA */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/onboarding" element={<OnboardingScreen />} /> {/* 👈 NUEVA RUTA */}
        
        {/* 2. RUTAS PROTEGIDAS DEL PROFESIONAL (Dentro del Layout con Sidebar) */}
        <Route path="/app" element={<DashboardLayout />}>
          {/* Al entrar a /app, redirige automáticamente al Dashboard */}
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          
          {/* Módulos Operativos */}
          <Route path="dashboard" element={<TherapistDashboard />} />
          
          {/* Gestión de Pacientes */}
          <Route path="pacientes" element={<PatientsList />} />
          <Route path="pacientes/:id" element={<PatientDetail />} />
          
          {/* Centro de Conexión (Agenda) */}
          <Route path="agenda" element={<ConnectionCenter />} /> 
          
          {/* Módulos en Construcción */}
          <Route path="tests" element={<Placeholder title="Biblioteca de Tests" />} />
          <Route path="config" element={<Placeholder title="Configuración del Sistema" />} />
        </Route>
        
        {/* 3. RUTAS DE LA APP DEL PACIENTE (Sin Sidebar de profesional) */}
        <Route path="/paciente/*" element={<PatientHome />} />

        {/* 4. RUTAS POR DEFECTO Y ERRORES */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;