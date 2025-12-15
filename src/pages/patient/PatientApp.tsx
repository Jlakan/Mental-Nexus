import MobileLayout from '../../components/layout/MobileLayout';
import { CheckCircle2, Circle } from 'lucide-react';

export default function PatientApp() {
  return (
    <MobileLayout>
      {/* HUD HEADER */}
      <div className="mb-8 pt-4">
        <div className="bg-gradient-to-r from-emerald-900/50 to-zinc-900 border border-emerald-500/20 p-6 rounded-3xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-end mb-2">
              <span className="text-emerald-400 font-bold text-sm tracking-wider">NIVEL 1</span>
              <span className="text-white font-mono text-xl">350 / 1000 XP</span>
            </div>
            {/* XP Bar */}
            <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[35%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            </div>
            <p className="text-xs text-zinc-400 mt-3">¡Sigue así! Estás a 3 misiones de subir de nivel.</p>
          </div>
          
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        </div>
      </div>

      {/* DAILY MISSION */}
      <h3 className="text-lg font-bold text-white mb-4 px-2">Misión Prioritaria</h3>
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center space-x-4 mb-8 active:scale-95 transition-transform">
        <button className="text-zinc-600 hover:text-emerald-500 transition-colors">
          <Circle size={28} />
        </button>
        <div className="flex-1">
          <h4 className="font-bold text-white text-lg">Registro Emocional</h4>
          <p className="text-zinc-500 text-sm">Registra cómo te sientes hoy antes de dormir.</p>
        </div>
        <div className="text-emerald-500 font-mono text-sm font-bold bg-emerald-500/10 px-3 py-1 rounded-lg">
          +50 XP
        </div>
      </div>

      {/* MINI STATS */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-center">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Racha</p>
          <p className="text-3xl font-bold text-white">3 <span className="text-sm text-zinc-600">días</span></p>
        </div>
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 text-center">
          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Medallas</p>
          <p className="text-3xl font-bold text-yellow-500">1</p>
        </div>
      </div>
    </MobileLayout>
  );
}