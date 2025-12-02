import { useState, useEffect } from 'react';
import { doc, updateDoc, addDoc, deleteDoc, collection, query, orderBy, onSnapshot, increment } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { STATS_CONFIG, StatTipo, PERSONAJES, PersonajeTipo, obtenerEtapaActual, obtenerNivel } from '../game/GameAssets';

// --- ICONOS DE NAVEGACIÓN (TABS) ---
const IconDashboard = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const IconFile = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
const IconNotes = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>;
const IconTools = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const IconDownload = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;

// --- ICONOS DE UTILIDAD (GESTIÓN) ---
const IconEdit = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const IconMedal = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>;
const IconTrash = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const IconArrowDown = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>;
const IconArrowUp = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"></polyline></svg>;

export function PanelPsicologo({ userData, userUid }: any) {
  const [pacientes, setPacientes] = useState<any[]>([]); 
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);
  
  // PESTAÑA ACTIVA
  const [activeTab, setActiveTab] = useState<'tablero' | 'expediente' | 'notas' | 'gestion'>('tablero');

  // DATOS VIVOS
  const [datosLive, setDatosLive] = useState<any>(null);
  const [habitos, setHabitos] = useState<any[]>([]);
  const [misiones, setMisiones] = useState<any[]>([]);
  const [notasClinicas, setNotasClinicas] = useState<any[]>([]);

  // FORMULARIOS DE JUEGO
  const [showHabits, setShowHabits] = useState(true);
  const [showQuests, setShowQuests] = useState(false);
  
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

  // FORMULARIO DE EXPEDIENTE & NOTAS
  const [perfilReal, setPerfilReal] = useState({
      nombreReal: "", telefono: "", fechaNacimiento: "", contactoEmergencia: "", diagnostico: "", medicacion: ""
  });
  const [nuevaNota, setNuevaNota] = useState("");
  const [busqueda, setBusqueda] = useState(""); 
  const [selectedResource, setSelectedResource] = useState<any>(null);

  // 1. CARGA INICIAL
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users", userUid, "pacientes"), (s) => {
        setPacientes(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [userUid]);

  // 2. CARGA DE DATOS DEL PACIENTE
  useEffect(() => {
    if (!pacienteSeleccionado) return;
    
    // A) Perfil y Expediente
    const unsubPerfil = onSnapshot(doc(db, "users", userUid, "pacientes", pacienteSeleccionado.id), (s) => {
        if(s.exists()) {
            const data = s.data();
            setDatosLive({ id: s.id, ...data });
            setPerfilReal({
                nombreReal: data.nombreReal || "",
                telefono: data.telefono || "",
                fechaNacimiento: data.fechaNacimiento || "",
                contactoEmergencia: data.contactoEmergencia || "",
                diagnostico: data.diagnostico || "",
                medicacion: data.medicacion || ""
            });
        }
    });

    // B) Colecciones del Juego
    const unsubH = onSnapshot(collection(db, "users", userUid, "pacientes", pacienteSeleccionado.id, "habitos"), (s) => setHabitos(s.docs.map(d => ({id:d.id, ...d.data()}))));
    const unsubM = onSnapshot(collection(db, "users", userUid, "pacientes", pacienteSeleccionado.id, "misiones"), (s) => setMisiones(s.docs.map(d => ({id:d.id, ...d.data()}))));
    
    // C) Sub-colección NOTAS CLÍNICAS (Ordenada por fecha)
    const qNotas = query(collection(db, "users", userUid, "pacientes", pacienteSeleccionado.id, "notas_clinicas"), orderBy("createdAt", "desc"));
    const unsubN = onSnapshot(qNotas, (s) => setNotasClinicas(s.docs.map(d => ({id:d.id, ...d.data()}))));

    return () => { unsubPerfil(); unsubH(); unsubM(); unsubN(); };
  }, [pacienteSeleccionado, userUid]);


  // --- FUNCIONES: EXPEDIENTE ---
  const guardarExpediente = async () => {
      try {
          await updateDoc(doc(db, "users", userUid, "pacientes", pacienteSeleccionado.id), perfilReal);
          alert("Datos del expediente actualizados.");
      } catch (e) { alert("Error al guardar."); }
  };
  
  const calcularEdad = (fecha: string) => {
      if(!fecha) return "--";
      const hoy = new Date();
      const nac = new Date(fecha);
      let edad = hoy.getFullYear() - nac.getFullYear();
      const m = hoy.getMonth() - nac.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
      return edad + " años";
  };

  // --- FUNCIONES: NOTAS CLÍNICAS ---
  const guardarNota = async () => {
      if(!nuevaNota.trim()) return;
      try {
          await addDoc(collection(db, "users", userUid, "pacientes", pacienteSeleccionado.id, "notas_clinicas"), {
              contenido: nuevaNota,
              createdAt: new Date(),
              autor: userUid
          });
          setNuevaNota("");
      } catch (e) { console.error(e); }
  };

  const exportarHistorial = () => {
      const header = `EXPEDIENTE CLÍNICO: ${perfilReal.nombreReal || pacienteSeleccionado.displayName}\nID: ${pacienteSeleccionado.id}\nFECHA REPORTE: ${new Date().toLocaleDateString()}\n--------------------------------------\n\n`;
      const body = notasClinicas.map((n: any) => {
          const fecha = n.createdAt?.seconds ? new Date(n.createdAt.seconds * 1000).toLocaleString() : "Fecha desconocida";
          return `[${fecha}]\n${n.contenido}\n`;
      }).join("\n--------------------------------------\n");
      
      const element = document.createElement("a");
      const file = new Blob([header + body], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `HistoriaClinica_${pacienteSeleccionado.displayName}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
  };

  // --- FUNCIONES: JUEGO (MISIONES/HABITOS) ---
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
      if (!questTitulo || !questDesc || !questFecha) return alert("Faltan datos");
      await addDoc(collection(db, "users", userUid, "pacientes", pacienteSeleccionado.id, "misiones"), {
          titulo: questTitulo, descripcion: questDesc, dificultad: questDif, fechaVencimiento: questFecha, subObjetivos: questSubs, estado: 'activa', createdAt: new Date()
      });
      setQuestTitulo(""); setQuestDesc(""); setQuestSubs([]); setQuestFecha("");
      alert("Misión enviada.");
  };

  const registrarAsistencia = async () => {
      if(!confirm("¿Registrar asistencia? (+1 NEXO)")) return;
      await updateDoc(doc(db, "users", userUid, "pacientes", pacienteSeleccionado.id), { nexo: increment(1), xp: increment(500) });
  };

  // --- RENDERIZADO ---

  // VISTA 1: LISTA PACIENTES
  if (!pacienteSeleccionado) {
      const filtrados = pacientes.filter(p => p.displayName.toLowerCase().includes(busqueda.toLowerCase()));
      return (
        <div style={{textAlign: 'left'}}>
            <div style={{background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', marginBottom: '30px', border: 'var(--glass-border)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                    <img src="/psicologo.png" style={{width:'60px', height:'60px', borderRadius:'50%', border:'2px solid var(--primary)', objectFit:'cover'}} />
                    <div><h3 style={{margin:0, color: 'var(--primary)', fontSize:'1.5rem'}}>PANEL CLÍNICO</h3><p style={{margin:0, fontSize:'0.9rem', color:'var(--text-muted)'}}>Código: <strong>{userData.codigoVinculacion}</strong></p></div>
                </div>
            </div>
            <input type="text" placeholder="Buscar paciente..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{width:'100%', padding:'15px', borderRadius:'10px', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'white', marginBottom:'20px'}} />
            
            <div style={{display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'}}>
                {filtrados.map(p => {
                     const avatarData = p.avatarKey ? PERSONAJES[p.avatarKey as PersonajeTipo]?.etapas[0] : null;
                     return (
                        <div key={p.id} onClick={() => p.isAuthorized && setPacienteSeleccionado(p)} style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: '16px', cursor: p.isAuthorized ? 'pointer' : 'default', display:'flex', alignItems:'center', gap:'15px'}}>
                            <div style={{width:'50px', height:'50px', borderRadius:'50%', overflow:'hidden', background:'black'}}>
                                {avatarData ? <img src={avatarData.imagen.endsWith('mp4') ? "/logo.jpg" : avatarData.imagen} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <div style={{width:'100%', height:'100%', display:'flex', justifyContent:'center', alignItems:'center'}}>👤</div>}
                            </div>
                            <div>
                                <div style={{fontWeight:'bold', color:'white'}}>{p.displayName}</div>
                                <div style={{fontSize:'0.8rem', color: p.isAuthorized ? '#10B981' : '#EF4444'}}>{p.isAuthorized ? 'ACTIVO' : 'PENDIENTE'}</div>
                            </div>
                            {!p.isAuthorized && <button onClick={(e) => { e.stopPropagation(); updateDoc(doc(db, "users", userUid, "pacientes", p.id), { isAuthorized: true }); }} style={{marginLeft:'auto', padding:'5px 10px', background:'var(--primary)', border:'none', borderRadius:'5px', cursor:'pointer'}}>AUTORIZAR</button>}
                        </div>
                     );
                })}
            </div>
        </div>
      );
  }

  // VISTA 2: DETALLE PACIENTE
  const paciente = datosLive || pacienteSeleccionado;
  const avatarDef = PERSONAJES[paciente.avatarKey as PersonajeTipo] || PERSONAJES['atlas'];
  const nivel = obtenerNivel(paciente.xp || 0);
  const etapa = obtenerEtapaActual(avatarDef, nivel);

  return (
    <div style={{textAlign: 'left', animation: 'fadeIn 0.3s'}}>
       <button onClick={() => setPacienteSeleccionado(null)} style={{background:'none', border:'none', color:'var(--text-muted)', marginBottom:'20px', cursor:'pointer'}}>⬅ VOLVER</button>
       
       {/* HEADER FICHA */}
       <div style={{background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', gap:'20px'}}>
           <div style={{width:'80px', height:'80px', borderRadius:'50%', overflow:'hidden', border:'2px solid var(--primary)'}}>
               {etapa.imagen.endsWith('.mp4') ? <video src={etapa.imagen} autoPlay loop muted playsInline style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <img src={etapa.imagen} style={{width:'100%', height:'100%', objectFit:'cover'}} />}
           </div>
           <div>
               <h1 style={{margin:0, fontFamily:'Rajdhani', color:'white'}}>{perfilReal.nombreReal || paciente.displayName}</h1>
               <div style={{color:'var(--primary)', fontSize:'0.9rem'}}>NIVEL {nivel} • {etapa.nombreClase}</div>
           </div>
           <div style={{marginLeft:'auto', display:'flex', gap:'10px'}}>
               <button onClick={registrarAsistencia} style={{background:'rgba(139, 92, 246, 0.2)', color:'#8B5CF6', border:'1px solid #8B5CF6', padding:'10px 20px', borderRadius:'8px', cursor:'pointer'}}>+ ASISTENCIA</button>
           </div>
       </div>

       {/* BARRA DE PESTAÑAS (TABS) */}
       <div style={{display:'flex', gap:'10px', marginBottom:'20px', borderBottom:'1px solid rgba(255,255,255,0.1)', paddingBottom:'10px'}}>
           <button onClick={() => setActiveTab('tablero')} style={{padding:'10px 20px', background: activeTab === 'tablero' ? 'var(--primary)' : 'transparent', color: activeTab === 'tablero' ? 'black' : 'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', display:'flex', gap:'5px', alignItems:'center'}}><IconDashboard/> TABLERO</button>
           <button onClick={() => setActiveTab('expediente')} style={{padding:'10px 20px', background: activeTab === 'expediente' ? 'var(--secondary)' : 'transparent', color: activeTab === 'expediente' ? 'black' : 'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', display:'flex', gap:'5px', alignItems:'center'}}><IconFile/> EXPEDIENTE</button>
           <button onClick={() => setActiveTab('notas')} style={{padding:'10px 20px', background: activeTab === 'notas' ? '#8B5CF6' : 'transparent', color: activeTab === 'notas' ? 'white' : 'white', border: activeTab === 'notas' ? 'none' : '1px solid transparent', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', display:'flex', gap:'5px', alignItems:'center'}}><IconNotes/> NOTAS</button>
           <button onClick={() => setActiveTab('gestion')} style={{padding:'10px 20px', background: activeTab === 'gestion' ? '#F59E0B' : 'transparent', color: activeTab === 'gestion' ? 'black' : 'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', display:'flex', gap:'5px', alignItems:'center'}}><IconTools/> GESTIÓN</button>
       </div>

       {/* CONTENIDO DE PESTAÑAS */}
       
       {/* 1. TABLERO */}
       {activeTab === 'tablero' && (
           <div style={{animation:'fadeIn 0.3s'}}>
               <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(100px, 1fr))', gap:'15px', marginBottom:'30px'}}>
                   <div style={{background:'rgba(255,255,255,0.05)', padding:'15px', borderRadius:'12px', textAlign:'center', border:'1px solid rgba(245, 158, 11, 0.3)'}}>
                        <div style={{fontSize:'1.5rem', fontWeight:'bold', color:'#F59E0B'}}>{paciente.gold || 0}</div>
                        <div style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>FONDOS</div>
                   </div>
                   <div style={{background:'rgba(255,255,255,0.05)', padding:'15px', borderRadius:'12px', textAlign:'center', border:'1px solid rgba(139, 92, 246, 0.3)'}}>
                        <div style={{fontSize:'1.5rem', fontWeight:'bold', color:'#8B5CF6'}}>{paciente.nexo || 0}</div>
                        <div style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>NEXOS</div>
                   </div>
                   {['vitalidad','sabiduria','vinculacion'].map(stat => (
                       <div key={stat} style={{background:'rgba(255,255,255,0.05)', padding:'15px', borderRadius:'12px', textAlign:'center'}}>
                           {/* @ts-ignore */}
                           <div style={{fontSize:'1.5rem', fontWeight:'bold', color:'white'}}>{Number(paciente.stats?.[stat] || 0).toFixed(1)}</div>
                           {/* @ts-ignore */}
                           <div style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>{STATS_CONFIG[stat].label}</div>
                       </div>
                   ))}
               </div>
               
               {/* BALANCE */}
               {(() => {
                   const activos = habitos.filter(h => h.estado !== 'archivado');
                   const hasVit = activos.some(h => h.recompensas?.includes('vitalidad'));
                   const hasSab = activos.some(h => h.recompensas?.includes('sabiduria'));
                   const hasVinc = activos.some(h => h.recompensas?.includes('vinculacion'));
                   if (activos.length > 0 && (!hasVit || !hasSab || !hasVinc)) {
                       return <div style={{background:'rgba(245,158,11,0.1)', border:'1px solid #F59E0B', color:'#F59E0B', padding:'15px', borderRadius:'12px'}}>⚠️ <strong>Balance:</strong> El paciente necesita protocolos variados para cubrir todos los atributos.</div>
                   }
                   return null;
               })()}
           </div>
       )}

       {/* 2. EXPEDIENTE */}
       {activeTab === 'expediente' && (
           <div style={{animation:'fadeIn 0.3s', maxWidth:'600px'}}>
               <h3 style={{color:'var(--secondary)', borderBottom:'1px solid var(--secondary)', paddingBottom:'10px', marginTop:0}}>DATOS PERSONALES (PRIVADO)</h3>
               <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'15px'}}>
                   <div>
                       <label style={{display:'block', fontSize:'0.8rem', color:'gray', marginBottom:'5px'}}>Nombre Real</label>
                       <input type="text" value={perfilReal.nombreReal} onChange={e => setPerfilReal({...perfilReal, nombreReal: e.target.value})} style={{width:'100%', padding:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white', borderRadius:'8px'}} />
                   </div>
                   <div>
                       <label style={{display:'block', fontSize:'0.8rem', color:'gray', marginBottom:'5px'}}>Teléfono (WhatsApp)</label>
                       <input type="text" value={perfilReal.telefono} onChange={e => setPerfilReal({...perfilReal, telefono: e.target.value})} style={{width:'100%', padding:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white', borderRadius:'8px'}} />
                   </div>
                   <div>
                       <label style={{display:'block', fontSize:'0.8rem', color:'gray', marginBottom:'5px'}}>Fecha Nacimiento ({calcularEdad(perfilReal.fechaNacimiento)})</label>
                       <input type="date" value={perfilReal.fechaNacimiento} onChange={e => setPerfilReal({...perfilReal, fechaNacimiento: e.target.value})} style={{width:'100%', padding:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white', borderRadius:'8px'}} />
                   </div>
                   <div>
                       <label style={{display:'block', fontSize:'0.8rem', color:'#EF4444', marginBottom:'5px'}}>Contacto Emergencia</label>
                       <input type="text" value={perfilReal.contactoEmergencia} onChange={e => setPerfilReal({...perfilReal, contactoEmergencia: e.target.value})} style={{width:'100%', padding:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid #EF4444', color:'white', borderRadius:'8px'}} />
                   </div>
               </div>
               
               <h3 style={{color:'var(--secondary)', borderBottom:'1px solid var(--secondary)', paddingBottom:'10px'}}>INFORMACIÓN CLÍNICA</h3>
               <div style={{marginBottom:'15px'}}>
                   <label style={{display:'block', fontSize:'0.8rem', color:'gray', marginBottom:'5px'}}>Diagnóstico / Foco</label>
                   <input type="text" value={perfilReal.diagnostico} onChange={e => setPerfilReal({...perfilReal, diagnostico: e.target.value})} style={{width:'100%', padding:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white', borderRadius:'8px'}} />
               </div>
               <div style={{marginBottom:'20px'}}>
                   <label style={{display:'block', fontSize:'0.8rem', color:'gray', marginBottom:'5px'}}>Medicación Actual</label>
                   <textarea value={perfilReal.medicacion} onChange={e => setPerfilReal({...perfilReal, medicacion: e.target.value})} style={{width:'100%', height:'80px', padding:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white', borderRadius:'8px'}} />
               </div>
               <button onClick={guardarExpediente} className="btn-primary">GUARDAR CAMBIOS</button>
           </div>
       )}

       {/* 3. NOTAS */}
       {activeTab === 'notas' && (
           <div style={{animation:'fadeIn 0.3s'}}>
               <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                   <h3 style={{margin:0, color:'white'}}>BITÁCORA DE SESIÓN</h3>
                   <button onClick={exportarHistorial} style={{background:'none', border:'1px solid white', color:'white', padding:'8px 15px', borderRadius:'8px', cursor:'pointer', fontSize:'0.8rem', display:'flex', gap:'5px', alignItems:'center'}}><IconDownload/> EXPORTAR TXT</button>
               </div>
               
               <div style={{display:'flex', gap:'10px', marginBottom:'30px'}}>
                   <textarea value={nuevaNota} onChange={e => setNuevaNota(e.target.value)} placeholder="Escribe una nueva nota de sesión o evolución..." style={{flex:1, height:'80px', padding:'15px', borderRadius:'10px', background:'rgba(0,0,0,0.3)', color:'white', border:'1px solid rgba(255,255,255,0.2)', fontFamily:'inherit'}} />
                   <button onClick={guardarNota} className="btn-primary" style={{width:'100px'}}>AGREGAR</button>
               </div>

               <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                   {notasClinicas.length === 0 && <p style={{color:'gray', fontStyle:'italic'}}>No hay notas registradas.</p>}
                   {notasClinicas.map(nota => (
                       <div key={nota.id} style={{background:'rgba(255,255,255,0.03)', padding:'20px', borderRadius:'12px', borderLeft:'4px solid #8B5CF6'}}>
                           <div style={{fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'5px'}}>{nota.createdAt?.seconds ? new Date(nota.createdAt.seconds * 1000).toLocaleString() : "Sin fecha"}</div>
                           <div style={{whiteSpace:'pre-wrap', lineHeight:'1.5', color:'white'}}>{nota.contenido}</div>
                       </div>
                   ))}
               </div>
           </div>
       )}

       {/* 4. GESTIÓN (LO ANTERIOR) */}
       {activeTab === 'gestion' && (
           <div style={{animation:'fadeIn 0.3s'}}>
               {/* HÁBITOS */}
               <div style={{marginBottom:'40px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', background:'var(--bg-card)', padding:'15px', borderRadius:'12px', cursor:'pointer'}} onClick={() => setShowHabits(!showHabits)}>
                      <h3 style={{margin:0, fontFamily:'Rajdhani', color:'white', fontSize:'1.5rem'}}>PROTOCOLOS DIARIOS ({habitos.length})</h3>
                      {showHabits ? <IconArrowUp /> : <IconArrowDown />}
                  </div>
                  {showHabits && (
                      <>
                        <div style={{background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: editingHabitId ? '2px solid var(--primary)' : 'var(--glass-border)'}}>
                            <h4 style={{color: 'white', marginTop:0, fontSize:'1.1rem', marginBottom:'15px'}}>{editingHabitId ? "✏️ EDITAR PROTOCOLO" : "NUEVO PROTOCOLO"}</h4>
                            <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                                <input type="text" value={tituloHabito} onChange={(e) => setTituloHabito(e.target.value)} placeholder="Descripción..." style={{flex:2, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white', padding:'10px', borderRadius:'8px'}} />
                                <select value={frecuenciaMeta} onChange={(e) => setFrecuenciaMeta(Number(e.target.value))} style={{flex:1, padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.2)'}}>{[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} día/sem</option>)}</select>
                            </div>
                            <div style={{display:'flex', gap:'10px'}}>
                                {['vitalidad','sabiduria','vinculacion'].map(t => <button key={t} onClick={() => toggleRecompensa(t)} style={{flex:1, padding:'8px', borderRadius:'8px', background: recompensas.includes(t)?'rgba(255,255,255,0.2)':'transparent', border:'1px solid gray', color:'white', cursor:'pointer'}}>{t.toUpperCase()}</button>)}
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
                                        {/* BITÁCORA PREVIEW */}
                                        {h.comentariosSemana && Object.keys(h.comentariosSemana).length > 0 && <div style={{fontSize:'0.8rem', color:'var(--secondary)', marginTop:'5px'}}>📝 {Object.keys(h.comentariosSemana).length} notas recientes</div>}
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

               {/* MISIONES */}
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