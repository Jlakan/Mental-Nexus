import { useState, useEffect } from 'react';
import { doc, updateDoc, addDoc, deleteDoc, collection, query, orderBy, onSnapshot, increment } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { STATS_CONFIG, StatTipo, PERSONAJES, PersonajeTipo, obtenerEtapaActual, obtenerNivel } from '../game/GameAssets';

// --- ICONOS SVG ---
const IconDashboard = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const IconFile = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
const IconNotes = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>;
const IconTools = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const IconDownload = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const IconEdit = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const IconMedal = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>;
const IconTrash = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const IconArrowDown = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>;
const IconArrowUp = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"></polyline></svg>;

export function PanelPsicologo({ userData, userUid }: any) {
  const [pacientes, setPacientes] = useState<any[]>([]); 
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);
  const [busqueda, setBusqueda] = useState(""); 
  
  // TABS
  const [activeTab, setActiveTab] = useState<'tablero' | 'expediente' | 'notas' | 'gestion'>('tablero');

  // DATA
  const [datosLive, setDatosLive] = useState<any>(null);
  const [habitos, setHabitos] = useState<any[]>([]);
  const [misiones, setMisiones] = useState<any[]>([]);
  const [notasClinicas, setNotasClinicas] = useState<any[]>([]);

  // GESTIÓN
  const [showHabits, setShowHabits] = useState(true);
  const [showQuests, setShowQuests] = useState(false);
  
  // FORMULARIOS
  const [tituloHabito, setTituloHabito] = useState("");
  const [frecuenciaMeta, setFrecuenciaMeta] = useState(7);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [recompensas, setRecompensas] = useState<string[]>([]);
  
  const [questTitulo, setQuestTitulo] = useState("");
  const [questDesc, setQuestDesc] = useState("");
  const [questDif, setQuestDif] = useState<'facil'|'media'|'dificil'>('media');
  const [questFecha, setQuestFecha] = useState("");
  const [questSubs, setQuestSubs] = useState<{id:number, texto:string, completado:boolean}[]>([]);
  const [newSubText, setNewSubText] = useState("");

  const [perfilReal, setPerfilReal] = useState({
      nombreReal: "", telefono: "", fechaNacimiento: "", contactoEmergencia: "", diagnostico: "", medicacion: ""
  });
  const [nuevaNota, setNuevaNota] = useState("");
  const [selectedResource, setSelectedResource] = useState<any>(null);

  // 1. CARGA INICIAL
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users", userUid, "pacientes"), (s) => {
        setPacientes(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [userUid]);

  // 2. DETALLE PACIENTE
  useEffect(() => {
    if (!pacienteSeleccionado) return;
    
    const unsubPerfil = onSnapshot(doc(db, "users", userUid, "pacientes", pacienteSeleccionado.id), (s) => {
        if(s.exists()) {
            const data = s.data();
            setDatosLive({ id: s.id, ...data });
            setPerfilReal({
                nombreReal: data.nombreReal || "", telefono: data.telefono || "", fechaNacimiento: data.fechaNacimiento || "",
                contactoEmergencia: data.contactoEmergencia || "", diagnostico: data.diagnostico || "", medicacion: data.medicacion || ""
            });
        }
    });

    const unsubH = onSnapshot(collection(db, "users", userUid, "pacientes", pacienteSeleccionado.id, "habitos"), (s) => setHabitos(s.docs.map(d => ({id:d.id, ...d.data()}))));
    const unsubM = onSnapshot(collection(db, "users", userUid, "pacientes", pacienteSeleccionado.id, "misiones"), (s) => setMisiones(s.docs.map(d => ({id:d.id, ...d.data()}))));
    const qNotas = query(collection(db, "users", userUid, "pacientes", pacienteSeleccionado.id, "notas_clinicas"), orderBy("createdAt", "desc"));
    const unsubN = onSnapshot(qNotas, (s) => setNotasClinicas(s.docs.map(d => ({id:d.id, ...d.data()}))));

    return () => { unsubPerfil(); unsubH(); unsubM(); unsubN(); };
  }, [pacienteSeleccionado, userUid]);

  // --- ACTIONS ---
  const guardarExpediente = async () => {
      try { await updateDoc(doc(db, "users", userUid, "pacientes", pacienteSeleccionado.id), perfilReal); alert("Expediente actualizado."); } catch (e) { alert("Error."); }
  };
  
  const calcularEdad = (fecha: string) => {
      if(!fecha) return "--";
      const hoy = new Date(); const nac = new Date(fecha);
      let edad = hoy.getFullYear() - nac.getFullYear();
      if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) edad--;
      return edad + " años";
  };

  const guardarNota = async () => {
      if(!nuevaNota.trim()) return;
      await addDoc(collection(db, "users", userUid, "pacientes", pacienteSeleccionado.id, "notas_clinicas"), { contenido: nuevaNota, createdAt: new Date(), autor: userUid });
      setNuevaNota("");
  };

  const exportarHistorial = () => {
      const header = `EXPEDIENTE CLÍNICO: ${perfilReal.nombreReal || pacienteSeleccionado.displayName}\nID: ${pacienteSeleccionado.id}\nFECHA: ${new Date().toLocaleDateString()}\n--------------------------------------\n\n`;
      const body = notasClinicas.map((n: any) => `[${n.createdAt?.seconds ? new Date(n.createdAt.seconds * 1000).toLocaleString() : "S/F"}]\n${n.contenido}\n`).join("\n--------------------------------------\n");
      const element = document.createElement("a");
      const file = new Blob([header + body], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `Historia_${pacienteSeleccionado.displayName}.txt`;
      document.body.appendChild(element); element.click(); document.body.removeChild(element);
  };

  const toggleRecompensa = (t: string) => recompensas.includes(t) ? setRecompensas(recompensas.filter(r => r !== t)) : setRecompensas([...recompensas, t]);
  
  const guardarHabito = async () => {
    if (!tituloHabito) return;
    const datos = { titulo: tituloHabito, frecuenciaMeta: frecuenciaMeta, recompensas: recompensas.length > 0 ? recompensas : ['xp'] };
    const col = collection(db, "users", userUid, "pacientes", pacienteSeleccionado.id, "habitos");
    if (editingHabitId) await updateDoc(doc(col, editingHabitId), datos);
    else await addDoc(col, { ...datos, estado: 'activo', createdAt: new Date(), registro: { L: false, M: false, X: false, J: false, V: false, S: false, D: false } });
    setTituloHabito(""); setFrecuenciaMeta(7); setRecompensas([]); setEditingHabitId(null);
  };

  const addSub = () => { if(newSubText) { setQuestSubs([...questSubs, {id:Date.now(), texto:newSubText, completado:false}]); setNewSubText(""); }};
  const guardarQuest = async () => {
      if (!questTitulo) return alert("Faltan datos");
      await addDoc(collection(db, "users", userUid, "pacientes", pacienteSeleccionado.id, "misiones"), {
          titulo: questTitulo, descripcion: questDesc, dificultad: questDif, fechaVencimiento: questFecha, subObjetivos: questSubs, estado: 'activa', createdAt: new Date()
      });
      setQuestTitulo(""); setQuestDesc(""); setQuestSubs([]); setQuestFecha(""); alert("Misión enviada.");
  };

  const registrarAsistencia = async () => {
      if(!confirm("¿Registrar asistencia? (+1 NEXO)")) return;
      await updateDoc(doc(db, "users", userUid, "pacientes", pacienteSeleccionado.id), { nexo: increment(1), xp: increment(500) });
  };

  // --- VISTA 1: BUSCADOR DE PACIENTES (AUTOCOMPLETE) ---
  if (!pacienteSeleccionado) {
      // Filtrar solo si hay búsqueda
      const hayBusqueda = busqueda.trim().length > 0;
      const filtrados = hayBusqueda 
        ? pacientes.filter(p => p.displayName.toLowerCase().includes(busqueda.toLowerCase()))
        : [];

      return (
        <div style={{textAlign: 'left', maxWidth:'800px', margin:'0 auto'}}>
            {/* HEADER */}
            <div style={{background: 'var(--bg-card)', padding: '30px', borderRadius: '20px', marginBottom: '30px', border: 'var(--glass-border)', textAlign:'center', boxShadow:'0 10px 40px rgba(0,0,0,0.5)'}}>
                <img src="/psicologo.png" style={{width:'80px', height:'80px', borderRadius:'50%', border:'3px solid var(--primary)', objectFit:'cover', marginBottom:'15px'}} />
                <h3 style={{margin:0, color: 'var(--primary)', fontFamily:'Rajdhani', fontSize:'2rem', letterSpacing:'2px'}}>CENTRO DE MANDO</h3>
                <p style={{margin:'5px 0 0 0', color:'var(--text-muted)'}}>Código de Vinculación: <strong style={{color:'white', fontSize:'1.2rem'}}>{userData.codigoVinculacion}</strong></p>
            </div>

            {/* BUSCADOR HEROICO */}
            <div style={{position:'relative', marginBottom:'30px'}}>
                <input 
                    type="text" 
                    placeholder="Escribe el nombre del paciente para iniciar conexión..." 
                    value={busqueda} 
                    onChange={(e) => setBusqueda(e.target.value)} 
                    style={{
                        width:'100%', padding:'20px 20px 20px 50px', borderRadius:'15px', 
                        background:'rgba(30, 41, 59, 0.8)', border:'1px solid rgba(255,255,255,0.1)', 
                        color:'white', fontSize:'1.2rem', boxShadow:'0 4px 20px rgba(0,0,0,0.3)',
                        outline:'none'
                    }} 
                />
                <span style={{position:'absolute', left:'20px', top:'50%', transform:'translateY(-50%)', fontSize:'1.5rem'}}>🔍</span>
            </div>
            
            {/* RESULTADOS (SOLO SI HAY BÚSQUEDA) */}
            {hayBusqueda && (
                <div style={{display: 'grid', gap: '15px', animation:'fadeIn 0.3s'}}>
                    {filtrados.length === 0 ? <p style={{textAlign:'center', color:'gray'}}>No se encontraron expedientes.</p> : filtrados.map(p => {
                        const avatarDef = PERSONAJES[p.avatarKey as PersonajeTipo] || PERSONAJES['atlas'];
                        const etapa = avatarDef.etapas[0]; // Vista previa nivel 1
                        
                        return (
                            <div key={p.id} onClick={() => p.isAuthorized && setPacienteSeleccionado(p)} style={{
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
                                padding: '15px', borderRadius: '12px', cursor: p.isAuthorized ? 'pointer' : 'default', 
                                display:'flex', alignItems:'center', gap:'20px', transition:'transform 0.2s'
                            }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                                
                                {/* AVATAR CORREGIDO */}
                                <div style={{width:'60px', height:'60px', borderRadius:'50%', overflow:'hidden', background:'black', border:'2px solid var(--secondary)'}}>
                                    {etapa.imagen.endsWith('.mp4') ? (
                                        <video src={etapa.imagen} autoPlay loop muted playsInline style={{width:'100%', height:'100%', objectFit:'cover'}} />
                                    ) : (
                                        <img src={etapa.imagen} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                                    )}
                                </div>

                                <div>
                                    <div style={{fontWeight:'bold', color:'white', fontSize:'1.2rem'}}>{p.displayName}</div>
                                    <div style={{fontSize:'0.9rem', color:'var(--text-muted)'}}>{p.email}</div>
                                </div>
                                <div style={{marginLeft:'auto'}}>
                                    {p.isAuthorized ? 
                                        <span style={{color:'#10B981', background:'rgba(16, 185, 129, 0.1)', padding:'5px 10px', borderRadius:'5px', fontSize:'0.8rem', fontWeight:'bold'}}>CONECTADO</span> : 
                                        <button onClick={(e) => { e.stopPropagation(); updateDoc(doc(db, "users", userUid, "pacientes", p.id), { isAuthorized: true }); }} style={{padding:'8px 15px', background:'var(--primary)', border:'none', borderRadius:'5px', cursor:'pointer', fontWeight:'bold'}}>AUTORIZAR</button>
                                    }
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            
            {!hayBusqueda && (
                <div style={{textAlign:'center', marginTop:'50px', opacity:0.5}}>
                    <p>Esperando entrada de datos...</p>
                </div>
            )}
        </div>
      );
  }

  // --- VISTA 2: PANEL DE CONTROL ---
  const paciente = datosLive || pacienteSeleccionado;
  const avatarDef = PERSONAJES[paciente.avatarKey as PersonajeTipo] || PERSONAJES['atlas'];
  const nivel = obtenerNivel(paciente.xp || 0);
  const etapa = obtenerEtapaActual(avatarDef, nivel);

  return (
    <div style={{textAlign: 'left', animation: 'fadeIn 0.3s'}}>
       <button onClick={() => setPacienteSeleccionado(null)} style={{background:'none', border:'none', color:'var(--text-muted)', marginBottom:'20px', cursor:'pointer'}}>⬅ CERRAR SESIÓN DE PACIENTE</button>
       
       <div style={{background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', gap:'20px'}}>
           <div style={{width:'80px', height:'80px', borderRadius:'50%', overflow:'hidden', border:'2px solid var(--primary)'}}>
               {etapa.imagen.endsWith('.mp4') ? <video src={etapa.imagen} autoPlay loop muted playsInline style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <img src={etapa.imagen} style={{width:'100%', height:'100%', objectFit:'cover'}} />}
           </div>
           <div>
               <h1 style={{margin:0, fontFamily:'Rajdhani', color:'white'}}>{perfilReal.nombreReal || paciente.displayName}</h1>
               <div style={{color:'var(--primary)', fontSize:'0.9rem'}}>NIVEL {nivel} • {etapa.nombreClase}</div>
           </div>
           <div style={{marginLeft:'auto'}}><button onClick={registrarAsistencia} style={{background:'rgba(139, 92, 246, 0.2)', color:'#8B5CF6', border:'1px solid #8B5CF6', padding:'10px 20px', borderRadius:'8px', cursor:'pointer'}}>+ ASISTENCIA</button></div>
       </div>

       <div style={{display:'flex', gap:'10px', marginBottom:'20px', borderBottom:'1px solid rgba(255,255,255,0.1)', paddingBottom:'10px'}}>
           <button onClick={() => setActiveTab('tablero')} style={{padding:'10px 20px', background: activeTab === 'tablero' ? 'var(--primary)' : 'transparent', color: activeTab === 'tablero' ? 'black' : 'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', display:'flex', gap:'5px', alignItems:'center'}}><IconDashboard/> TABLERO</button>
           <button onClick={() => setActiveTab('expediente')} style={{padding:'10px 20px', background: activeTab === 'expediente' ? 'var(--secondary)' : 'transparent', color: activeTab === 'expediente' ? 'black' : 'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', display:'flex', gap:'5px', alignItems:'center'}}><IconFile/> EXPEDIENTE</button>
           <button onClick={() => setActiveTab('notas')} style={{padding:'10px 20px', background: activeTab === 'notas' ? '#8B5CF6' : 'transparent', color: activeTab === 'notas' ? 'white' : 'white', border: activeTab === 'notas' ? 'none' : '1px solid transparent', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', display:'flex', gap:'5px', alignItems:'center'}}><IconNotes/> NOTAS</button>
           <button onClick={() => setActiveTab('gestion')} style={{padding:'10px 20px', background: activeTab === 'gestion' ? '#F59E0B' : 'transparent', color: activeTab === 'gestion' ? 'black' : 'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', display:'flex', gap:'5px', alignItems:'center'}}><IconTools/> GESTIÓN</button>
       </div>

       {/* --- TABLERO (CON ICONOS REALES) --- */}
       {activeTab === 'tablero' && (
           <div style={{animation:'fadeIn 0.3s'}}>
               <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(100px, 1fr))', gap:'15px', marginBottom:'30px'}}>
                   <div style={{background:'rgba(255,255,255,0.05)', padding:'15px', borderRadius:'12px', textAlign:'center', border:'1px solid rgba(245, 158, 11, 0.3)'}}>
                        <img src={STATS_CONFIG.gold.icon} style={{width:'40px', height:'40px', marginBottom:'5px', objectFit:'contain'}} />
                        <div style={{fontSize:'1.5rem', fontWeight:'bold', color:'#F59E0B'}}>{paciente.gold || 0}</div>
                        <div style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>FONDOS</div>
                   </div>
                   <div style={{background:'rgba(255,255,255,0.05)', padding:'15px', borderRadius:'12px', textAlign:'center', border:'1px solid rgba(139, 92, 246, 0.3)'}}>
                        <img src={STATS_CONFIG.nexo.icon} style={{width:'40px', height:'40px', marginBottom:'5px', objectFit:'contain'}} />
                        <div style={{fontSize:'1.5rem', fontWeight:'bold', color:'#8B5CF6'}}>{paciente.nexo || 0}</div>
                        <div style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>NEXOS</div>
                   </div>
                   {['vitalidad','sabiduria','vinculacion'].map(stat => (
                       <div key={stat} style={{background:'rgba(255,255,255,0.05)', padding:'15px', borderRadius:'12px', textAlign:'center'}}>
                           {/* @ts-ignore */}
                           <img src={STATS_CONFIG[stat].icon} style={{width:'40px', height:'40px', marginBottom:'5px', objectFit:'contain'}} />
                           {/* @ts-ignore */}
                           <div style={{fontSize:'1.5rem', fontWeight:'bold', color:'white'}}>{Number(paciente.stats?.[stat] || 0).toFixed(1)}</div>
                           {/* @ts-ignore */}
                           <div style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>{STATS_CONFIG[stat].label}</div>
                       </div>
                   ))}
               </div>
               
               <h3 style={{marginTop:0, color:'white', fontFamily:'Rajdhani'}}>RESUMEN DE HOY</h3>
               <div style={{padding:'20px', background:'rgba(255,255,255,0.05)', borderRadius:'12px'}}>
                   <div style={{fontSize:'1.1rem', color:'white'}}>
                       Protocolos completados: <strong style={{color:'var(--primary)'}}>{habitos.filter(h => {
                           const today = new Date().getDay();
                           const dias = ["D","L","M","X","J","V","S"]; // Domingo es 0
                           const diaLetra = dias[today];
                           return h.registro?.[diaLetra] === true;
                       }).length}</strong> / {habitos.filter(h => h.estado !== 'archivado').length}
                   </div>
                   <div style={{fontSize:'0.9rem', color:'var(--text-muted)', marginTop:'5px'}}>Revisa la pestaña "GESTIÓN" para ver detalles.</div>
               </div>
           </div>
       )}

       {/* --- EXPEDIENTE --- */}
       {activeTab === 'expediente' && (
           <div style={{animation:'fadeIn 0.3s', maxWidth:'600px'}}>
               <h3 style={{color:'var(--secondary)', borderBottom:'1px solid var(--secondary)', paddingBottom:'10px', marginTop:0}}>DATOS PERSONALES (PRIVADO)</h3>
               <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'15px'}}>
                   <div><label style={{fontSize:'0.8rem', color:'gray'}}>Nombre Real</label><input type="text" value={perfilReal.nombreReal} onChange={e => setPerfilReal({...perfilReal, nombreReal: e.target.value})} style={{width:'100%', padding:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white', borderRadius:'8px'}} /></div>
                   <div><label style={{fontSize:'0.8rem', color:'gray'}}>Teléfono</label><input type="text" value={perfilReal.telefono} onChange={e => setPerfilReal({...perfilReal, telefono: e.target.value})} style={{width:'100%', padding:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white', borderRadius:'8px'}} /></div>
                   <div><label style={{fontSize:'0.8rem', color:'gray'}}>Fecha Nac. ({calcularEdad(perfilReal.fechaNacimiento)})</label><input type="date" value={perfilReal.fechaNacimiento} onChange={e => setPerfilReal({...perfilReal, fechaNacimiento: e.target.value})} style={{width:'100%', padding:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white', borderRadius:'8px'}} /></div>
                   <div><label style={{fontSize:'0.8rem', color:'#EF4444'}}>Contacto Emergencia</label><input type="text" value={perfilReal.contactoEmergencia} onChange={e => setPerfilReal({...perfilReal, contactoEmergencia: e.target.value})} style={{width:'100%', padding:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid #EF4444', color:'white', borderRadius:'8px'}} /></div>
               </div>
               <h3 style={{color:'var(--secondary)', borderBottom:'1px solid var(--secondary)', paddingBottom:'10px'}}>INFORMACIÓN CLÍNICA</h3>
               <div style={{marginBottom:'15px'}}><label style={{fontSize:'0.8rem', color:'gray'}}>Diagnóstico</label><input type="text" value={perfilReal.diagnostico} onChange={e => setPerfilReal({...perfilReal, diagnostico: e.target.value})} style={{width:'100%', padding:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white', borderRadius:'8px'}} /></div>
               <div style={{marginBottom:'20px'}}><label style={{fontSize:'0.8rem', color:'gray'}}>Medicación</label><textarea value={perfilReal.medicacion} onChange={e => setPerfilReal({...perfilReal, medicacion: e.target.value})} style={{width:'100%', height:'80px', padding:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white', borderRadius:'8px'}} /></div>
               <button onClick={guardarExpediente} className="btn-primary">GUARDAR CAMBIOS</button>
           </div>
       )}

       {/* --- NOTAS --- */}
       {activeTab === 'notas' && (
           <div style={{animation:'fadeIn 0.3s'}}>
               <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                   <h3 style={{margin:0, color:'white'}}>BITÁCORA DE SESIÓN</h3>
                   <button onClick={exportarHistorial} style={{background:'none', border:'1px solid white', color:'white', padding:'8px 15px', borderRadius:'8px', cursor:'pointer', fontSize:'0.8rem', display:'flex', gap:'5px', alignItems:'center'}}><IconDownload/> EXPORTAR TXT</button>
               </div>
               <div style={{display:'flex', gap:'10px', marginBottom:'30px'}}>
                   <textarea value={nuevaNota} onChange={e => setNuevaNota(e.target.value)} placeholder="Escribe nota de sesión..." style={{flex:1, height:'80px', padding:'15px', borderRadius:'10px', background:'rgba(0,0,0,0.3)', color:'white', border:'1px solid rgba(255,255,255,0.2)', fontFamily:'inherit'}} />
                   <button onClick={guardarNota} className="btn-primary" style={{width:'100px'}}>AGREGAR</button>
               </div>
               <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                   {notasClinicas.map(nota => (
                       <div key={nota.id} style={{background:'rgba(255,255,255,0.03)', padding:'20px', borderRadius:'12px', borderLeft:'4px solid #8B5CF6'}}>
                           <div style={{fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'5px'}}>{nota.createdAt?.seconds ? new Date(nota.createdAt.seconds * 1000).toLocaleString() : "Sin fecha"}</div>
                           <div style={{whiteSpace:'pre-wrap', lineHeight:'1.5', color:'white'}}>{nota.contenido}</div>
                       </div>
                   ))}
               </div>
           </div>
       )}

       {/* --- GESTIÓN --- */}
       {activeTab === 'gestion' && (
           <div style={{animation:'fadeIn 0.3s'}}>
               <div style={{marginBottom:'40px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', background:'var(--bg-card)', padding:'15px', borderRadius:'12px', cursor:'pointer'}} onClick={() => setShowHabits(!showHabits)}>
                      <h3 style={{margin:0, fontFamily:'Rajdhani', color:'white', fontSize:'1.5rem'}}>PROTOCOLOS DIARIOS ({habitos.length})</h3>
                      {showHabits ? <IconArrowUp /> : <IconArrowDown />}
                  </div>
                  {showHabits && (
                      <>
                        <div style={{background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: editingHabitId ? '2px solid var(--primary)' : 'var(--glass-border)'}}>
                            <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                                <input type="text" value={tituloHabito} onChange={(e) => setTituloHabito(e.target.value)} placeholder="Descripción..." style={{flex:2, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white', padding:'10px', borderRadius:'8px'}} />
                                <select value={frecuenciaMeta} onChange={(e) => setFrecuenciaMeta(Number(e.target.value))} style={{flex:1, padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.2)'}}>{[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} día/sem</option>)}</select>
                            </div>
                            <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                                {['vitalidad','sabiduria','vinculacion'].map(t => (
                                    <button key={t} onClick={() => toggleRecompensa(t)} style={{flex:1, padding:'8px', borderRadius:'8px', background: recompensas.includes(t)?'rgba(255,255,255,0.2)':'transparent', border: recompensas.includes(t)?'1px solid white':'1px solid gray', color:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px'}}>
                                        {/* @ts-ignore */}
                                        <img src={STATS_CONFIG[t].icon} width="20" height="20" />
                                        {/* @ts-ignore */}
                                        <span style={{fontSize:'0.8rem'}}>{STATS_CONFIG[t].label}</span>
                                    </button>
                                ))}
                            </div>
                            <div style={{marginTop:'15px', display:'flex', gap:'10px'}}>
                                <button onClick={guardarHabito} className="btn-primary" style={{flex:1}}>{editingHabitId ? "GUARDAR" : "CREAR"}</button>
                                {editingHabitId && <button onClick={() => { setEditingHabitId(null); setTituloHabito(""); setRecompensas([]); }} style={{background:'none', border:'1px solid #EF4444', color:'#EF4444', padding:'10px', borderRadius:'8px', cursor:'pointer'}}>CANCELAR</button>}
                            </div>
                        </div>
                        <div style={{display:'grid', gap:'10px'}}>
                            {habitos.map(h => (
                                <div key={h.id} style={{background:'rgba(255,255,255,0.03)', padding:'15px', borderRadius:'12px', border: h.estado==='archivado'?'1px dashed gray':'1px solid rgba(255,255,255,0.1)', opacity:h.estado==='archivado'?0.6:1, display:'flex', justifyContent:'space-between'}}>
                                    <div>
                                        <div style={{fontWeight:'bold', color:'white'}}>{h.titulo} <span style={{fontSize:'0.8rem', color:'gray'}}>({h.frecuenciaMeta}/sem)</span></div>
                                        {/* ICONOS DE RECOMPENSAS RECUPERADOS */}
                                        <div style={{display:'flex', gap:'5px', marginTop:'5px'}}>
                                            {h.recompensas?.map((r: string) => (
                                                // @ts-ignore
                                                <img key={r} src={STATS_CONFIG[r]?.icon} title={STATS_CONFIG[r]?.label} style={{width:'20px', height:'20px', objectFit:'contain'}} />
                                            ))}
                                        </div>
                                        {h.comentariosSemana && Object.keys(h.comentariosSemana).length > 0 && <div style={{fontSize:'0.8rem', color:'var(--secondary)', marginTop:'5px'}}>📝 {Object.keys(h.comentariosSemana).length} notas</div>}
                                    </div>
                                    <div style={{display:'flex', gap:'10px'}}>
                                        <button onClick={() => { setTituloHabito(h.titulo); setFrecuenciaMeta(h.frecuenciaMeta); setRecompensas(h.recompensas||[]); setEditingHabitId(h.id); }} style={{background:'none', border:'none', color:'var(--primary)', cursor:'pointer'}}><IconEdit/></button>
                                        <button onClick={async() => await updateDoc(doc(db,"users",userUid,"pacientes",pacienteSeleccionado.id,"habitos",h.id),{estado: h.estado==='activo'?'archivado':'activo'})} style={{background:'none', border:'none', color:'white', cursor:'pointer'}}><IconMedal/></button>
                                        <button onClick={async() => { if(confirm("¿Eliminar?")) await deleteDoc(doc(db,"users",userUid,"pacientes",pacienteSeleccionado.id,"habitos",h.id)); }} style={{background:'none', border:'none', color:'#EF4444', cursor:'pointer'}}><IconTrash/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                      </>
                  )}
               </div>

               <div style={{marginBottom:'40px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', background:'var(--bg-card)', padding:'15px', borderRadius:'12px', cursor:'pointer'}} onClick={() => setShowQuests(!showQuests)}>
                      <h3 style={{margin:0, fontFamily:'Rajdhani', color:'white', fontSize:'1.5rem'}}>MISIONES ESPECIALES ({misiones.length})</h3>
                      {showQuests ? <IconArrowUp /> : <IconArrowDown />}
                  </div>
                  {showQuests && (
                      <>
                        <div style={{background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: '1px solid var(--secondary)'}}>
                             <h4 style={{color: 'var(--secondary)', marginTop:0, fontSize:'1.1rem', marginBottom:'15px'}}>⚔️ NUEVA MISIÓN</h4>
                             <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px'}}>
                                 <input type="text" value={questTitulo} onChange={e => setQuestTitulo(e.target.value)} placeholder="Título..." style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white', padding:'10px', borderRadius:'8px'}} />
                                 <input type="date" value={questFecha} onChange={e => setQuestFecha(e.target.value)} style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white', padding:'10px', borderRadius:'8px'}} />
                             </div>
                             <textarea value={questDesc} onChange={e => setQuestDesc(e.target.value)} placeholder="Descripción..." style={{width:'100%', height:'60px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white', padding:'10px', borderRadius:'8px', fontFamily:'inherit', marginBottom:'10px'}} />
                             <div style={{marginBottom:'10px'}}>
                                 <div style={{display:'flex', gap:'10px'}}>
                                     <input type="text" value={newSubText} onChange={e => setNewSubText(e.target.value)} placeholder="Sub-objetivo..." style={{flex:1, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white', padding:'8px', borderRadius:'8px'}} />
                                     <button onClick={addSub} style={{background:'var(--secondary)', border:'none', padding:'0 15px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold'}}>+</button>
                                 </div>
                                 {questSubs.map(s => <div key={s.id} style={{fontSize:'0.8rem', color:'gray', marginTop:'5px'}}>• {s.texto} <span onClick={() => setQuestSubs(questSubs.filter(x=>x.id!==s.id))} style={{color:'#EF4444', cursor:'pointer', marginLeft:'5px'}}>x</span></div>)}
                             </div>
                             <div style={{display:'flex', justifyContent:'space-between'}}>
                                 <select value={questDif} onChange={(e:any) => setQuestDif(e.target.value)} style={{background:'black', color:'white', padding:'10px', borderRadius:'8px'}}><option value="facil">Fácil</option><option value="media">Media</option><option value="dificil">Difícil</option></select>
                                 <button onClick={guardarQuest} className="btn-primary">ASIGNAR</button>
                             </div>
                        </div>
                        <div style={{display:'grid', gap:'10px'}}>
                            {misiones.map(q => (
                                <div key={q.id} style={{background:'rgba(255,255,255,0.03)', padding:'15px', borderRadius:'12px', borderLeft:`4px solid ${q.dificultad==='facil'?'#10B981':q.dificultad==='media'?'#F59E0B':'#EF4444'}`, display:'flex', justifyContent:'space-between'}}>
                                    <div><div style={{color:'white', fontWeight:'bold'}}>{q.titulo}</div><div style={{fontSize:'0.8rem', color:'gray'}}>{q.estado.toUpperCase()} | Vence: {q.fechaVencimiento}</div></div>
                                    <button onClick={async() => { if(confirm("¿Eliminar?")) await deleteDoc(doc(db,"users",userUid,"pacientes",pacienteSeleccionado.id,"misiones",q.id)); }} style={{background:'none', border:'none', color:'#EF4444', cursor:'pointer'}}><IconTrash/></button>
                                </div>
                            ))}
                        </div>
                      </>
                  )}
               </div>
           </div>
       )}
    </div>
  );
}