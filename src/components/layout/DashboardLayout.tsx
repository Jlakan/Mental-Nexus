import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '../../store/authStore';
import { Loader } from 'lucide-react';

export const DashboardLayout = () => {
  const { user, loading } = useAuthStore();

  // 1. Si estamos verificando si estás logueado, mostramos un spinner
  if (loading) {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center">
        <Loader className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  // 2. 🛑 EL GUARDIA: Si ya terminó de cargar y NO hay usuario, te manda al Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Si todo está bien, muestra el Dashboard con el Sidebar
  return (
    <div className="flex h-screen bg-gray-950 text-white font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative">
        <div className="p-8 pb-24 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};