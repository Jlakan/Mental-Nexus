import React from 'react';
import { Home, Target, BarChart2, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-black text-white pb-24 font-sans">
      {/* Top Bar Minimalista */}
      <div className="px-6 py-4 flex justify-between items-center bg-gradient-to-b from-black to-transparent sticky top-0 z-10">
        <span className="text-lg font-bold tracking-widest text-emerald-500">NEXUS // PLAYER</span>
        <button onClick={logout} className="p-2 bg-zinc-900 rounded-full text-zinc-400">
          <LogOut size={16} />
        </button>
      </div>

      {/* Main Content */}
      <main className="px-4">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-zinc-900/90 backdrop-blur-lg border-t border-zinc-800 pb-safe pt-2 px-6">
        <div className="flex justify-between items-center h-16">
          <NavItem icon={<Home size={24} />} label="Base" active />
          <NavItem icon={<Target size={24} />} label="Misiones" />
          <div className="w-px h-8 bg-zinc-800"></div> {/* Separator */}
          <NavItem icon={<BarChart2 size={24} />} label="Stats" />
          <NavItem icon={<User size={24} />} label="Perfil" />
        </div>
      </nav>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={`flex flex-col items-center space-y-1 ${active ? 'text-emerald-400' : 'text-zinc-500'}`}>
      <div className={`p-1 rounded-xl transition-all ${active ? 'bg-emerald-400/10' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </button>
  );
}