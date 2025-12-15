import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  ClipboardList, 
  Settings, 
  LogOut,
  Shield // 👈 El icono del poder
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const Sidebar = () => {
  const { logout, profile, toggleUserRole } = useAuthStore();

  const navItems = [
    { icon: LayoutDashboard, label: 'Panel Principal', to: '/app/dashboard' },
    { icon: Users, label: 'Pacientes', to: '/app/pacientes' },
    { icon: Calendar, label: 'Agenda', to: '/app/agenda' },
    { icon: ClipboardList, label: 'Biblioteca de Tests', to: '/app/tests' },
    { icon: Settings, label: 'Configuración', to: '/app/config' },
  ];

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-screen fixed left-0 top-0">
      {/* LOGO */}
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">
          MENTAL NEXUS
        </span>
      </div>

      {/* MENÚ DE NAVEGACIÓN */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <item.icon size={20} />
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* FOOTER DEL SIDEBAR */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        
        {/* 🛡️ BOTÓN GOD MODE (Solo visible si eres Admin Real) */}
        {profile?.isAdmin && (
          <button 
            onClick={toggleUserRole}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full transition-colors mb-2 border ${
              profile.role === 'admin' 
                ? 'bg-purple-900/40 text-purple-400 border-purple-500/30 hover:bg-purple-900/60' 
                : 'bg-green-900/40 text-green-400 border-green-500/30 hover:bg-green-900/60'
            }`}
          >
            <Shield size={20} />
            <span className="font-medium text-sm">
              {profile.role === 'admin' ? 'MODO: ADMIN' : 'MODO: PSICÓLOGO'}
            </span>
          </button>
        )}

        {/* BOTÓN CERRAR SESIÓN */}
        <button 
          onClick={() => logout()}
          className="flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg w-full transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};