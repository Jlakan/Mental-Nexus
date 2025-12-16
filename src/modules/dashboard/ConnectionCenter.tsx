import React from 'react';
import { Share2, Copy, Users, CheckCircle2, XCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore'; // 👈 Asegúrate de importar esto
import { invitationService, Invitation } from '../../services/invitationService';

export const ConnectionCenter = () => {
  // 👇 AQUÍ EL CAMBIO: 'user' en lugar de 'profile'
  const { user } = useAuthStore();
  const [invitations, setInvitations] = React.useState<Invitation[]>([]);
  const [copied, setCopied] = React.useState(false);

  // Cargar invitaciones al iniciar
  React.useEffect(() => {
    if (user?.uid) {
      loadInvitations();
    }
  }, [user]);

  const loadInvitations = async () => {
    if (!user?.uid) return;
    const data = await invitationService.getPendingInvitations(user.uid);
    setInvitations(data);
  };

  const copyCode = () => {
    // 👇 Usamos user.uniqueCode
    if (user?.uniqueCode) {
      navigator.clipboard.writeText(user.uniqueCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAccept = async (inv: Invitation) => {
    await invitationService.acceptInvitation(inv);
    loadInvitations(); // Recargar lista
  };

  const handleReject = async (id: string) => {
    await invitationService.rejectInvitation(id);
    loadInvitations(); // Recargar lista
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-8">Centro de Conexión</h1>

      {/* TARJETA DEL CÓDIGO */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-8 border border-blue-700 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Tu Código de Vinculación</h2>
            <p className="text-blue-200">Comparte este código con tus pacientes para que se unan a tu red.</p>
          </div>

          <div className="bg-black/30 p-2 pl-6 rounded-xl flex items-center gap-4 border border-white/10 backdrop-blur-sm">
            {/* 👇 Usamos user.uniqueCode */}
            <span className="text-3xl font-mono font-bold text-white tracking-widest">
              {user?.uniqueCode || 'GENERANDO...'}
            </span>
            <button 
              onClick={copyCode}
              className="bg-blue-500 hover:bg-blue-400 text-white p-3 rounded-lg transition-all active:scale-95"
            >
              {copied ? <CheckCircle2 size={24} /> : <Copy size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* LISTA DE SOLICITUDES */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gray-800 p-2 rounded-lg">
            <Users className="text-gray-400" size={24} />
          </div>
          <h3 className="text-xl font-bold text-white">Solicitudes Entrantes</h3>
          {invitations.length > 0 && (
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              {invitations.length}
            </span>
          )}
        </div>

        {invitations.length === 0 ? (
          <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-800 rounded-xl">
            <Share2 className="mx-auto mb-3 opacity-50" size={48} />
            <p>No tienes solicitudes pendientes.</p>
            <p className="text-sm">Comparte tu código para recibir pacientes.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map((inv) => (
              <div key={inv.id} className="bg-gray-800/50 p-4 rounded-xl flex justify-between items-center border border-gray-700">
                <div>
                  <p className="text-white font-bold">{inv.patientEmail}</p>
                  <p className="text-xs text-gray-400">Solicitado: {inv.requestDate.toDate().toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleReject(inv.id)}
                    className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Rechazar"
                  >
                    <XCircle size={20} />
                  </button>
                  <button 
                    onClick={() => handleAccept(inv)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-blue-900/20"
                  >
                    <CheckCircle2 size={18} />
                    Aceptar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};