import React, { useState } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';

// --- ICONOS LOCALES ---
const IconPlus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconCheck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const IconShield = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;
const IconFilter = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>;
const IconMenu = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;

interface Props {
  pacienteId: string;
  userUid: string;
  pacienteData: any;
}

export const ClinicHUD: React.FC<Props> = ({ pacienteId, userUid, pacienteData }) => {
  // ESTADOS DE CREACIÓN
  const [nuevoSintoma, setNuevoSintoma] = useState("");
  const [nuevaEstrategia, setNuevaEstrategia] = useState("");
  const [activeSintomaId, setActiveSintomaId] = useState<string | null>(null);

  // ESTADOS DE VISUALIZACIÓN
  const [showMenu, setShowMenu] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // --- ACTIONS ---

  const agregarSintoma = async () => {
    if (!nuevoSintoma.trim()) return;
    const newId = Date.now().toString();
    const payload = { 
        id: newId, 
        texto: nuevoSintoma.trim(),
        fecha: new Date().toISOString(),
        estado: 'activo'
    };
    
    const ref = doc(db, "users", userUid, "pacientes", pacienteId);
    await updateDoc(ref, { "cuadroClinico.sintomas": arrayUnion(payload) });
    setNuevoSintoma("");
    
    // Auto-seleccionar el nuevo
    setSelectedIds(prev => [...prev, newId]);
  };

  const agregarEstrategia = async (sintomaId: string) => {
    if (!nuevaEstrategia.trim()) return;
    const payload = { 
        id: Date.now().toString(), 
        texto: nuevaEstrategia.trim(),
        sintomaId: sintomaId
    };
    const ref = doc(db, "users", userUid, "pacientes", pacienteId);
    await updateDoc(ref, { "cuadroClinico.estrategias": arrayUnion(payload) });
    setNuevaEstrategia("");
  };

  const toggleEstadoSintoma = async (sintomaTarget: any) => {
      const listaActual = pacienteData?.cuadroClinico?.sintomas || [];
      const nuevaLista = listaActual.map((s:any) => {
          if (s.id === sintomaTarget.id) {
              return { ...s, estado: s.estado === 'activo' ? 'resuelto' : 'activo' };
          }
          return s;
      });
      const ref = doc(db, "users", userUid, "pacientes", pacienteId);
      await updateDoc(ref, { "cuadroClinico.sintomas": nuevaLista });
  };

  const toggleSelection = (id: string) => {
      if (selectedIds.includes(id)) {
          setSelectedIds(selectedIds.filter(sid => sid !== id));
      } else {
          setSelectedIds([...selectedIds, id]);
      }
  };

  // --- DATOS ---
  const todosLosSintomas = pacienteData?.cuadroClinico?.sintomas || [];
  const estrategias = pacienteData?.cuadroClinico?.estrategias || [];

  // FILTRO: Solo mostramos los que están en selectedIds
  const sintomasVisibles = todosLosSintomas.filter((s:any) => selectedIds.includes(s.id));

  return (
    <div style={{height: '100%', display:'flex', flexDirection:'column', paddingLeft: '20px', borderLeft: '1px solid rgba(148, 163, 184, 0.1)'}}>
        
        {/* HEADER: BOTÓN DE MENÚ DESPLEGABLE */}
        <div style={{marginBottom: '20px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                <h3 style={{margin:0, color:'#F8FAFC', fontSize:'1rem', fontFamily:'Rajdhani'}}>HUD CLÍNICO</h3>
                
                <button 
                    onClick={() => setShowMenu(!showMenu)}
                    style={{
                        background: showMenu ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                        color: showMenu ? 'black' : 'white',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        padding: '5px 10px',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '5px',
                        fontSize: '0.8rem', fontWeight: 'bold'
                    }}
                >
                    <IconMenu /> {showMenu ? 'CERRAR LISTA' : 'SELECCIONAR SÍNTOMAS'}
                </button>
            </div>

            {/* --- MENÚ DESPLEGABLE (EL SELECTOR) --- */}
            {showMenu && (
                <div style={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid var(--primary)',
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '20px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    animation: 'fadeIn 0.2s',
                    position: 'relative',
                    zIndex: 10
                }}>
                    <div style={{fontSize:'0.8rem', color:'#94A3B8', marginBottom:'10px', textTransform:'uppercase'}}>
                        Marca los temas para esta sesión:
                    </div>
                    
                    <div style={{maxHeight:'200px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'5px'}}>
                        {todosLosSintomas.length === 0 && <span style={{color:'gray', fontStyle:'italic'}}>Lista vacía. Agrega uno abajo.</span>}
                        
                        {todosLosSintomas.map((s:any) => {
                            const isSelected = selectedIds.includes(s.id);
                            const isResolved = s.estado === 'resuelto';
                            return (
                                <div 
                                    key={s.id} 
                                    onClick={() => toggleSelection(s.id)}
                                    style={{
                                        display:'flex', alignItems:'center', gap:'10px',
                                        padding:'8px', borderRadius:'6px',
                                        cursor:'pointer',
                                        background: isSelected ? 'rgba(34, 211, 238, 0.1)' : 'transparent',
                                        border: isSelected ? '1px solid #22d3ee' : '1px solid transparent'
                                    }}
                                >
                                    <div style={{
                                        width:'16px', height:'16px', 
                                        borderRadius:'4px', 
                                        border: '1px solid #94A3B8',
                                        background: isSelected ? '#22d3ee' : 'transparent',
                                        display:'flex', alignItems:'center', justifyContent:'center'
                                    }}>
                                        {isSelected && <IconCheck />}
                                    </div>
                                    <span style={{color: isResolved ? '#10B981' : '#E2E8F0', textDecoration: isResolved ? 'line-through' : 'none', fontSize:'0.9rem'}}>
                                        {s.texto}
                                    </span>
                                    {isResolved && <span style={{fontSize:'0.6rem', background:'#10B981', color:'black', padding:'2px 4px', borderRadius:'4px'}}>ALTA</span>}
                                </div>
                            )
                        })}
                    </div>

                    {/* INPUT PARA CREAR NUEVO (DENTRO DEL MENÚ) */}
                    <div style={{marginTop:'15px', paddingTop:'10px', borderTop:'1px solid rgba(255,255,255,0.1)', display:'flex', gap:'5px'}}>
                        <input 
                            type="text" 
                            placeholder="+ Crear nuevo síntoma..." 
                            value={nuevoSintoma}
                            onChange={e => setNuevoSintoma(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && agregarSintoma()}
                            style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white', padding:'6px', borderRadius:'4px', flex:1, fontSize:'0.8rem'}}
                        />
                        <button onClick={agregarSintoma} style={{background:'var(--secondary)', border:'none', borderRadius:'4px', cursor:'pointer', color:'black', padding:'0 10px'}}><IconPlus/></button>
                    </div>
                </div>
            )}
        </div>

        {/* --- ÁREA DE TRABAJO (SOLO VISIBLES) --- */}
        <div style={{flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:'15px'}}>
            {sintomasVisibles.length === 0 && !showMenu && (
                <div style={{textAlign:'center', padding:'40px 20px', color:'#64748b', border:'1px dashed rgba(255,255,255,0.1)', borderRadius:'12px'}}>
                    <IconFilter />
                    <p style={{fontSize:'0.9rem'}}>No hay síntomas seleccionados.</p>
                    <button onClick={() => setShowMenu(true)} style={{background:'transparent', border:'1px solid var(--primary)', color:'var(--primary)', padding:'5px 10px', borderRadius:'4px', cursor:'pointer', fontSize:'0.8rem'}}>ABRIR MENÚ</button>
                </div>
            )}

            {sintomasVisibles.map((s:any) => {
                const isResolved = s.estado === 'resuelto';
                const misEstrategias = estrategias.filter((e:any) => e.sintomaId === s.id);

                return (
                <div key={s.id} style={{
                    background: isResolved ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', 
                    border: isResolved ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '15px',
                    opacity: isResolved ? 0.8 : 1,
                    animation: 'slideInRight 0.3s'
                }}>
                    {/* CABECERA */}
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px'}}>
                        <div style={{fontWeight:'bold', color: isResolved ? '#10B981' : '#EF4444', fontSize:'1rem'}}>
                            {s.texto}
                        </div>
                        <button 
                            onClick={() => toggleEstadoSintoma(s)}
                            title={isResolved ? "Reactivar" : "Dar de alta"}
                            style={{
                                background: isResolved ? '#10B981' : 'transparent',
                                border: isResolved ? 'none' : '1px solid #EF4444',
                                color: isResolved ? 'black' : '#EF4444',
                                borderRadius: '50%', width:'24px', height:'24px', 
                                display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'
                            }}
                        >
                            {isResolved ? <IconCheck /> : <div style={{width:'8px', height:'8px', background:'#EF4444', borderRadius:'50%'}}></div>}
                        </button>
                    </div>

                    <div style={{fontSize:'0.7rem', color:'#94A3B8', marginBottom:'15px'}}>
                        Detectado: {new Date(s.fecha).toLocaleDateString()}
                    </div>

                    {/* ESTRATEGIAS */}
                    <div style={{borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:'10px'}}>
                        {misEstrategias.length > 0 ? (
                            <div style={{marginBottom:'10px'}}>
                                {misEstrategias.map((e:any) => (
                                    <div key={e.id} style={{fontSize:'0.9rem', color:'#E2E8F0', marginBottom:'8px', display:'flex', alignItems:'flex-start', gap:'8px'}}>
                                        <div style={{color:'#94A3B8', marginTop:'2px'}}><IconShield /></div>
                                        <span>{e.texto}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{fontSize:'0.8rem', color:'#64748b', fontStyle:'italic', marginBottom:'10px'}}>Sin estrategias.</div>
                        )}

                        {/* Input Estrategia */}
                        {!isResolved && (
                            <div style={{display:'flex', gap:'5px', marginTop:'10px'}}>
                                <input 
                                    type="text"
                                    placeholder="Añadir estrategia..."
                                    value={activeSintomaId === s.id ? nuevaEstrategia : ""}
                                    onFocus={() => setActiveSintomaId(s.id)}
                                    onChange={e => setNuevaEstrategia(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && agregarEstrategia(s.id)}
                                    style={{
                                        background:'rgba(0,0,0,0.2)', border:'1px dashed rgba(148, 163, 184, 0.4)',
                                        color:'#E2E8F0', fontSize:'0.8rem', width:'100%', outline:'none',
                                        padding: '5px 10px', borderRadius:'4px'
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
                );
            })}
        </div>
    </div>
  );
};