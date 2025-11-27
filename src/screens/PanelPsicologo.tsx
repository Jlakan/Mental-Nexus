import { useState, useEffect } from 'react';
import { doc, updateDoc, addDoc, deleteDoc, collection, query, where, onSnapshot, increment } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { STATS_CONFIG, StatTipo } from '../game/GameAssets';

// ... (Iconos SVG igual que antes) ...
const IconEdit = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const IconMedal = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>;
const IconRestore = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>;
const IconTrash = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

export function PanelPsicologo({ userData, userUid }: any) {
  const [pacientes, setPacientes] = useState<any[]>([]); 
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);
  const [habitosPaciente, setHabitosPaciente] = useState<any[]>([]);
  
  const [tituloHabito, setTituloHabito] = useState("");
  const [frecuenciaMeta, setFrecuenciaMeta] = useState(7);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recompensas, setRecompensas] = useState<string[]>([]);
  const [selectedResource, setSelectedResource] = useState<{ type: StatTipo, value: number } | null>(null);

  useEffect(() => {
    const colRef = collection(db, "users", userUid, "pacientes");
    const unsubscribe = onSnapshot(colRef, (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPacientes(lista);
    });
    return () => unsubscribe();
  }, [userUid]);

  useEffect(() => {
    if (!pacienteSeleccionado) { setHabitosPaciente([]); return; }
    const q = query(collection(db, "users", pacienteSeleccionado.id, "habitos"));
    const unsubscribe = onSnapshot(q, (snap) => setHabitosPaciente(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsubscribe();
  }, [pacienteSeleccionado]);

  const toggleRecompensa = (tipo: string) => {
    if (recompensas.includes(tipo)) setRecompensas(recompensas.filter(r => r !== tipo));
    else setRecompensas([...recompensas, tipo]);
  };

  const registrarAsistencia = async () => {
      if(!confirm(`¿Confirmar asistencia de ${pacienteSeleccionado.displayName}?\n\n+1 NEXO otorgado.`)) return;
      await updateDoc(doc(db, "users", userUid, "pacientes", pacienteSeleccionado.id), { nexo: increment(1), xp: increment(500) });
  };

  const guardarHabito = async () => {
    if (!tituloHabito || !pacienteSeleccionado) return;
    const datos = { titulo: tituloHabito, frecuenciaMeta: frecuenciaMeta, recompensas: recompensas.length > 0 ? recompensas : ['xp'] };
    const colRef = collection(db, "users", pacienteSeleccionado.id, "habitos");
    try {
        if (editingId) await updateDoc(doc(colRef, editingId), datos);
        else await addDoc(colRef, { ...datos, asignadoPor: userUid, estado: 'activo', createdAt: new Date(), registro: { L: false, M: false, X: false, J: false, V: false, S: false, D: false } });
        setTituloHabito(""); setFrecuenciaMeta(7); setRecompensas([]); setEditingId(null);
    } catch (e) { console.error(e); }
  };

  const cargarParaEditar = (habito: any) => {
      setTituloHabito(habito.titulo); setFrecuenciaMeta(habito.frecuenciaMeta || 7); setRecompensas(habito.recompensas || []); setEditingId(habito.id);
  };
  const cancelarEdicion = () => { setTituloHabito(""); setFrecuenciaMeta(7); setRecompensas([]); setEditingId(null); };
  
  const autorizarPaciente = async (id: string, estado: boolean) => await updateDoc(doc(db, "users", userUid, "pacientes", id), { isAuthorized: !estado });
  const archivarHabito = async (id: string, estadoActual: string) => {
      if(!pacienteSeleccionado) return;
      const nuevo = estadoActual === 'archivado' ? 'activo' : 'archivado';
      if(confirm(nuevo === 'archivado' ? "Se moverá al historial." : "Se reactivará.")) await updateDoc(doc(db, "users", pacienteSeleccionado.id, "habitos", id), { estado: nuevo });
  };
  const eliminarHabito = async (id: string) => {
    if(!pacienteSeleccionado) return;
    if(confirm("⚠️ ¿ELIMINAR TOTALMENTE?")) await deleteDoc(doc(db, "users", pacienteSeleccionado.id, "habitos", id));
  };
  const contarDias = (reg: any) => Object.values(reg).filter(v => v === true).length;

  // Monitor de Balance (Actualizado con Vinculación)
  const analizarBalance = () => {
      if (habitosPaciente.length === 0) return null;
      const activos = habitosPaciente.filter(h => h.estado !== 'archivado');
      if (activos.length === 0) return null;
      const stats = { vitalidad: 0, sabiduria: 0, vinculacion: 0 };
      activos.forEach(h => {
          if (h.recompensas?.includes('vitalidad')) stats.vitalidad++;
          if (h.recompensas?.includes('sabiduria')) stats.sabiduria++;
          if (h.recompensas?.includes('vinculacion')) stats.vinculacion++;
      });
      const faltantes = [];
      if (stats.vitalidad === 0) faltantes.push("INTEGRIDAD");
      if (stats.sabiduria === 0) faltantes.push("I+D");
      if (stats.vinculacion === 0) faltantes.push("VINCULACIÓN");
      if (faltantes.length > 0) return <div style={{background:'rgba(245,158,11,0.1)', border:'1px solid #F59E0B', color:'#F59E0B', padding:'15px', borderRadius:'12px', marginBottom:'20px', fontSize:'1rem'}}>⚠️ <strong>Sugerencia de Balance:</strong> Faltan actividades de <b>{faltantes.join(", ")}</b>.</div>;
      return <div style={{background:'rgba(16,185,129,0.1)', border:'1px solid #10B981', color:'#10B981', padding:'15px', borderRadius:'12px', marginBottom:'20px', fontSize:'1rem'}}>✅ <strong>Plan Estratégico Balanceado.</strong></div>;
  };

  return (
    <div style={{textAlign: 'left'}}>
      
      {/* MODAL */}
      {selectedResource && (
          <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', zIndex:9999, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(15px)', display:'flex', justifyContent:'center', alignItems:'center', padding:'20px'}} onClick={() => setSelectedResource(null)}>
              <div style={{background: 'var(--bg-card)', border: 'var(--glass-border)', borderRadius: '20px', padding: '40px', textAlign: 'center', maxWidth: '600px', width:'100%', boxShadow: '0 0 80px rgba(6, 182, 212, 0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center'}} onClick={e => e.stopPropagation()}>
                  <h2 style={{color: selectedResource.type === 'gold' ? '#F59E0B' : (selectedResource.type === 'nexo' ? '#8B5CF6' : 'white'), fontFamily: 'Rajdhani', textTransform:'uppercase', fontSize:'2.5rem', marginBottom:'30px'}}>{STATS_CONFIG[selectedResource.type].label}</h2>
                  <img src={STATS_CONFIG[selectedResource.type].icon} style={{width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '40vh', marginBottom: '30px', filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.1))'}} />
                  <div style={{fontSize: '4rem', fontWeight: 'bold', color: 'white', marginBottom: '10px', lineHeight: 1}}>{selectedResource.value}</div>
                  <p style={{color: 'var(--text-muted)', fontSize: '1.2rem', lineHeight: '1.6', maxWidth: '80%'}}>{STATS_CONFIG[selectedResource.type].desc}</p>
                  <button onClick={() => setSelectedResource(null)} className="btn-primary" style={{marginTop: '40px', width: '200px', fontSize: '1.1rem'}}>ENTENDIDO</button>
              </div>
          </div>
      )}

      <div style={{background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', marginBottom: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', border: 'var(--glass-border)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
            <img src="/psicologo.png" style={{width:'50px', borderRadius:'50%', border:'2px solid var(--primary)'}} />
            <div><h3 style={{margin:0, color: 'var(--primary)', fontSize:'1.5rem'}}>PANEL DE CONTROL</h3><p style={{margin:0, fontSize:'0.9rem', color:'var(--text-muted)'}}>Código: <strong style={{color:'white'}}>{userData.codigoVinculacion}</strong></p></div>
        </div>
      </div>

      <div style={{display: 'flex', gap: '30px', flexWrap: 'wrap'}}>
        <div style={{flex: 1, minWidth: '300px'}}>
          <h4 style={{textTransform:'uppercase', fontSize:'0.8rem', color:'var(--secondary)', letterSpacing:'2px', marginBottom:'15px'}}>Agentes</h4>
          <div style={{display: 'grid', gap: '10px'}}>
            {pacientes.map(p => (
              <div key={p.id} onClick={() => p.isAuthorized && setPacienteSeleccionado(p)} style={{background: pacienteSeleccionado?.id === p.id ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255,255,255,0.03)', border: pacienteSeleccionado?.id === p.id ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px', transition: 'all 0.2s', cursor: p.isAuthorized ? 'pointer' : 'default'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div><div style={{fontWeight: 'bold', color: 'white', fontSize:'1.1rem'}}>{p.displayName}</div><div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{p.email}</div></div>
                    <button onClick={(e) => { e.stopPropagation(); autorizarPaciente(p.id, p.isAuthorized); }} style={{padding: '6px 12px', borderRadius: '8px', fontSize: '0.7rem', cursor:'pointer', fontWeight: 'bold', background: p.isAuthorized ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: p.isAuthorized ? 'var(--secondary)' : '#EF4444', border: p.isAuthorized ? '1px solid var(--secondary)' : '1px solid #EF4444'}}>{p.isAuthorized ? "ACTIVO" : "APROBAR"}</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{flex: 2, minWidth: '320px'}}>
          {pacienteSeleccionado ? (
            <div style={{animation: 'fadeIn 0.5s'}}>
              
              {/* BOTÓN DE ASISTENCIA */}
              <div style={{display:'flex', justifyContent:'flex-end', marginBottom:'15px'}}>
                  <button onClick={registrarAsistencia} style={{background: 'rgba(139, 92, 246, 0.2)', border: '1px solid #8B5CF6', color: '#8B5CF6', padding:'10px 20px', borderRadius:'12px', cursor:'pointer', fontWeight:'bold', display:'flex', alignItems:'center', gap:'10px'}}>
                    <img src={STATS_CONFIG.nexo.icon} width="24"/> REGISTRAR ASISTENCIA (+1 NEXO)
                  </button>
              </div>

              {/* FICHA (Ahora clickeable) */}
              <div style={{background: 'linear-gradient(90deg, rgba(15,23,42,0.8) 0%, rgba(30,41,59,0.8) 100%)', padding: '30px', borderRadius: '16px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-around', alignItems: 'center'}}>
                  <div style={{textAlign:'center'}}><div style={{fontSize:'3rem', fontWeight:'bold', color:'white', lineHeight: 1}}>{pacienteSeleccionado.nivel || 1}</div><div style={{fontSize:'0.8rem', color:'var(--text-muted)', letterSpacing: '2px'}}>NIVEL</div></div>
                  <div onClick={() => setSelectedResource({ type: 'gold', value: pacienteSeleccionado.gold || 0 })} style={{cursor:'pointer'}}><img src={STATS_CONFIG.gold.icon} style={{width: '100px', height: '100px', objectFit:'contain'}}/><div style={{textAlign:'center', fontWeight:'bold', color:'#F59E0B', fontSize:'1.5rem'}}>{pacienteSeleccionado.gold || 0}</div></div>
                  <div style={{display:'flex', gap:'30px'}}>
                      <div onClick={() => setSelectedResource({ type: 'vitalidad', value: pacienteSeleccionado.stats?.vitalidad || 0 })} style={{cursor:'pointer'}}><img src={STATS_CONFIG.vitalidad.icon} style={{width: '80px', height: '80px', objectFit:'contain'}}/></div>
                      <div onClick={() => setSelectedResource({ type: 'sabiduria', value: pacienteSeleccionado.stats?.sabiduria || 0 })} style={{cursor:'pointer'}}><img src={STATS_CONFIG.sabiduria.icon} style={{width: '80px', height: '80px', objectFit:'contain'}}/></div>
                      <div onClick={() => setSelectedResource({ type: 'vinculacion', value: pacienteSeleccionado.stats?.vinculacion || 0 })} style={{cursor:'pointer'}}><img src={STATS_CONFIG.vinculacion.icon} style={{width: '80px', height: '80px', objectFit:'contain'}}/></div>
                  </div>
              </div>

              {analizarBalance()}

              {/* FORMULARIO */}
              <div style={{background: 'var(--bg-card)', padding: '25px', borderRadius: '16px', marginBottom: '20px', border: editingId ? '1px solid var(--primary)' : 'var(--glass-border)', boxShadow: '0 4px 30px rgba(0,0,0,0.3)'}}>
                <h4 style={{color: 'white', marginTop:0}}>{editingId ? "✏️ EDITAR PROTOCOLO" : "NUEVO PROTOCOLO"}</h4>
                <div style={{marginBottom: '15px'}}><input type="text" value={tituloHabito} onChange={(e) => setTituloHabito(e.target.value)} placeholder="Descripción..." style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white'}} /></div>
                <div style={{display:'flex', gap:'15px', marginBottom:'20px'}}>
                    <button onClick={() => toggleRecompensa('vitalidad')} style={{background: recompensas.includes('vitalidad') ? 'rgba(239,68,68,0.2)' : 'transparent', color: 'white', border: recompensas.includes('vitalidad') ? '2px solid #EF4444' : '1px solid gray', borderRadius:'12px', padding:'10px 15px', display:'flex', flexDirection:'column', alignItems:'center', gap:'5px', cursor:'pointer', flex:1}}><img src={STATS_CONFIG.vitalidad.icon} style={{width:'48px'}}/><span style={{fontSize:'0.8rem'}}>Integridad</span></button>
                    <button onClick={() => toggleRecompensa('sabiduria')} style={{background: recompensas.includes('sabiduria') ? 'rgba(59,130,246,0.2)' : 'transparent', color: 'white', border: recompensas.includes('sabiduria') ? '2px solid #3B82F6' : '1px solid gray', borderRadius:'12px', padding:'10px 15px', display:'flex', flexDirection:'column', alignItems:'center', gap:'5px', cursor:'pointer', flex:1}}><img src={STATS_CONFIG.sabiduria.icon} style={{width:'48px'}}/><span style={{fontSize:'0.8rem'}}>I+D</span></button>
                    <button onClick={() => toggleRecompensa('vinculacion')} style={{background: recompensas.includes('vinculacion') ? 'rgba(245,158,11,0.2)' : 'transparent', color: 'white', border: recompensas.includes('vinculacion') ? '2px solid #F59E0B' : '1px solid gray', borderRadius:'12px', padding:'10px 15px', display:'flex', flexDirection:'column', alignItems:'center', gap:'5px', cursor:'pointer', flex:1}}><img src={STATS_CONFIG.vinculacion.icon} style={{width:'48px'}}/><span style={{fontSize:'0.8rem'}}>Vinculación</span></button>
                </div>
                <div style={{display: 'flex', gap: '15px', alignItems:'center'}}>
                    <div style={{flex: 1}}><select value={frecuenciaMeta} onChange={(e) => setFrecuenciaMeta(Number(e.target.value))} style={{width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.9rem'}}>{[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} día{n>1?'s':''}/sem</option>)}</select></div>
                    <button onClick={guardarHabito} className="btn-primary" style={{flex: 1, height:'42px'}}>{editingId ? "GUARDAR" : "ASIGNAR"}</button>
                    {editingId && <button onClick={cancelarEdicion} style={{background:'none', border:'none', color:'#EF4444', cursor:'pointer'}}>CANCELAR</button>}
                </div>
              </div>
              
              {/* LISTA DE HÁBITOS */}
              <div style={{display: 'grid', gap: '10px'}}>
                {habitosPaciente.map(h => {
                   const diasLogrados = contarDias(h.registro);
                   const meta = h.frecuenciaMeta || 7;
                   const porcentaje = Math.min(100, Math.round((diasLogrados / meta) * 100));
                   const cumplido = diasLogrados >= meta;
                   const esArchivado = h.estado === 'archivado';

                   return (
                    <div key={h.id} style={{background: esArchivado ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)', padding: '15px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: esArchivado ? '1px dashed rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.05)', opacity: esArchivado ? 0.5 : 1}}>
                      <div style={{flex: 1}}>
                        <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'5px'}}>
                            <strong style={{color:'white', fontSize:'1.1rem', textDecoration: esArchivado ? 'line-through' : 'none'}}>{h.titulo}</strong>
                            <div style={{display:'flex', gap:'5px'}}>
                                {h.recompensas?.includes('vitalidad') && <img src={STATS_CONFIG.vitalidad.icon} style={{width:'32px', height:'32px', objectFit:'contain'}} title="Integridad"/>}
                                {h.recompensas?.includes('sabiduria') && <img src={STATS_CONFIG.sabiduria.icon} style={{width:'32px', height:'32px', objectFit:'contain'}} title="I+D"/>}
                                {h.recompensas?.includes('vinculacion') && <img src={STATS_CONFIG.vinculacion.icon} style={{width:'32px', height:'32px', objectFit:'contain'}} title="Vinculación"/>}
                            </div>
                        </div>
                        <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem', color:'var(--text-muted)', marginBottom:'3px'}}><span>{diasLogrados}/{meta} Ejecuciones</span><span>{esArchivado ? "FINALIZADO" : "ACTIVO"}</span></div>
                        <div style={{width: '100%', background: 'rgba(0,0,0,0.5)', height: '4px', borderRadius:'2px', overflow:'hidden'}}><div style={{width: `${porcentaje}%`, background: cumplido ? 'var(--secondary)' : 'var(--primary)', height: '100%'}}></div></div>
                      </div>
                      <div style={{display:'flex', gap:'10px', marginLeft:'15px', alignItems:'center'}}>
                          <button onClick={() => cargarParaEditar(h)} title="Editar" style={{background:'none', border:'none', cursor:'pointer', color:'var(--primary)'}}><IconEdit /></button>
                          <button onClick={() => archivarHabito(h.id, h.estado)} title={esArchivado ? "Restaurar" : "Completar"} style={{background:'none', border:'none', cursor:'pointer', color: esArchivado ? 'white' : 'var(--secondary)'}}>{esArchivado ? <IconRestore /> : <IconMedal />}</button>
                          <button onClick={() => eliminarHabito(h.id)} title="Purgar" style={{background:'none', border:'none', cursor:'pointer', color:'#EF4444', opacity:0.8}}><IconTrash /></button>
                      </div>
                    </div>
                   )
                })}
              </div>
            </div>
          ) : <div style={{padding: '60px', textAlign: 'center', color: 'var(--text-muted)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px'}}>Selecciona un agente.</div>}
        </div>
      </div>
    </div>
  );
}