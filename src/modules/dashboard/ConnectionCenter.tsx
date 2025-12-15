import React, { useEffect, useState } from 'react';
import { 
  Share2, 
  Copy, 
  QrCode, 
  Users, 
  CheckCircle2, 
  XCircle, 
  RefreshCw 
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { invitationService, Invitation } from '../../services/invitationService';

export const ConnectionCenter = () => {
  const { profile } = useAuthStore();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Cargar invitaciones
  const loadInvites = async () => {
    if (profile?.uid) {
      setLoading(true);
      const data = await invitationService.getPendingInvitations(profile.uid);
      setInvitations(data);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvites();
  }, [profile]);

  // Copiar código al portapapeles
  const copyToClipboard = () => {
    if (profile?.uniqueCode) {
      navigator.clipboard.writeText(profile.uniqueCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAccept = async (inv: Invitation) => {
    await invitationService.acceptInvitation(inv);
    loadInvites(); // Recargar lista
  };

  const handleReject = async (id: string) => {
    await invitationService.rejectInvitation(id);
    loadInvites();
  };

  const handleMockInvite = async () => {
    if (profile) {
      await invitationService.createMockInvitation(profile.uid, profile.organizationId);
      loadInvites();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Share2 className="text-blue-500" size={32} />
          Centro de Conexión
        </h1>
        <p className="text-gray-400 mt-2">
          Gestiona los enlaces con tus pacientes y expande tu red.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* TARJETA DE CÓDIGO (TU ID DE UNICORNIO) */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full transition-transform group-hover:scale-110" />
          
          <h2 className="text-xl font-bold text-gray-300 mb-6">Tu Código de Vinculación</h2>
          
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="bg-black/50 p-6 rounded-xl border border-blue-500/30 w-full text-center">
              <span className="text-4xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 tracking-widest">
                {profile?.uniqueCode || 'GENERANDO...'}
              </span>
            </div>

            <div className="flex gap-3 w-full">
              <button 
                onClick={copyToClipboard}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold transition-all"
              >
                {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                {copied ? '¡Copiado!' : 'Copiar Código'}
              </button>
              <button className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300">
                <QrCode size={20} />
              </button>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mt-6 text-center">
            Comparte este código con tus pacientes. Al ingresarlo en su App, aparecerán en tu lista de espera.
          </p>
        </div>

        {/* BANDEJA DE SOLICITUDES */}
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users size={20} className="text-purple-400" />
              Solicitudes Pendientes
            </h3>
            <button onClick={loadInvites} disabled={loading} className="text-gray-500 hover:text-white transition-colors">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {invitations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center space-y-3 opacity-50">
              <Users size={40} className="text-gray-600" />
              <p className="text-gray-400 text-sm">No hay solicitudes nuevas.</p>
              
              {/* BOTÓN DEBUG: SOLO PARA DESARROLLO */}
              <button onClick={handleMockInvite} className="text-xs text-blue-500 hover:underline">
                [DEBUG] Simular Solicitud Entrante
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.map((inv) => (
                <div key={inv.id} className="bg-gray-800 p-4 rounded-xl flex items-center justify-between border border-gray-700 animate-slide-in">
                  <div>
                    <p className="font-bold text-white text-sm">{inv.patientEmail}</p>
                    <p className="text-xs text-gray-500">Solicitud recibida hace un momento</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleReject(inv.id)}
                      className="p-2 hover:bg-red-900/30 text-gray-500 hover:text-red-400 rounded-lg transition-colors"
                      title="Rechazar"
                    >
                      <XCircle size={20} />
                    </button>
                    <button 
                      onClick={() => handleAccept(inv)}
                      className="p-2 bg-green-600 hover:bg-green-500 text-white rounded-lg shadow-lg shadow-green-900/20 transition-all"
                      title="Aceptar y Vincular"
                    >
                      <CheckCircle2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};