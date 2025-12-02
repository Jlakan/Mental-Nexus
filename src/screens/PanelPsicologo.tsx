import { useState, useEffect } from 'react';
import { doc, updateDoc, addDoc, deleteDoc, collection, query, where, onSnapshot, increment } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { STATS_CONFIG, StatTipo, PERSONAJES, PersonajeTipo, obtenerEtapaActual, obtenerNivel } from '../game/GameAssets';

// --- ICONOS ---
const IconEdit = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const IconMedal = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>;
const IconRestore = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>;
const IconTrash = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const IconArrowDown = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>;
const IconArrowUp = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>;

export function PanelPsicologo({ userData, userUid }: any) {
  const [pacientes, setPacientes] = useState<any[]>([]); 
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);
  
  // DATOS DEL PACIENTE
  const [habitosPaciente, setHabitosPaciente] = useState<any[]>([]);
  const [misionesPaciente, setMisionesPaciente] = useState<any[]>([]);
  
  // GESTIÓN DE UI
  const [showHabits, setShowHabits] = useState(true);
  const [showQuests, setShowQuests] = useState(false);
  const [selectedResource, setSelectedResource] = useState<{ type: StatTipo, value: number } | null>(null);
  const [busqueda, setBusqueda] = useState(""); 

  // FORMULARIO HÁBITOS
  const [tituloHabito, setTituloHabito] = useState("");
  const [frecuenciaMeta, setFrecuenciaMeta] = useState(7);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recompensas, setRecompensas] = useState<string[]>([]);

  // FORMULARIO QUESTS
  const [questTitulo, setQuestTitulo] = useState("");
  const [questDesc, setQuestDesc] = useState("");
  const [questDif, setQuestDif] = useState<'facil'|'media'|'dificil'>('media');
  const [questFecha, setQuestFecha] = useState("");
  const [questSubs, setQuestSubs] = useState<{id:number, texto:string, completado:boolean}[]>([]);
  const [newSubText, setNewSubText] = useState("");

  // 1. CARGAR LISTA DE PACIENTES
  useEffect(() => {
    const colRef = collection(db, "users", userUid, "pacientes");
    const unsubscribe = onSnapshot(colRef, (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPacientes(lista);
    });
    return () => unsubscribe();
  }, [userUid]);

  // 2. CARGAR DATOS DEL PACIENTE SELECCIONADO
  useEffect(() => {
    if (!pacienteSeleccionado) { setHabitosPaciente([]); setMisionesPaciente([]); return; }
    
    const unsubHabitos = onSnapshot(query(collection(db, "users", pacienteSeleccionado.id, "habitos")), (snap) => {
        setHabitosPaciente(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubMisiones = onSnapshot(query(collection(db, "users", pacienteSeleccionado.id, "misiones")), (snap) => {
        setMisionesPaciente(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubHabitos(); unsubMisiones(); };
  }, [pacienteSeleccionado]);

  // --- LOGICA DE QUESTS ---
  const addSubObjetivo = () => {
      if(!newSubText) return;
      setQuestSubs([...questSubs, { id: Date.now(), texto: newSubText, completado: false }]);
      setNewSubText("");
  };
  const removeSubObjetivo = (id: number) => setQuestSubs(questSubs.filter(s => s.id !== id));
  
  const guardarQuest = async () => {
      if (!questTitulo || !questDesc || !questFecha) return alert("Completa todos los campos");
      try {
          await addDoc(collection(db, "users", pacienteSeleccionado.id, "misiones"), {
              titulo: questTitulo, descripcion: questDesc, dificultad: questDif,
              fechaVencimiento: questFecha, subObjetivos: questSubs,
              estado: 'activa', createdAt: new Date()
          });
          setQuestTitulo(""); setQuestDesc(""); setQuestSubs([]); setQuestFecha("");
          alert("Misión asignada correctamente.");
      } catch (e) { console.error(e); }
  };
  
  const eliminarQuest = async (id: string) => {
      if(confirm("¿Eliminar misión?")) await deleteDoc(doc(db, "users", pacienteSeleccionado.id, "misiones", id));
  };

  // --- LOGICA DE HÁBITOS ---
  const registrarAsistencia = async () => {
      if(!confirm(`¿Registrar asistencia de ${pacienteSeleccionado.displayName}?\n\n+1 NEXO otorgado.`)) return;
      await updateDoc(doc(db, "users", userUid, "pacientes", pacienteSeleccionado.id), { nexo: increment(1), xp: increment(500) });
      alert("Asistencia registrada.");
  };

  // --- FUNCIÓN RECUPERADA (ESTABA FALTANDO) ---
  const toggleRecompensa = (tipo: string) => {
    if (recompensas.includes(tipo)) setRecompensas(recompensas.filter(r => r !== tipo));
    else setRecompensas([...recompensas, tipo]);
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
  
  const contarDias = (reg: any) => Object.values(reg || {}).filter(v => v === true).length;
  const tieneInteraccion = (habito: any) => {
      const checks = contarDias(habito.registro) > 0;
      const comments = Object.keys(habito.comentariosSemana || {}).length > 0;
      return checks || comments;
  };

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
      if (faltantes.length > 0) return <div style={{background:'rgba(245,158,11,0.1)', border:'1px solid #F59E0B', color:'#F59E0B', padding:'15px', borderRadius:'12px', marginBottom:'20px', fontSize:'1rem'}}>⚠️ <strong>Balance:</strong> Faltan actividades de <b>{faltantes.join(", ")}</b>.</div>;
      return null;
  };

  const pacientesFiltrados = pacientes.filter(p => p.displayName.toLowerCase().includes(busqueda.toLowerCase()));

  // --- RENDERIZADO ---

  // VISTA 1: LISTA DE PACIENTES
  if (!pacienteSeleccionado) {
      return (
        <div style={{textAlign: 'left'}}>
             <div style={{background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', marginBottom: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', border: 'var(--glass-border)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                    <img src="/psicologo.png" style={{width:'60px', height:'60px', borderRadius:'50%', border:'2px solid var(--primary)', objectFit:'cover'}} />
                    <div><h3 style={{margin:0, color: 'var(--primary)', fontSize:'1.5rem'}}>PANEL DE CONTROL</h3><p style={{margin:0, fontSize:'0.9rem', color:'var(--text-muted)'}}>Código: <strong style={{color:'white'}}>{userData.codigoVinculacion}</strong></p></div>
                </div>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                <h4 style={{textTransform:'uppercase', fontSize:'1rem', color:'var(--secondary)', letterSpacing:'2px', margin:0}}>Expedientes ({pacientesFiltrados.length})</h4>
                <div style={{position: 'relative'}}>
                    <span style={{position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)'}}>🔍</span>
                    <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{padding: '10px 10px 10px 35px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', width: '250px'}} />
                </div>
            </div>
            <div style={{display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'}}>
                {pacientesFiltrados.map(p => {
                    const avatarData = p.avatarKey ? PERSONAJES[p.avatarKey as PersonajeTipo]?.etapas[0] : null;
                    return (
                        <div key={p.id} onClick={() => p.isAuthorized && setPacienteSeleccionado(p)} style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', cursor: p.isAuthorized ? 'pointer' : 'default', position: 'relative'}} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <div><div style={{fontWeight: 'bold', color: 'white', fontSize:'1.3rem'}}>{p.displayName}</div><div style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>{p.email}</div></div>
                                <div style={{width:'50px', height:'50px', borderRadius:'50%', overflow:'hidden', background:'black', border:'1px solid rgba(255,255,255,0.1)'}}>
                                    {avatarData ? (avatarData.imagen.endsWith('.mp4') ? <video src={avatarData.imagen} autoPlay loop muted playsInline style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <img src={avatarData.imagen} style={{width:'100%', height:'100%', objectFit:'cover'}} />) : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem'}}>👤</div>}
                                </div>
                            </div>
                            <div style={{marginTop: '15px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <span style={{background: p.isAuthorized ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: p.isAuthorized ? 'var(--secondary)' : '#EF4444', padding:'4px 10px', borderRadius:'4px', fontSize:'0.7rem', fontWeight:'bold'}}>{p.isAuthorized ? "ACTIVO" : "PENDIENTE"}</span>
                                {!p.isAuthorized && <button onClick={(e) => { e.stopPropagation(); autorizarPaciente(p.id, p.isAuthorized); }} style={{padding: '5px 10px', borderRadius: '6px', fontSize: '0.7rem', cursor:'pointer', fontWeight: 'bold', background: 'var(--primary)', color: 'black', border:'none'}}>AUTORIZAR</button>}
                            </div>
                        </div>
                    );
                })}
            </div>
            {pacientesFiltrados.length === 0 && <p style={{textAlign:'center', color:'gray', marginTop:'50px'}}>No se encontraron pacientes.</p>}
        </div>
      );
  }

  // VISTA 2: DETALLE DEL PACIENTE
  const avatarKey = pacienteSeleccionado.avatarKey as PersonajeTipo;
  const avatarDef = PERSONAJES[avatarKey] || PERSONAJES['atlas'];
  const nivelPaciente = obtenerNivel(pacienteSeleccionado.xp || 0);
  const etapaVisual = obtenerEtapaActual(avatarDef, nivelPaciente);

  return (
    <div style={{textAlign: 'left', animation: 'fadeIn 0.3s'}}>
      
      {selectedResource && (
           <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', zIndex:9999, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(15px)', display:'flex', justifyContent:'center', alignItems:'center', padding:'20px'}} onClick={() => setSelectedResource(null)}>
               <h2 style={{color:'white'}}>Recurso: {selectedResource.value}</h2>
           </div>
      )}

      {/* HEADER */}
      <button onClick={() => setPacienteSeleccionado(null)} style={{background:'none', border:'none', color:'var(--text-muted)', fontSize:'1rem', cursor:'pointer', marginBottom:'20px', display:'flex', alignItems:'center', gap:'5px'}}>⬅ VOLVER</button>

      <div style={{background: 'linear-gradient(90deg, rgba(15,23,42,0.8) 0%, rgba(30,41,59,0.8) 100%)', padding: '30px', borderRadius: '16px', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap:'wrap', gap:'20px'}}>
          <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
              <div style={{width:'100px', height:'100px', borderRadius:'50%', overflow:'hidden', boxShadow:'0 0 20px var(--primary)', border: '2px solid var(--primary)', background: 'black'}}>
                {etapaVisual.imagen.endsWith('.mp4') ? <video src={etapaVisual.imagen} autoPlay loop muted playsInline style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <img src={etapaVisual.imagen} style={{width:'100%', height:'100%', objectFit:'cover'}} />}
              </div>
              <div><h1 style={{margin:0, fontSize:'2rem', color:'white', fontFamily:'Rajdhani'}}>{pacienteSeleccionado.displayName}</h1><div style={{color:'var(--primary)', fontSize:'1rem', textTransform:'uppercase', letterSpacing:'1px'}}>{etapaVisual.nombreClase} • NIVEL {nivelPaciente}</div></div>
          </div>
          <button onClick={registrarAsistencia} style={{background: 'rgba(139, 92, 246, 0.2)', border: '1px solid #8B5CF6', color: '#8B5CF6', padding:'15px 30px', borderRadius:'12px', cursor:'pointer', fontWeight:'bold', display:'flex', alignItems:'center', gap:'10px', fontSize:'1rem'}}><img src={STATS_CONFIG.nexo.icon} width="30"/> REGISTRAR ASISTENCIA</button>
      </div>
      
      {analizarBalance()}

      {/* ================= SECCIÓN DE HÁBITOS ================= */}
      <div style={{marginBottom:'40px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', background:'var(--bg-card)', padding:'15px', borderRadius:'12px', cursor:'pointer'}} onClick={() => setShowHabits(!showHabits)}>
              <h3 style={{margin:0, fontFamily:'Rajdhani', color:'white', fontSize:'1.5rem'}}>RUTINA DIARIA ({habitosPaciente.length})</h3>
              {showHabits ? <IconArrowUp /> : <IconArrowDown />}
          </div>

          {showHabits && (
            <>
                {/* FORMULARIO */}
                <div style={{background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: editingId ? '2px solid var(--primary)' : 'var(--glass-border)'}}>
                    <h4 style={{color: 'white', marginTop:0, fontSize:'1.1rem', marginBottom:'15px'}}>{editingId ? "✏️ EDITAR PROTOCOLO" : "NUEVO PROTOCOLO"}</h4>
                    <div style={{display:'flex', gap:'10px', flexWrap:'wrap'}}>
                        <input type="text" value={tituloHabito} onChange={(e) => setTituloHabito(e.target.value)} placeholder="Descripción..." style={{flex:2, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white', padding:'10px', borderRadius:'8px'}} />
                        <select value={frecuenciaMeta} onChange={(e) => setFrecuenciaMeta(Number(e.target.value))} style={{flex:1, padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.2)'}}>
                            {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} día{n>1?'s':''}/sem</option>)}
                        </select>
                    </div>
                    <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                         {['vitalidad','sabiduria','vinculacion'].map(tipo => (
                             <button key={tipo} onClick={() => toggleRecompensa(tipo)} style={{flex:1, background: recompensas.includes(tipo) ? 'rgba(255,255,255,0.1)' : 'transparent', border: recompensas.includes(tipo) ? '1px solid white' : '1px solid gray', color:'white', padding:'8px', borderRadius:'8px', cursor:'pointer'}}>
                                 {/* @ts-ignore */}
                                 {STATS_CONFIG[tipo].label}
                             </button>
                         ))}
                    </div>
                    <div style={{display:'flex', gap:'10px', marginTop:'15px'}}>
                        <button onClick={guardarHabito} className="btn-primary" style={{flex:1}}>{editingId ? "GUARDAR" : "CREAR"}</button>
                        {editingId && <button onClick={cancelarEdicion} style={{background:'none', border:'1px solid #EF4444', color:'#EF4444', padding:'10px', borderRadius:'8px', cursor:'pointer'}}>CANCELAR</button>}
                    </div>
                </div>

                {/* LISTA HÁBITOS */}
                <div style={{display: 'grid', gap: '15px'}}>
                    {habitosPaciente.map(h => {
                        const diasLogrados = contarDias(h.registro);
                        const meta = h.frecuenciaMeta || 7;
                        const esArchivado = h.estado === 'archivado';
                        const inactivo = !tieneInteraccion(h) && !esArchivado;
                        const comentarios = h.comentariosSemana || {};
                        const diasConComentario = Object.keys(comentarios);

                        return (
                        <div key={h.id} style={{
                            background: esArchivado ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)', 
                            padding: '20px', borderRadius: '16px', border: esArchivado ? '1px dashed rgba(255,255,255,0.1)' : (inactivo ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.05)'), 
                            opacity: esArchivado ? 0.5 : 1, position:'relative',
                            boxShadow: inactivo ? '0 0 15px rgba(239, 68, 68, 0.2)' : 'none',
                            animation: inactivo ? 'pulseBorder 2s infinite' : 'none'
                        }}>
                            {inactivo && <div style={{position:'absolute', top:-10, right:20, background:'#EF4444', color:'white', fontSize:'0.7rem', padding:'2px 8px', borderRadius:'4px', fontWeight:'bold'}}>SIN ACTIVIDAD</div>}
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                                <div style={{flex: 1}}>
                                    <div style={{display:'flex', alignItems:'center', gap:'15px', marginBottom:'5px'}}>
                                        <strong style={{color:'white', fontSize:'1.2rem', textDecoration: esArchivado ? 'line-through' : 'none'}}>{h.titulo}</strong>
                                        <div style={{display:'flex', gap:'5px'}}>
                                            {h.recompensas?.map((r:string) => (
                                                // @ts-ignore
                                                <img key={r} src={STATS_CONFIG[r]?.icon} style={{width:'20px'}} />
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{fontSize:'0.9rem', color:'var(--text-muted)'}}>{diasLogrados}/{meta} Cumplidos</div>
                                    {diasConComentario.length > 0 && (
                                        <div style={{marginTop:'10px', background:'rgba(0,0,0,0.3)', padding:'10px', borderRadius:'8px'}}>
                                            <div style={{fontSize:'0.7rem', color:'var(--secondary)', marginBottom:'5px', textTransform:'uppercase'}}>📝 Bitácora:</div>
                                            {diasConComentario.map(dia => (<div key={dia} style={{fontSize:'0.85rem', color:'white', marginBottom:'3px'}}><span style={{color:'var(--text-muted)', fontWeight:'bold'}}>{dia}: </span><i>"{comentarios[dia]}"</i></div>))}
                                        </div>
                                    )}
                                </div>
                                <div style={{display:'flex', gap:'10px', marginLeft:'10px'}}>
                                    <button onClick={() => cargarParaEditar(h)} title="Editar" style={{background:'none', border:'1px solid var(--primary)', color:'var(--primary)', padding:'8px', borderRadius:'6px', cursor:'pointer'}}><IconEdit /></button>
                                    <button onClick={() => archivarHabito(h.id, h.estado)} title={esArchivado ? "Restaurar" : "Archivar"} style={{background:'none', border: esArchivado ? '1px solid white' : '1px solid var(--secondary)', color: esArchivado ? 'white' : 'var(--secondary)', padding:'8px', borderRadius:'6px', cursor:'pointer'}}>{esArchivado ? <IconRestore /> : <IconMedal />}</button>
                                    <button onClick={() => eliminarHabito(h.id)} title="Eliminar" style={{background:'none', border:'1px solid #EF4444', color:'#EF4444', padding:'8px', borderRadius:'6px', cursor:'pointer'}}><IconTrash /></button>
                                </div>
                            </div>
                        </div>
                        )
                    })}
                </div>
            </>
          )}
      </div>

      {/* ================= SECCIÓN DE MISIONES (QUESTS) ================= */}
      <div style={{marginBottom:'40px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', background:'var(--bg-card)', padding:'15px', borderRadius:'12px', cursor:'pointer'}} onClick={() => setShowQuests(!showQuests)}>
              <h3 style={{margin:0, fontFamily:'Rajdhani', color:'white', fontSize:'1.5rem'}}>MISIONES ESPECIALES ({misionesPaciente.length})</h3>
              {showQuests ? <IconArrowUp /> : <IconArrowDown />}
          </div>

          {showQuests && (
              <>
                {/* FORMULARIO QUEST */}
                <div style={{background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: '1px solid var(--secondary)'}}>
                    <h4 style={{color: 'var(--secondary)', marginTop:0, fontSize:'1.1rem', marginBottom:'15px'}}>⚔️ ASIGNAR NUEVA MISIÓN</h4>
                    
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginBottom:'15px'}}>
                         <input type="text" value={questTitulo} onChange={(e) => setQuestTitulo(e.target.value)} placeholder="Título de la misión..." style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white', padding:'10px', borderRadius:'8px'}} />
                         <input type="date" value={questFecha} onChange={(e) => setQuestFecha(e.target.value)} style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white', padding:'10px', borderRadius:'8px'}} />
                    </div>
                    <textarea value={questDesc} onChange={(e) => setQuestDesc(e.target.value)} placeholder="Descripción narrativa..." style={{width:'100%', height:'60px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white', padding:'10px', borderRadius:'8px', marginBottom:'15px', fontFamily:'inherit'}} />
                    
                    <div style={{marginBottom:'15px'}}>
                        <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                             <input type="text" value={newSubText} onChange={e => setNewSubText(e.target.value)} placeholder="Añadir sub-objetivo (paso a paso)..." style={{flex:1, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white', padding:'8px', borderRadius:'8px'}} />
                             <button onClick={addSubObjetivo} style={{background:'var(--secondary)', border:'none', padding:'0 15px', borderRadius:'8px', cursor:'pointer', color:'black', fontWeight:'bold'}}>+</button>
                        </div>
                        {questSubs.map(s => (
                            <div key={s.id} style={{display:'flex', justifyContent:'space-between', padding:'5px 10px', background:'rgba(255,255,255,0.05)', borderRadius:'5px', marginBottom:'5px', fontSize:'0.85rem'}}>
                                <span>• {s.texto}</span>
                                <span onClick={() => removeSubObjetivo(s.id)} style={{color:'#EF4444', cursor:'pointer'}}>x</span>
                            </div>
                        ))}
                    </div>

                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <select value={questDif} onChange={(e:any) => setQuestDif(e.target.value)} style={{padding:'10px', borderRadius:'8px', background:'black', color:'white', border:'1px solid gray'}}>
                            <option value="facil">Fácil (50 XP | 25 Gold)</option>
                            <option value="media">Media (150 XP | 75 Gold)</option>
                            <option value="dificil">Difícil (500 XP | 200 Gold | 1 Nexo)</option>
                        </select>
                        <button onClick={guardarQuest} className="btn-primary" style={{padding:'10px 30px'}}>ASIGNAR MISIÓN</button>
                    </div>
                </div>

                {/* LISTA DE MISIONES */}
                <div style={{display: 'grid', gap: '15px'}}>
                    {misionesPaciente.map(q => (
                        <div key={q.id} style={{background:'rgba(255,255,255,0.03)', padding:'20px', borderRadius:'16px', borderLeft:`4px solid ${q.dificultad === 'facil' ? '#10B981' : q.dificultad === 'media' ? '#F59E0B' : '#EF4444'}`, position:'relative'}}>
                            <div style={{display:'flex', justifyContent:'space-between'}}>
                                <h4 style={{margin:0, color:'white', fontSize:'1.1rem'}}>{q.titulo} <span style={{fontSize:'0.8rem', color:'var(--text-muted)', fontWeight:'normal'}}>({q.dificultad})</span></h4>
                                <button onClick={() => eliminarQuest(q.id)} style={{background:'none', border:'none', color:'#EF4444', cursor:'pointer'}}>🗑️</button>
                            </div>
                            <p style={{fontSize:'0.9rem', color:'var(--text-muted)', margin:'5px 0'}}>{q.descripcion}</p>
                            <div style={{marginTop:'10px', fontSize:'0.85rem'}}>
                                {q.subObjetivos.map((s:any) => (
                                    <div key={s.id} style={{color: s.completado ? '#10B981' : 'white'}}>
                                        {s.completado ? '☑' : '☐'} {s.texto}
                                    </div>
                                ))}
                            </div>
                            <div style={{marginTop:'10px', fontSize:'0.7rem', color: q.estado==='vencida' ? '#EF4444' : q.estado==='completada' ? '#10B981' : 'var(--text-muted)'}}>
                                ESTADO: {q.estado.toUpperCase()} | Vence: {q.fechaVencimiento}
                            </div>
                        </div>
                    ))}
                </div>
              </>
          )}
      </div>

    </div>
  );
}