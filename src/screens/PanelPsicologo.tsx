import { useState, useEffect } from 'react';
import { doc, updateDoc, addDoc, deleteDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { STATS_CONFIG } from '../game/GameAssets'; // IMPORTAR CONFIG

export function PanelPsicologo({ userData, userUid }: any) {
  const [pacientes, setPacientes] = useState<any[]>([]); 
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);
  const [habitosPaciente, setHabitosPaciente] = useState<any[]>([]);
  
  const [tituloHabito, setTituloHabito] = useState("");
  const [frecuenciaMeta, setFrecuenciaMeta] = useState(7);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recompensas, setRecompensas] = useState<string[]>([]);

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

  const guardarHabito = async () => {
    if (!tituloHabito || !pacienteSeleccionado) return;
    const datos = { titulo: tituloHabito, frecuenciaMeta: frecuenciaMeta, recompensas: recompensas.length > 0 ? recompensas : ['xp'] };
    try {
        const colRef = collection(db, "users", pacienteSeleccionado.id, "habitos");
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

  const analizarBalance = () => {
      if (habitosPaciente.length === 0) return null;
      const activos = habitosPaciente.filter(h => h.estado !== 'archivado');
      if (activos.length === 0) return null;
      const stats = { vitalidad: 0, sabiduria: 0, carisma: 0 };
      activos.forEach(h => {
          if (h.recompensas?.includes('vitalidad')) stats.vitalidad++;
          if (h.recompensas?.includes('sabiduria')) stats.sabiduria++;
          if (h.recompensas?.includes('carisma')) stats.carisma++;
      });
      const faltantes = [];
      if (stats.vitalidad === 0) faltantes.push("INTEGRIDAD");
      if (stats.sabiduria === 0) faltantes.push("I+D");
      if (stats.carisma === 0) faltantes.push("RED");
      if (faltantes.length > 0) return <div style={{background:'rgba(245,158,11,0.1)', border:'1px solid #F59E0B', color:'#F59E0B', padding:'10px', borderRadius:'8px', marginBottom:'20px', fontSize:'0.85rem'}}>⚠️ Sugerencia: Falta trabajar <b>{faltantes.join(", ")}</b>.</div>;
      return <div style={{background:'rgba(16,185,129,0.1)', border:'1px solid #10B981', color:'#10B981', padding:'10px', borderRadius:'8px', marginBottom:'20px', fontSize:'0.85rem'}}>✅ Plan Estratégico Balanceado.</div>;
  };

  return (
    <div style={{textAlign: 'left'}}>
      <div style={{background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', marginBottom: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', border: 'var(--glass-border)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div><h3 style={{margin:0, color: 'var(--primary)', fontSize:'1.5rem'}}>👨‍⚕️ Panel de Control</h3><p style={{margin:0, fontSize:'0.9rem', color:'var(--text-muted)'}}>Código: <strong style={{color:'white'}}>{userData.codigoVinculacion}</strong></p></div>
      </div>

      <div style={{display: 'flex', gap: '30px', flexWrap: 'wrap'}}>
        <div style={{flex: 1, minWidth: '300px'}}>
          <h4 style={{textTransform:'uppercase', fontSize:'0.8rem', color:'var(--secondary)', letterSpacing:'2px', marginBottom:'15px'}}>Agentes (Pacientes)</h4>
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
              
              {/* FICHA DE RECURSOS */}
              <div style={{background: 'linear-gradient(90deg, rgba(15,23,42,0.8) 0%, rgba(30,41,59,0.8) 100%)', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-around', alignItems: 'center'}}>
                  <div style={{textAlign:'center'}}><div style={{fontSize:'2rem', fontWeight:'bold', color:'white'}}>{pacienteSeleccionado.nivel || 1}</div><div style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>NIVEL</div></div>
                  <div style={{textAlign:'center'}}><div style={{fontSize:'1.5rem', color:'#F59E0B', display:'flex', alignItems:'center', gap:'5px'}}><img src={STATS_CONFIG.gold.icon} width="24"/> {pacienteSeleccionado.gold || 0}</div><div style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>FONDOS</div></div>
                  <div style={{display:'flex', gap:'20px'}}>
                      <div style={{textAlign:'center'}}><img src={STATS_CONFIG.vitalidad.icon} width="24" title="Integridad"/><div style={{fontSize:'0.9rem', color:'white', fontWeight:'bold'}}>{pacienteSeleccionado.stats?.vitalidad || 0}</div></div>
                      <div style={{textAlign:'center'}}><img src={STATS_CONFIG.sabiduria.icon} width="24" title="I+D"/><div style={{fontSize:'0.9rem', color:'white', fontWeight:'bold'}}>{pacienteSeleccionado.stats?.sabiduria || 0}</div></div>
                      <div style={{textAlign:'center'}}><img src={STATS_CONFIG.carisma.icon} width="24" title="Red"/><div style={{fontSize:'0.9rem', color:'white', fontWeight:'bold'}}>{pacienteSeleccionado.stats?.carisma || 0}</div></div>
                  </div>
              </div>

              {analizarBalance()}

              {/* FORMULARIO CON ICONOS NUEVOS */}
              <div style={{background: 'var(--bg-card)', padding: '25px', borderRadius: '16px', marginBottom: '20px', border: editingId ? '1px solid var(--primary)' : 'var(--glass-border)', boxShadow: '0 4px 30px rgba(0,0,0,0.3)'}}>
                <h4 style={{color: 'white', marginTop:0}}>{editingId ? "✏️ EDITAR PROTOCOLO" : "NUEVO PROTOCOLO"}</h4>
                <div style={{marginBottom: '15px'}}><input type="text" value={tituloHabito} onChange={(e) => setTituloHabito(e.target.value)} placeholder="Descripción del protocolo..." style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white'}} /></div>
                <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}>
                    {/* BOTONES DE SELECCIÓN DE RECOMPENSA */}
                    <button onClick={() => toggleRecompensa('vitalidad')} style={{background: recompensas.includes('vitalidad') ? 'rgba(239,68,68,0.2)' : 'transparent', color: 'white', border: recompensas.includes('vitalidad') ? '1px solid #EF4444' : '1px solid gray', borderRadius:'12px', padding:'5px 10px', display:'flex', alignItems:'center', gap:'5px', cursor:'pointer'}}>
                        <img src={STATS_CONFIG.vitalidad.icon} width="20"/> Integridad
                    </button>
                    <button onClick={() => toggleRecompensa('sabiduria')} style={{background: recompensas.includes('sabiduria') ? 'rgba(59,130,246,0.2)' : 'transparent', color: 'white', border: recompensas.includes('sabiduria') ? '1px solid #3B82F6' : '1px solid gray', borderRadius:'12px', padding:'5px 10px', display:'flex', alignItems:'center', gap:'5px', cursor:'pointer'}}>
                        <img src={STATS_CONFIG.sabiduria.icon} width="20"/> I+D
                    </button>
                    <button onClick={() => toggleRecompensa('carisma')} style={{background: recompensas.includes('carisma') ? 'rgba(245,158,11,0.2)' : 'transparent', color: 'white', border: recompensas.includes('carisma') ? '1px solid #F59E0B' : '1px solid gray', borderRadius:'12px', padding:'5px 10px', display:'flex', alignItems:'center', gap:'5px', cursor:'pointer'}}>
                        <img src={STATS_CONFIG.carisma.icon} width="20"/> Red
                    </button>
                </div>
                <div style={{display: 'flex', gap: '15px', alignItems:'center'}}>
                    <div style={{flex: 1}}><select value={frecuenciaMeta} onChange={(e) => setFrecuenciaMeta(Number(e.target.value))} style={{width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.9rem'}}>{[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} día{n>1?'s':''}/sem</option>)}</select></div>
                    <button onClick={guardarHabito} className="btn-primary" style={{flex: 1, height:'42px'}}>{editingId ? "GUARDAR" : "ASIGNAR"}</button>
                    {editingId && <button onClick={cancelarEdicion} style={{background:'none', border:'none', color:'#EF4444', cursor:'pointer'}}>CANCELAR</button>}
                </div>
              </div>
              
              {/* LISTA */}
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
                                {h.recompensas?.includes('vitalidad') && <img src={STATS_CONFIG.vitalidad.icon} width="16" title="Integridad"/>}
                                {h.recompensas?.includes('sabiduria') && <img src={STATS_CONFIG.sabiduria.icon} width="16" title="I+D"/>}
                                {h.recompensas?.includes('carisma') && <img src={STATS_CONFIG.carisma.icon} width="16" title="Red"/>}
                            </div>
                        </div>
                        <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem', color:'var(--text-muted)', marginBottom:'3px'}}><span>{diasLogrados}/{meta} Ejecuciones</span><span>{esArchivado ? "FINALIZADO" : "ACTIVO"}</span></div>
                        <div style={{width: '100%', background: 'rgba(0,0,0,0.5)', height: '4px', borderRadius:'2px', overflow:'hidden'}}><div style={{width: `${porcentaje}%`, background: cumplido ? 'var(--secondary)' : 'var(--primary)', height: '100%'}}></div></div>
                      </div>
                      <div style={{display:'flex', gap:'10px', marginLeft:'15px'}}>
                          <button onClick={() => cargarParaEditar(h)} style={{background:'none', border:'1px solid var(--primary)', color:'var(--primary)', padding:'4px 8px', borderRadius:'4px', cursor:'pointer', fontSize:'0.7rem'}}>EDIT</button>
                          <button onClick={() => archivarHabito(h.id, h.estado)} style={{background:'none', border: esArchivado ? '1px solid white' : '1px solid var(--secondary)', color: esArchivado ? 'white' : 'var(--secondary)', padding:'4px 8px', borderRadius:'4px', cursor:'pointer', fontSize:'0.7rem'}}>{esArchivado ? "RESTORE" : "MASTER"}</button>
                          <button onClick={() => eliminarHabito(h.id)} style={{background:'none', border:'1px solid #EF4444', color:'#EF4444', padding:'4px 8px', borderRadius:'4px', cursor:'pointer', fontSize:'0.7rem'}}>PURGE</button>
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