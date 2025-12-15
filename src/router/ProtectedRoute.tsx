import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        Cargando sistema...
      </div>
    );
  }

  // 1. Si no hay usuario o perfil, mandar al login
  if (!user || !userProfile) {
    return <Navigate to="/login" replace />;
  }

  // 2. Lógica de Permisos (Solo si allowedRoles fue especificado)
  if (allowedRoles && allowedRoles.length > 0) {
    
    // El usuario es Admin si userProfile.isAdmin es explícitamente true
    const isUserAdmin = userProfile.isAdmin === true;
    const userRole = userProfile.role || 'no-role';
    
    // El acceso es permitido si:
    // A) El usuario es Admin, O
    // B) El rol del usuario está incluido en los allowedRoles.
    const canAccess = 
      isUserAdmin || 
      (allowedRoles.includes(userRole));
      
    if (!canAccess) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-900 text-red-500 font-bold">
                ⛔ Acceso Denegado: No tienes permisos para ver esta sección. (Rol: {userRole}, Admin: {isUserAdmin ? 'Sí' : 'No'})
            </div>
        );
    }
  }

  return <Outlet />;
};