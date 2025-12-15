import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { ClinicHUD } from './ClinicHUD';

// --- ICONOS LOCALES ---
const IconHistory = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"></path></svg>;
const IconLeft = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>;
const IconRight = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>;
const IconClose = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

interface Props {
  pacienteData: any;
  userUid: string;
  notas: any[];
  onVerTest: (nota: any) => void; // Función para abrir el visor desde el historial
}

export const BitacoraClinica: React.FC<Props> = ({ pacienteData, userUid, notas, onVerTest }) => {
  // ESTADOS DE LA NOTA
  const [nuevaNota, setNuevaNota] = useState("");
  const [fechaNota, setFechaNota] = useState(() => {
      const d = new Date();
      return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  });
  
  // ESTADOS DEL HISTORIAL (Modal y Paginación)
  const [showModal, setShowModal] = useState(false);
  const [indiceNota, setIndiceNota] = useState(0);

  const guardarNota = async () => {
      if(!nuevaNota.trim()) return;
      const [year, month, day] = fechaNota.split('-').map(Number);
      const fechaSegura = new Date(year, month - 1, day, 12, 0, 0);

      try {
        await addDoc(collection(db, "users", userUid, "pacientes", pacienteData.id, "notas_clinicas"), {
            contenido: nuevaNota,
            createdAt: fechaSegura,
            autor: userUid,
            tipo: 'nota_evolucion'
        });
        setNuevaNota("");
        setIndiceNota(0); // Reiniciar índice
      } catch (e) {
        console.error("Error al guardar nota:", e);
        alert("No se pudo guardar la nota.");
      }
  };

  // Helper para mostrar fecha legible
  const formatFecha = (seconds: number) => {
      if (!seconds) return "--/--/----";
      return new Date(seconds * 1000).toLocaleDateString('es-ES', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });
  };

  return (
    <div style={{display: 'flex', gap: '30px', animation: 'fadeIn 0.3s', minHeight: '500px'}}>
        
        {/* COLUMNA IZQUIERDA (65%) - EDITOR */}
        <div style={{flex: 65}}>
            
            {/* BARRA DE HERRAMIENTAS SUPERIOR */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                <h3 style={{margin:0, color:'#F8FAFC', fontSize:'1.5rem', fontFamily:'Rajdhani'}}>BITÁCORA</h3>
                <button 
                    onClick={() => setShowModal(true)}
                    style={{
                        background: 'rgba(34, 211, 238, 0.1)', 
                        border: '1px solid #22d3ee', 
                        color: '#22d3ee', 
                        padding: '8px 15px', 
                        borderRadius: '6px', 
                        cursor: 'pointer', 
                        display:'flex', 
                        alignItems:'center', 
                        gap:'8px',
                        fontWeight: 'bold',
                        fontSize: '0.8rem'
                    }}
                >
                    <IconHistory /> VER HISTORIAL ({notas.length})
                </button>
            </div>

            {/* AREA DE ESCRITURA */}
            <div style={{background: 'rgba(30, 41, 59, 0.4)', padding: '25px', borderRadius: '16px', border: '1px solid rgba(148, 163, 184, 0.1)'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                    <h4 style={{margin:0, color:'var(--secondary)', fontSize:'1.1rem', letterSpacing:'1px'}}>NUEVA EVOLUCIÓN</h4>
                    <input type="date" value={fechaNota} onChange={(e) => setFechaNota(e.target.value)} style={{background:'rgba(15,23,42,0.8)', border:'1px solid #334155', color:'white', padding:'8px 15px', borderRadius:'6px', fontFamily:'Rajdhani', cursor:'pointer'}} />
                </div>
                <textarea 
                    value={nuevaNota} 
                    onChange={e => setNuevaNota(e.target.value)} 
                    placeholder="Escribe la evolución clínica, observaciones o bitácora de sesión..." 
                    className="terminal-input"
                    style={{height:'300px', marginBottom:'20px', fontSize:'1rem', lineHeight:'1.6'}} 
                />
                <div style={{textAlign:'right'}}>
                    <button onClick={guardarNota} className="btn-neon">GUARDAR EN EXPEDIENTE</button>
                </div>
            </div>
        </div>

        {/* COLUMNA DERECHA (35%) - HUD CLÍNICO (Sticky) */}
        <div style={{flex: 35, position: 'sticky', top: '20px', height: 'fit-content'}}>
            <ClinicHUD 
                pacienteId={pacienteData.id} 
                userUid={userUid} 
                pacienteData={pacienteData}
            />
        </div>

        {/* --- MODAL DE HISTORIAL --- */}
        {showModal && (
            <div className="modal-overlay" style={{animation: 'fadeIn 0.2s'}}>
                <div className="modal-content" style={{maxWidth: '700px', width:'90%', maxHeight:'85vh', display:'flex', flexDirection:'column'}}>
                    
                    {/* Header del Modal */}
                    <div className="modal-header" style={{borderBottom:'1px solid rgba(255,255,255,0.1)', paddingBottom:'15px', marginBottom:'20px'}}>
                        <div>
                            <h2 style={{margin:0, color:'#F8FAFC', fontFamily:'Rajdhani'}}>HISTORIAL CLÍNICO</h2>
                            <span style={{color:'#94A3B8', fontSize:'0.9rem'}}>Registro {notas.length > 0 ? indiceNota + 1 : 0} de {notas.length}</span>
                        </div>
                        <button onClick={() => setShowModal(false)} style={{background:'none', border:'none', color:'white', cursor:'pointer'}}><IconClose/></button>
                    </div>

                    {/* Contenido del Modal */}
                    {notas.length > 0 ? (
                        <div style={{flex:1, overflowY:'auto'}}>
                            {/* Navegación */}
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', background:'rgba(0,0,0,0.3)', padding:'10px', borderRadius:'8px'}}>
                                <button onClick={() => setIndiceNota(prev => Math.min(prev + 1, notas.length - 1))} disabled={indiceNota >= notas.length - 1} style={{background:'none', border:'none', color:'white', opacity: indiceNota >= notas.length-1?0.3:1, cursor:'pointer'}}><IconLeft/></button>
                                <div style={{textAlign:'center'}}>
                                    <div style={{fontSize:'1.2rem', color:'var(--secondary)', fontWeight:'bold'}}>{formatFecha(notas[indiceNota].createdAt?.seconds)}</div>
                                    <div style={{fontSize:'0.8rem', color:'#94A3B8', textTransform:'uppercase', letterSpacing:'1px'}}>{notas[indiceNota].tipo?.replace('evaluacion_', 'TEST: ')?.replace('_', ' ') || 'NOTA EVOLUCIÓN'}</div>
                                </div>
                                <button onClick={() => setIndiceNota(prev => Math.max(prev - 1, 0))} disabled={indiceNota === 0} style={{background:'none', border:'none', color:'white', opacity: indiceNota===0?0.3:1, cursor:'pointer'}}><IconRight/></button>
                            </div>

                            {/* Texto de la Nota */}
                            <div style={{
                                whiteSpace:'pre-wrap', 
                                color:'#E2E8F0', 
                                lineHeight:'1.8', 
                                fontSize:'1rem', 
                                background:'rgba(30, 41, 59, 0.4)', 
                                padding:'25px', 
                                borderRadius:'12px', 
                                border: notas[indiceNota].tipo?.startsWith('evaluacion') ? '1px solid var(--secondary)' : '1px solid rgba(255,255,255,0.1)'
                            }}>
                                {notas[indiceNota].contenido}
                            </div>
                            
                            {/* BOTÓN PARA VER TEST (Si es evaluación) */}
                            {notas[indiceNota].tipo?.startsWith('evaluacion') && (
                                <div style={{marginTop:'20px', textAlign:'right', borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:'15px'}}>
                                    <button 
                                        onClick={() => {
                                            setShowModal(false); // Cerramos el historial para ver el visor grande
                                            onVerTest(notas[indiceNota]);
                                        }}
                                        style={{
                                            background: 'rgba(34, 211, 238, 0.1)',
                                            border: '1px solid #22d3ee',
                                            color: '#22d3ee',
                                            padding: '10px 20px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontFamily: 'Rajdhani',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            marginLeft: 'auto'
                                        }}
                                    >
                                        👁️ VER HOJA DE RESPUESTAS / GRÁFICAS
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{textAlign:'center', padding:'50px', color:'gray'}}>
                            No hay registros en el historial.
                        </div>
                    )}
                </div>
            </div>
        )}

    </div>
  );
};