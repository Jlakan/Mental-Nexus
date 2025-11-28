import { useState, useEffect } from 'react';
import { doc, updateDoc, addDoc, deleteDoc, collection, query, where, onSnapshot, increment } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { STATS_CONFIG, StatTipo, PERSONAJES, PersonajeTipo, obtenerEtapaActual, obtenerNivel } from '../game/GameAssets';

// Iconos SVG
const IconEdit = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const IconMedal = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>;
const IconRestore = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>;
const IconTrash = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

export function PanelPsicologo({ userData, userUid }: any) {
  const [pacientes, setPacientes] = useState<any[]>([]); 
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);
  const [habitosPaciente, setHabitosPaciente] = useState<any[]>([]);
  
  // Formulario
  const [tituloHabito, setTituloHabito] = useState("");
  const [frecuenciaMeta, setFrecuenciaMeta] = useState(7);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recompensas, setRecompensas] = useState<string[]>([]);
  
  // Modal y Búsqueda
  const [selectedResource, setSelectedResource] = useState<{ type: StatTipo, value: number } | null>(null);
  const [busqueda, setBusqueda] = useState(""); 

  // 1. Cargar lista de pacientes
  useEffect(() => {
    const colRef = collection(db, "users", userUid, "pacientes");
    const unsubscribe = onSnapshot(colRef, (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPacientes(lista);
    });
    return () => unsubscribe();
  }, [userUid]);

  // 2. Cargar hábitos del paciente seleccionado
  useEffect(() => {
    if (!pacienteSeleccionado) { setHabitosPaciente([]); return; }
    const q = query(collection(db, "users", pacienteSeleccionado.id, "habitos"));
    const unsubscribe = onSnapshot(q, (snap) => setHabitosPaciente(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsubscribe();
  }, [pacienteSeleccionado]);

  // FILTRO DE PACIENTES
  const pacientesFiltrados = pacientes.filter(p => 
    p.displayName.toLowerCase().includes(busqueda.toLowerCase()) || 
    p.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  const toggleRecompensa = (tipo: string) => {
    if (recompensas.includes(tipo)) setRecompensas(recompensas.filter(r => r !== tipo));
    else setRecompensas([...recompensas, tipo]);
  };

  // --- ACCIONES CLÍNICAS ---
  const registrarAsistencia = async () => {
      if(!confirm(`¿Registrar asistencia de ${pacienteSeleccionado.displayName}?\n\n+1 NEXO otorgado.`)) return;
      await updateDoc(doc(db, "users", userUid, "pacientes", pacienteSeleccionado.id), { nexo: increment(1), xp: increment(500) });
      alert("Asistencia registrada.");
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
      const nuevo = estadoActual === 'archivado' ? 'activo' : 'archivado';
      if(confirm(nuevo === 'archivado' ? "Se moverá al historial." : "Se reactivará.")) await updateDoc(doc(db, "users", pacienteSeleccionado.id, "habitos", id), { estado: nuevo });
  };
  const eliminarHabito = async (id: string) => {
    if(confirm("⚠️ ¿ELIMINAR TOTALMENTE?")) await deleteDoc(doc(db, "users", pacienteSeleccionado.id, "habitos", id));
  };
  const contarDias = (reg: any) => Object.values(reg).filter(v => v === true).length;

  // Monitor de Balance
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

  // --- RENDERIZADO ---

  // VISTA 1: LISTA DE PACIENTES (SI NO HAY SELECCIONADO)
  if (!pacienteSeleccionado) {
      return (
        <div style={{textAlign: 'left'}}>
            {/* HEADER GENERAL */}
            <div style={{background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', marginBottom: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', border: 'var(--glass-border)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div><h3 style={{margin:0, color: 'var(--primary)', fontSize:'1.5rem'}}>👨‍⚕️ Mi Consultorio</h3><p style={{margin:0, fontSize:'0.9rem', color:'var(--text-muted)'}}>Código: <strong style={{color:'white'}}>{userData.codigoVinculacion}</strong></p></div>
            </div>

            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                <h4 style={{textTransform:'uppercase', fontSize:'1rem', color:'var(--secondary)', letterSpacing:'2px', margin:0}}>
                    Expedientes ({pacientesFiltrados.length})
                </h4>
                {/* BUSCADOR */}
                <div style={{position: 'relative'}}>
                    <span style={{position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)'}}>🔍</span>
                    <input 
                        type="text" 
                        placeholder="Buscar paciente..." 
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        style={{padding: '10px 10px 10px 35px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', width: '250px'}}
                    />
                </div>
            </div>
            
            {/* GRID DE PACIENTES */}
            <div style={{display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'}}>
                {pacientesFiltrados.map(p => {
                    // Helper para obtener imagen de avatar
                    const avatarData = p.avatarKey ? PERSONAJES[p.avatarKey as PersonajeTipo]?.etapas[0] : null;

                    return (
                        <div key={p.id} onClick={() => p.isAuthorized && setPacienteSeleccionado(p)} style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', transition: 'all 0.2s', cursor: p.isAuthorized ? 'pointer' : 'default', position: 'relative', overflow:'hidden'}} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <div>
                                    <div style={{fontWeight: 'bold', color: 'white', fontSize:'1.3rem'}}>{p.displayName}</div>
                                    <div style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>{p.email}</div>
                                </div>
                                
                                {/* MINI AVATAR CORREGIDO */}
                                <div style={{width:'50px', height:'50px', borderRadius:'50%', overflow:'hidden', background:'black', border:'1px solid rgba(255,255,255,0.1)'}}>
                                    {avatarData ? (
                                        avatarData.imagen.endsWith('.mp4') ? 
                                        <video src={avatarData.imagen} autoPlay loop muted playsInline style={{width:'100%', height:'100%', objectFit:'cover'}} /> :
                                        <img src={avatarData.imagen} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                                    ) : (
                                        <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem'}}>👤</div>
                                    )}
                                </div>
                            </div>
                            
                            <div style={{marginTop: '15px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <span style={{background: p.isAuthorized ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: p.isAuthorized ? 'var(--secondary)' : '#EF4444', padding:'4px 10px', borderRadius:'4px', fontSize:'0.7rem', fontWeight:'bold', border: p.isAuthorized ? '1px solid var(--secondary)' : '1px solid #EF4444'}}>
                                    {p.isAuthorized ? "ACTIVO" : "PENDIENTE"}
                                </span>
                                {!p.isAuthorized && (
                                    <button onClick={(e) => { e.stopPropagation(); autorizarPaciente(p.id, p.isAuthorized); }} style={{padding: '5px 10px', borderRadius: '6px', fontSize: '0.7rem', cursor:'pointer', fontWeight: 'bold', background: 'var(--primary)', color: 'black', border:'none'}}>
                                        AUTORIZAR ACCESO
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {pacientesFiltrados.length === 0 && (
                <p style={{textAlign:'center', color:'gray', marginTop:'50px'}}>No se encontraron pacientes.</p>
            )}
        </div>
      );
  }

  // VISTA 2: DETALLE DEL PACIENTE (SI HAY SELECCIONADO)
  const avatarKey = pacienteSeleccionado.avatarKey as PersonajeTipo;
  const avatarDef = PERSONAJES[avatarKey] || PERSONAJES['atlas'];
  const nivelPaciente = obtenerNivel(pacienteSeleccionado.xp || 0);
  const etapaVisual = obtenerEtapaActual(avatarDef, nivelPaciente);

  return (
    <div style={{textAlign: 'left', animation: 'fadeIn 0.3s'}}>
      
      {/* MODAL DE RECURSO */}
      {selectedResource && (
          <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', zIndex:9999, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(15px)', display:'flex', justifyContent:'center', alignItems:'center', padding:'20px'}} onClick={() => setSelectedResource(null)}>
              <div style={{background: 'var(--bg-card)', border: 'var(--glass-border)', borderRadius: '20px', padding: '40px', textAlign: 'center', maxWidth: '600px', width:'100%', boxShadow: '0 0 80px rgba(6, 182, 212, 0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center'}} onClick={e => e.stopPropagation()}>
                  <h2 style={{color: selectedResource.type === 'gold' ? '#F59E0B' : (selectedResource.type === 'nexo' ? '#8B5CF6' : 'white'), fontFamily: 'Rajdhani', textTransform:'uppercase', fontSize:'2.5rem', marginBottom:'30px', textShadow: '0 0 20px rgba(0,0,0,0.5)'}}>{STATS_CONFIG[selectedResource.type].label}</h2>
                  <img src={STATS_CONFIG[selectedResource.type].icon} style={{width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '40vh', marginBottom: '30px', filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.1))'}} />
                  <div style={{fontSize: '4rem', fontWeight: 'bold', color: 'white', marginBottom: '10px', lineHeight: 1, textShadow: '0 0 20px rgba(255,255,255,0.3)'}}>{selectedResource.value}</div>
                  <p style={{color: 'var(--text-muted)', fontSize: '1.2rem', lineHeight: '1.6', maxWidth: '80%'}}>{STATS_CONFIG[selectedResource.type].desc}</p>
                  <button onClick={() => setSelectedResource(null)} className="btn-primary" style={{marginTop: '40px', width: '200px', fontSize: '1.1rem'}}>ENTENDIDO</button>
              </div>
          </div>
      )}

      {/* HEADER DE NAVEGACIÓN */}
      <button onClick={() => setPacienteSeleccionado(null)} style={{background:'none', border:'none', color:'var(--text-muted)', fontSize:'1rem', cursor:'pointer', marginBottom:'20px', display:'flex', alignItems:'center', gap:'5px'}}>
          ⬅ VOLVER A LA LISTA
      </button>

      {/* FICHA DEL JUGADOR (CON AVATAR) */}
      <div style={{background: 'linear-gradient(90deg, rgba(15,23,42,0.8) 0%, rgba(30,41,59,0.8) 100%)', padding: '30px', borderRadius: '16px', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap:'wrap', gap:'20px'}}>
          
          <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
              {/* AVATAR (VIDEO) */}
              <div style={{width:'100px', height:'100px', borderRadius:'50%', overflow:'hidden', boxShadow:'0 0 20px var(--primary)', border: '2px solid var(--primary)', background: 'black'}}>
                {etapaVisual.imagen.endsWith('.mp4') ? (
                    <video src={etapaVisual.imagen} autoPlay loop muted playsInline style={{width:'100%', height:'100%', objectFit:'cover'}} />
                ) : (
                    <img src={etapaVisual.imagen} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                )}
              </div>
              <div>
                  <h1 style={{margin:0, fontSize:'2rem', color:'white', fontFamily:'Rajdhani'}}>{pacienteSeleccionado.displayName}</h1>
                  <div style={{color:'var(--primary)', fontSize:'1rem', textTransform:'uppercase', letterSpacing:'1px'}}>{etapaVisual.nombreClase} • NIVEL {nivelPaciente}</div>
              </div>
          </div>
          
          {/* BOTÓN DE ASISTENCIA */}
          <button onClick={registrarAsistencia} style={{background: 'rgba(139, 92, 246, 0.2)', border: '1px solid #8B5CF6', color: '#8B5CF6', padding:'15px 30px', borderRadius:'12px', cursor:'pointer', fontWeight:'bold', display:'flex', alignItems:'center', gap:'10px', fontSize:'1rem'}}>
            <img src={STATS_CONFIG.nexo.icon} width="30"/> REGISTRAR ASISTENCIA
          </button>
      </div>
      
      {/* STATS DETALLADOS */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(100px, 1fr))', gap:'15px', marginBottom:'30px'}}>
           <div onClick={() => setSelectedResource({ type: 'gold', value: pacienteSeleccionado.gold || 0 })} style={{background:'rgba(255,255,255,0.05)', padding:'15px', borderRadius:'12px', textAlign:'center', cursor:'pointer', border:'1px solid rgba(245, 158, 11, 0.3)'}}>
                <img src={STATS_CONFIG.gold.icon} width="50" style={{marginBottom:'10px'}}/>
                <div style={{fontSize:'1.5rem', fontWeight:'bold', color:'#F59E0B'}}>{pacienteSeleccionado.gold || 0}</div>
                <div style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>FONDOS</div>
           </div>
           <div onClick={() => setSelectedResource({ type: 'nexo', value: pacienteSeleccionado.nexo || 0 })} style={{background:'rgba(255,255,255,0.05)', padding:'15px', borderRadius:'12px', textAlign:'center', cursor:'pointer', border:'1px solid rgba(139, 92, 246, 0.3)'}}>
                <img src={STATS_CONFIG.nexo.icon} width="50" style={{marginBottom:'10px'}}/>
                <div style={{fontSize:'1.5rem', fontWeight:'bold', color:'#8B5CF6'}}>{pacienteSeleccionado.nexo || 0}</div>
                <div style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>NEXOS</div>
           </div>
           <div onClick={() => setSelectedResource({ type: 'vitalidad', value: pacienteSeleccionado.stats?.vitalidad || 0 })} style={{background:'rgba(255,255,255,0.05)', padding:'15px', borderRadius:'12px', textAlign:'center', cursor:'pointer', border:'1px solid rgba(255,255,255,0.1)'}}>
                <img src={STATS_CONFIG.vitalidad.icon} width="50" style={{marginBottom:'10px'}}/>
                <div style={{fontSize:'1.5rem', fontWeight:'bold', color:'white'}}>{pacienteSeleccionado.stats?.vitalidad || 0}</div>
           </div>
           <div onClick={() => setSelectedResource({ type: 'sabiduria', value: pacienteSeleccionado.stats?.sabiduria || 0 })} style={{background:'rgba(255,255,255,0.05)', padding:'15px', borderRadius:'12px', textAlign:'center', cursor:'pointer', border:'1px solid rgba(255,255,255,0.1)'}}>
                <img src={STATS_CONFIG.sabiduria.icon} width="50" style={{marginBottom:'10px'}}/>
                <div style={{fontSize:'1.5rem', fontWeight:'bold', color:'white'}}>{pacienteSeleccionado.stats?.sabiduria || 0}</div>
           </div>
           <div onClick={() => setSelectedResource({ type: 'vinculacion', value: pacienteSeleccionado.stats?.vinculacion || 0 })} style={{background:'rgba(255,255,255,0.05)', padding:'15px', borderRadius:'12px', textAlign:'center', cursor:'pointer', border:'1px solid rgba(255,255,255,0.1)'}}>
                <img src={STATS_CONFIG.vinculacion.icon} width="50" style={{marginBottom:'10px'}}/>
                <div style={{fontSize:'1.5rem', fontWeight:'bold', color:'white'}}>{pacienteSeleccionado.stats?.vinculacion || 0}</div>
           </div>
      </div>

      {analizarBalance()}

      {/* FORMULARIO DE HÁBITOS (IGUAL) */}
      <div style={{background: 'var(--bg-card)', padding: '30px', borderRadius: '16px', marginBottom: '30px', border: editingId ? '2px solid var(--primary)' : 'var(--glass-border)', boxShadow: '0 4px 30px rgba(0,0,0,0.3)'}}>
        <h4 style={{color: 'white', marginTop:0, fontSize:'1.2rem', marginBottom:'20px'}}>{editingId ? "✏️ EDITAR PROTOCOLO" : "NUEVO PROTOCOLO"}</h4>
        
        <div style={{marginBottom: '20px'}}>
            <input type="text" value={tituloHabito} onChange={(e) => setTituloHabito(e.target.value)} placeholder="Descripción del protocolo..." style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white', fontSize:'1.1rem', padding:'15px'}} />
        </div>
        
        <div style={{display:'flex', gap:'15px', marginBottom:'20px'}}>
            <button onClick={() => toggleRecompensa('vitalidad')} style={{background: recompensas.includes('vitalidad') ? 'rgba(239,68,68,0.2)' : 'transparent', color: 'white', border: recompensas.includes('vitalidad') ? '2px solid #EF4444' : '1px solid gray', borderRadius:'12px', padding:'15px', display:'flex', flexDirection:'column', alignItems:'center', gap:'10px', cursor:'pointer', flex:1, transition:'all 0.2s'}}>
                <img src={STATS_CONFIG.vitalidad.icon} style={{width:'50px', height:'50px', objectFit:'contain'}}/>
                <span style={{fontSize:'0.9rem', fontWeight:'bold'}}>Integridad</span>
            </button>
            <button onClick={() => toggleRecompensa('sabiduria')} style={{background: recompensas.includes('sabiduria') ? 'rgba(59,130,246,0.2)' : 'transparent', color: 'white', border: recompensas.includes('sabiduria') ? '2px solid #3B82F6' : '1px solid gray', borderRadius:'12px', padding:'15px', display:'flex', flexDirection:'column', alignItems:'center', gap:'10px', cursor:'pointer', flex:1, transition:'all 0.2s'}}>
                <img src={STATS_CONFIG.sabiduria.icon} style={{width:'50px', height:'50px', objectFit:'contain'}}/>
                <span style={{fontSize:'0.9rem', fontWeight:'bold'}}>I+D</span>
            </button>
            <button onClick={() => toggleRecompensa('vinculacion')} style={{background: recompensas.includes('vinculacion') ? 'rgba(245,158,11,0.2)' : 'transparent', color: 'white', border: recompensas.includes('vinculacion') ? '2px solid #F59E0B' : '1px solid gray', borderRadius:'12px', padding:'15px', display:'flex', flexDirection:'column', alignItems:'center', gap:'10px', cursor:'pointer', flex:1, transition:'all 0.2s'}}>
                <img src={STATS_CONFIG.vinculacion.icon} style={{width:'50px', height:'50px', objectFit:'contain'}}/>
                <span style={{fontSize:'0.9rem', fontWeight:'bold'}}>Vinculación</span>
            </button>
        </div>

        <div style={{display: 'flex', gap: '20px', alignItems:'center'}}>
            <div style={{flex: 1}}>
                <select value={frecuenciaMeta} onChange={(e) => setFrecuenciaMeta(Number(e.target.value))} style={{width: '100%', padding: '15px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', fontSize: '1rem'}}>
                    {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} día{n>1?'s':''}/sem</option>)}
                </select>
            </div>
            <button onClick={guardarHabito} className="btn-primary" style={{flex: 1, height:'52px', fontSize:'1.1rem', letterSpacing:'1px'}}>{editingId ? "GUARDAR CAMBIOS" : "ASIGNAR MISION"}</button>
            {editingId && <button onClick={cancelarEdicion} style={{background:'none', border:'2px solid #EF4444', color:'#EF4444', cursor:'pointer', padding:'0 30px', height:'52px', borderRadius:'8px', fontWeight:'bold'}}>CANCELAR</button>}
        </div>
      </div>
      
      {/* LISTA DE HÁBITOS */}
      <div style={{display: 'grid', gap: '15px'}}>
        {habitosPaciente.map(h => {
            const diasLogrados = contarDias(h.registro);
            const meta = h.frecuenciaMeta || 7;
            const porcentaje = Math.min(100, Math.round((diasLogrados / meta) * 100));
            const cumplido = diasLogrados >= meta;
            const esArchivado = h.estado === 'archivado';

            return (
            <div key={h.id} style={{background: esArchivado ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: esArchivado ? '1px dashed rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.05)', opacity: esArchivado ? 0.5 : 1}}>
                <div style={{flex: 1}}>
                <div style={{display:'flex', alignItems:'center', gap:'15px', marginBottom:'10px'}}>
                    <strong style={{color:'white', fontSize:'1.2rem', textDecoration: esArchivado ? 'line-through' : 'none'}}>{h.titulo}</strong>
                    <div style={{display:'flex', gap:'5px'}}>
                        {h.recompensas?.includes('vitalidad') && <img src={STATS_CONFIG.vitalidad.icon} style={{width:'32px', height:'32px', objectFit:'contain'}} title="Integridad"/>}
                        {h.recompensas?.includes('sabiduria') && <img src={STATS_CONFIG.sabiduria.icon} style={{width:'32px', height:'32px', objectFit:'contain'}} title="I+D"/>}
                        {h.recompensas?.includes('vinculacion') && <img src={STATS_CONFIG.vinculacion.icon} style={{width:'32px', height:'32px', objectFit:'contain'}} title="Vinculación"/>}
                    </div>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.9rem', color:'var(--text-muted)', marginBottom:'5px'}}><span>{diasLogrados}/{meta} Ejecuciones</span><span>{esArchivado ? "FINALIZADO" : "ACTIVO"}</span></div>
                <div style={{width: '100%', background: 'rgba(0,0,0,0.5)', height: '6px', borderRadius:'3px', overflow:'hidden'}}><div style={{width: `${porcentaje}%`, background: 'var(--secondary)', height: '100%'}}></div></div>
                </div>
                <div style={{display:'flex', gap:'15px', marginLeft:'20px', alignItems:'center'}}>
                    <button onClick={() => cargarParaEditar(h)} title="Editar" style={{background:'none', border:'1px solid var(--primary)', color:'var(--primary)', padding:'8px', borderRadius:'8px', cursor:'pointer'}}><IconEdit /></button>
                    <button onClick={() => archivarHabito(h.id, h.estado)} title={esArchivado ? "Restaurar" : "Completar"} style={{background:'none', border: esArchivado ? '1px solid white' : '1px solid var(--secondary)', color: esArchivado ? 'white' : 'var(--secondary)', padding:'8px', borderRadius:'8px', cursor:'pointer'}}>{esArchivado ? <IconRestore /> : <IconMedal />}</button>
                    <button onClick={() => eliminarHabito(h.id)} title="Purgar" style={{background:'none', border:'1px solid #EF4444', color:'#EF4444', padding:'8px', borderRadius:'8px', cursor:'pointer', opacity:0.8}}><IconTrash /></button>
                </div>
            </div>
            )
        })}
      </div>

    </div>
  );
}