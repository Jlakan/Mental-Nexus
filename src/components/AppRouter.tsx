// src/components/AppRouter.tsx

import React from 'react';
import { useAuth } from '../context/AuthContext'; 

// --- Componentes de Pantalla Ficticios (Reemplaza con tus importaciones reales) ---
// Estos componentes son marcadores de posición para ilustrar la lógica de navegación.
const LoginScreen = () => <h1>🔐 Pantalla de Inicio de Sesión</h1>;
const AdminDashboard = () => <h1>👑 Panel de Administrador</h1>;
const PsicologoDashboard = () => <h1>🧠 Panel de Psicólogo</h1>;
const PacienteDashboard = () => <h1>🧘 Panel de Paciente</h1>;
const CuentaPendienteScreen = () => <h1>🔒 Cuenta Profesional Pendiente de Aprobación</h1>;
const PacienteSinVinculoScreen = () => <h1>🔗 Paciente: Ingrese Código de Vinculación</h1>;
// ----------------------------------------------------------------------------------


const AppRouter: React.FC = () => {
  // Obtenemos los estados críticos de la autenticación
  const { loading, currentUser, userProfile } = useAuth();

  if (loading) {
    // 1. Muestra un loader mientras se inicializa Firebase y se verifica el perfil
    return <div style={{ padding: '50px', textAlign: 'center' }}>Cargando la aplicación...</div>;
  }

  // 2. Usuario No Autenticado: Redirigir a Login
  if (!currentUser) {
    return <LoginScreen />;
  }

  // 3. Usuario Autenticado pero Perfil Aún No Cargado
  // (Este estado es un indicativo de error si perdura, ya que AuthContext lo crea inmediatamente)
  if (!userProfile) {
    return <div style={{ padding: '50px', color: 'red', textAlign: 'center' }}>
      Error Crítico: Perfil de usuario autenticado no encontrado en Firestore.
    </div>;
  }
  
  // 4. Redirección Basada en el Campo 'rol' y la Bandera 'isAuthorized'
  
  switch (userProfile.rol) {
    
    case 'admin':
      // El administrador tiene acceso total inmediatamente
      return <AdminDashboard />;

    case 'psicologo':
      if (userProfile.isAuthorized) {
        // Psicólogo Aprobado (Autorizado por el Admin)
        return <PsicologoDashboard />;
      } else {
        // Psicólogo Pendiente de Aprobación
        return <CuentaPendienteScreen />;
      }

    case 'paciente':
      // El paciente requiere estar autorizado/vinculado
      if (userProfile.isAuthorized) {
        // Paciente Vinculado y Autorizado
        return <PacienteDashboard />;
      } else {
        // Paciente sin Vinculación (requiere ingresar código de psicólogo)
        return <PacienteSinVinculoScreen />;
      }
      
    default:
      // Fallback para roles desconocidos o futuros (seguridad)
      console.warn(`Rol desconocido detectado: ${userProfile.rol}`);
      return <LoginScreen />;
  }
};

export default AppRouter;