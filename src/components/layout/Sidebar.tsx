import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  BookOpen, 
  Settings, 
  LogOut,
  Hexagon,
  Shield
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const Sidebar = () => {
  // 👇 AQUÍ ESTABA EL ERROR: Cambiamos 'profile' por 'user'
  const { user, logout, toggleUserRole } = useAuthStore();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Panel Principal', path: '/app/dashboard' },
    { icon: Users, label: 'Pacientes', path: '/app/pacientes' },
    { icon: Calendar, label: 'Agenda', path: '/app/agenda' },
    { icon: BookOpen, label: 'Biblioteca', path: '/app/tests' },
    { icon: Settings, label: 'Configuración', path: '/app/config' },
  ];

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* HEADER */}
      <div className="p-6 flex items-center gap-3 border-b border-gray-800">
        <div className="bg-blue-600/20 p-2 rounded-lg">
          <Hexagon className="text-blue-500" size={24} />
        </div>
        <div>
          <h1 className="font-bold text-white text-lg tracking-tight">MENTAL NEXUS</h1>
          <span className="text-xs text-blue-400 font-medium">Professional Suite</span>
        </div>
      </div>

      {/* PERFIL DEL USUARIO */}
      <div className="p-6 pb-2">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <img 
              src={user?.photoURL || "https://ui-avatars.com/api/?name=User&background=random"} 
              alt="Profile" 
              className="w-10 h-10 rounded-full border-2 border-blue-500"
            />
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user?.displayName}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role || 'Invitado'}</p>
            </div>
          </div>
          
          {/* GOD MODE TOGGLE */}
          <button 
            onClick={toggleUserRole}
            className="w-full flex items-center justify-center gap-2 text-[10px] bg-gray-700 hover:bg-gray-600 text-gray-300 py-1 px-2 rounded transition-colors"
          >
            <Shield size={10} />
            <span>Switch Role (Dev)</span>
          </button>
        </div>
      </div>

      {/* NAVEGACIÓN */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
              ${isActive 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }
            `}
          >
            <item.icon size={20} />
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* FOOTER */}
      <div className="p-4 border-t border-gray-800">
        <button 
          onClick={logout}
          className="flex items-center gap-3 text-red-400 hover:bg-red-900/20 hover:text-red-300 w-full px-4 py-3 rounded-xl transition-colors text-sm font-bold"
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};