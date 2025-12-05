import { useState, useEffect } from 'react';
import { doc, updateDoc, addDoc, deleteDoc, collection, query, orderBy, onSnapshot, increment, arrayRemove } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { STATS_CONFIG, StatTipo, PERSONAJES, PersonajeTipo, obtenerEtapaActual, obtenerNivel } from '../game/GameAssets';

// --- IMPORTACIÓN DE MÓDULOS DE PRUEBAS ---
import { ClinicalTestsScreen } from './ClinicalTestsScreen'; // El test DIVA real
import { TestCatalog } from './TestCatalog'; // El catálogo de selección

// --- ICONOS ---
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
const IconLeft = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>;
const IconRight = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>;

export function PanelPsicologo({ userData, userUid }: any) {
  const [pacientes, setPacientes] = useState<any[]>([]); 
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);
  const [busqueda, setBusqueda] = useState(""); 
  const [activeTab, setActiveTab] = useState<'tablero' | 'expediente' | 'notas' | 'gestion'>('tablero');

  // DATA
  const [datosLive, setDatosLive] = useState<any>(null);
  const [habitos, setHabitos] = useState<any[]>([]);
  const [misiones, setMisiones] = useState<any[]>([]);
  const [notasClinicas, setNotasClinicas] = useState<any[]>([]);
  const [reflexionesObjetivo, setReflexionesObjetivo] = useState<any[]>([]);

  // NOTAS NAVEGACIÓN
  const [indiceNota, setIndiceNota] = useState(0); 
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // UI GESTION
  const [showHabits, setShowHabits] = useState(true);
  const [showQuests, setShowQuests] = useState(false);
  
  // --- NAVEGACIÓN DE PRUEBAS CLÍNICAS ---
  // Estados posibles: 'panel' (normal) | 'catalog' (menú) | 'diva5' (ejecutando)
  const [currentView, setCurrentView] = useState<'panel' | 'catalog' | 'diva5'>('panel');

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
  
  // FUNCIÓN PARA OBTENER FECHA LOCAL SEGURA (HOY)
  const getHoyLocal = () => {
      const d = new Date();
      return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  };
  
  const [fechaNota, setFechaNota] = useState(getHoyLocal()); 
  const [selectedResource, setSelectedResource] = useState<any>(null);

  // CARGA DATOS
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users", userUid, "pacientes"), (s) => setPacientes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [userUid]);

  useEffect(() => {
    if (!pacienteSeleccionado) return;
    const unsubP = onSnapshot(doc(db, "users", userUid, "pacientes", pacienteSeleccionado.id), (s) => {
        if(s.exists()) { setDatosLive({id:s.id, ...s.data()}); setPerfilReal({...perfilReal, ...s.data()}); }
    });
    const unsubH = onSnapshot(collection(db, "users", userUid, "pacientes", pacienteSeleccionado.id, "habitos"), (s) => setHabitos(s.docs.map(d => ({id:d.id, ...d.data()}))));
    const unsubM = onSnapshot(collection(db, "users", userUid, "pacientes", pacienteSeleccionado.id, "misiones"), (s) => setMisiones(s.docs.map(d => ({id:d.id, ...d.data()}))));
    const qNotas = query(collection(db, "users", userUid, "pacientes", pacienteSeleccionado.id, "notas_clinicas"), orderBy("createdAt", "desc"));
    const unsubN = onSnapshot(qNotas, (s) => setNotasClinicas(s.docs.map(d => ({id:d.id, ...d.data()}))));
    const qRef = query(collection(db, "users", userUid, "pacientes", pacienteSeleccionado.id, "diario_objetivo"), orderBy("createdAt", "desc"));
    const unsubR = onSnapshot(qRef, (s) => setReflexionesObjetivo(s.docs.map(d => d.data())));
    return () => { unsubP(); unsubH(); unsubM(); unsubN(); unsubR(); };
  }, [pacienteSeleccionado, userUid]);

  // ACTIONS
  const guardarExpediente = async () => { try { await updateDoc(doc(db, "users", userUid, "pacientes", pacienteSeleccionado.id), perfilReal); alert("Guardado."); } catch (e) { alert("Error."); } };
  const calcularEdad = (f: string) => { if(!f) return "--"; const h=new Date(); const n=new Date(f); let e=h.getFullYear()-n.getFullYear(); if(h.getMonth()<n.getMonth()) e--; return e+" años"; };
  
  // FUNCIÓN: GESTOR DE SELECCIÓN DE TEST
  const handleSelectTest = (testId: string) => {
    if (testId === 'diva5') {
        setCurrentView('diva5');
    } else {
        alert("Este módulo aún no está instalado en el sistema.");
    }
  };

  // FUNCIÓN: GUARDAR RESULTADOS DEL DIVA (INTEGRACIÓN)
  const finalizarDiva = async (data: any) => {
    try {
      const informeTexto = data.textoInforme;
      
      // Guardamos como nota clínica automática
      await addDoc(collection(db, "users", userUid, "pacientes", pacienteSeleccionado.id, "notas_clinicas"), {
          contenido: informeTexto, // Guardamos el resumen legible
          datosBrutos: data.raw,   // Opcional: Guardamos el JSON crudo por si quieres hacer estadísticas luego
          resumen: data.resumen,   // Opcional: Los conteos numéricos
          createdAt: new Date(),
          autor: userUid,
          tipo: 'evaluacion_diva',
          titulo: 'Resultados Evaluación DIVA-5'
      });

      // Feedback y redirección
      setCurrentView('panel'); // Volvemos al panel
      setActiveTab('notas');   // Vamos a notas para ver el resultado
      
    } catch (e) {
      console.error(e);
      alert("Error al guardar en la base de datos.");
    }
  };

  // --- GUARDAR NOTA CON FECHA CORREGIDA ---
  const guardarNota = async () => {
      if(!nuevaNota.trim()) return;
      const [year, month, day] = fechaNota.split('-').map(Number);
      const fechaSegura = new Date(year, month - 1, day, 12, 0, 0);

      await addDoc(collection(db, "users", userUid, "pacientes", pacienteSeleccionado.id, "notas_clinicas"), {
          contenido: nuevaNota,
          createdAt: fechaSegura,
          autor: userUid
      });
      setNuevaNota("");
      setFechaNota(getHoyLocal()); 
      setIndiceNota(0);
  };

  const exportarHistorial = () => {
      const txt = notasClinicas.map((n:any) => `[${new Date(n.createdAt.seconds*1000).toLocaleDateString()}]\n${n.contenido}\n`).join("\n---\n");
      const element = document.createElement("a");
      element.href = URL.createObjectURL(new Blob([txt], {type:'text/plain'}));
      element.download = "Historial.txt"; document.body.appendChild(element); element.click(); document.body.removeChild(element);
  };

  const toggleRecompensa = (t: string) => recompensas.includes(t) ? setRecompensas(recompensas.filter(r => r !== t)) : setRecompensas([...recompensas, t]);
  const guardarHabito = async () => {
    if (!tituloHabito) return;
    const d = { titulo: tituloHabito, frecuenciaMeta: frecuenciaMeta, recompensas: recompensas.length?recompensas:['xp'] };
    const col = collection(db, "users", userUid, "pacientes", pacienteSeleccionado.id, "habitos");
    if (editingHabitId) await updateDoc(doc(col, editingHabitId), d); else await addDoc(col, {...d, estado:'activo', createdAt:new Date(), registro:{L:false,M:false,X:false,J:false,V:false,S:false,D:false}});
    setTituloHabito(""); setFrecuenciaMeta(7); setRecompensas([]); setEditingHabitId(null);
  };
  const cargarParaEditar = (h: any) => { setTituloHabito(h.titulo); setFrecuenciaMeta(h.frecuenciaMeta); setRecompensas(h.recompensas || []); setEditingHabitId(h.id); };
  const cancelarEdicion = () => { setTituloHabito(""); setFrecuenciaMeta(7); setRecompensas([]); setEditingHabitId(null); };
  const addSub = () => { if(newSubText) { setQuestSubs([...questSubs, {id:Date.now(), texto:newSubText, completado:false}]); setNewSubText(""); } };
  const analizarBalance = () => {
      if (habitos.length === 0) return null;
      const activos = habitos.filter(h => h.estado !== 'archivado');
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

  const archivarHabito = async (id:string, est:string) => { if(confirm("¿Cambiar estado?")) await updateDoc(doc(db,"users",userUid,"pacientes",pacienteSeleccionado.id,"habitos",id),{estado: est==='archivado'?'activo':'archivado'}); };
  const eliminarHabito = async (id:string) => { if(confirm("¿Eliminar?")) await deleteDoc(doc(db,"users",userUid,"pacientes",pacienteSeleccionado.id,"habitos",id)); };
  
  const guardarQuest = async () => { if(!questTitulo) return; await addDoc(collection(db,"users",userUid,"pacientes",pacienteSeleccionado.id,"misiones"),{titulo:questTitulo, descripcion:questDesc, dificultad:questDif, fechaVencimiento:questFecha, subObjetivos:questSubs, estado:'activa'}); alert("Enviada"); setQuestTitulo(""); };
  const eliminarQuest = async (id:string) => { if(confirm("¿Eliminar?")) await deleteDoc(doc(db,"users",userUid,"pacientes",pacienteSeleccionado.id,"misiones",id)); };
  
  const registrarAsistencia = async () => { if(confirm("¿Asistencia?")) await updateDoc(doc(db,"users",userUid,"pacientes",pacienteSeleccionado.id),{nexo:increment(1), xp:increment(500)}); };
  const tieneInteraccion = (h:any) => Object.values(h.registro||{}).some(v=>v) || Object.keys(h.comentariosSemana||{}).length > 0;

  const getWeekId = (date: Date) => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      return `${d.getUTCFullYear()}-W${weekNo}`;
  };

  const resetearCofre = async () => {
      if(!confirm("⚠️ ¿Resetear el cofre de esta semana para el paciente?")) return;
      try {
          const currentWeekId = getWeekId(new Date());
          await updateDoc(doc(db, "users", userUid, "pacientes", pacienteSeleccionado.id), {
              claimedChests: arrayRemove(currentWeekId)
          });
          alert("Cofre reseteado. El paciente puede abrirlo de nuevo.");
      } catch (e) {
          console.error(e);
          alert("Error al resetear.");
      }
  };

  // --- INTERCEPTORES DE VISTA (MODOS DE PRUEBA) ---
  
  // 1. MODO CATÁLOGO DE PRUEBAS
  if (currentView === 'catalog') {
    return (
      <div style={{animation: 'fadeIn 0.3s'}}>
        <TestCatalog 
          onSelectTest={handleSelectTest}
          onCancel={() => setCurrentView('panel')}
        />
      </div>
    );
  }

  // 2. MODO EJECUCIÓN DIVA-5
  if (currentView === 'diva5') {
    return (
      <div style={{animation: 'fadeIn 0.3s'}}>
        <ClinicalTestsScreen 
          onFinish={finalizarDiva} 
          onCancel={() => setCurrentView('catalog')} 
        />
      </div>
    );
  }

  // 3. MODO PANEL NORMAL (Si no hay pruebas activas)
  if (!pacienteSeleccionado) {
      const filtrados = busqueda ? pacientes.filter(p => p.displayName.toLowerCase().includes(busqueda.toLowerCase())) : [];
      return (
        <div style={{textAlign:'left', maxWidth:'800px', margin:'0 auto'}}>
            {/* ... BUSQUEDA PACIENTES ... */}
            <div style={{background:'rgba(15, 23, 42, 0.6)', padding:'30px', borderRadius:'20px', marginBottom:'30px', border:'1px solid rgba(148, 163, 184, 0.1)', textAlign:'center'}}>
                <h3 style={{margin:0, color:'#F8FAFC', fontSize:'2rem', letterSpacing:'2px'}}>CENTRO DE MANDO</h3>
            </div>
            <div style={{position:'relative', marginBottom:'30px'}}>
                <input type="text" placeholder="Buscar paciente..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{width:'100%', padding:'20px 20px 20px 50px', borderRadius:'15px', background:'rgba(30, 41, 59, 0.8)', border:'1px solid rgba(148, 163, 184, 0.2)', color:'white', fontSize:'1.2rem', outline:'none'}} />
                <span style={{position:'absolute', left:'20px', top:'50%', transform:'translateY(-50%)', fontSize:'1.5rem'}}>🔍</span>
            </div>
            {busqueda && <div style={{display:'grid', gap:'15px'}}>{filtrados.map(p => (
                <div key={p.id} onClick={() => p.isAuthorized && setPacienteSeleccionado(p)} style={{background:'rgba(30, 41, 59, 0.6)', border:'1px solid rgba(148, 163, 184, 0.1)', padding:'15px', borderRadius:'12px', cursor:p.isAuthorized?'pointer':'default', display:'flex', alignItems:'center', gap:'20px'}}>
                    <div style={{fontWeight:'bold', color:'#E2E8F0', fontSize:'1.2rem', flex:1}}>{p.displayName}</div>
                    {p.isAuthorized ? <span style={{color:'#10B981'}}>● ACTIVO</span> : <button onClick={(e)=>{e.stopPropagation(); updateDoc(doc(db,"users",userUid,"pacientes",p.id),{isAuthorized:true})}} style={{padding:'5px 10px', background:'var(--primary)', border:'none', borderRadius:'5px', cursor:'pointer'}}>AUTORIZAR</button>}
                </div>
            ))}</div>}
        </div>
      );
  }

  const paciente = datosLive || pacienteSeleccionado;
  const nivel = obtenerNivel(paciente.xp || 0);
  const etapa = obtenerEtapaActual(PERSONAJES[paciente.avatarKey as PersonajeTipo]||PERSONAJES['atlas'], nivel);

  return (
    <div style={{textAlign: 'left', animation: 'fadeIn 0.3s'}}>
       
       {/* MODAL HISTORIAL DE NOTAS */}
       {showHistoryModal && (
           <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', zIndex:9999, background:'rgba(15, 23, 42, 0.95)', backdropFilter:'blur(10px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px'}}>
               <div style={{maxWidth:'800px', width:'100%'}}>
                   <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px', borderBottom:'1px solid rgba(148, 163, 184, 0.3)', paddingBottom:'15px'}}>
                       <h2 style={{margin:0, color:'#F8FAFC', fontFamily:'Rajdhani'}}>HISTORIAL CLÍNICO</h2>
                       <button onClick={() => setShowHistoryModal(false)} style={{background:'transparent', border:'1px solid #94A3B8', color:'white', padding:'8px 15px', borderRadius:'8px', cursor:'pointer'}}>CERRAR</button>
                   </div>

                   {notasClinicas.length > 0 ? (
                       <div style={{background:'rgba(30, 41, 59, 0.6)', padding:'30px', borderRadius:'16px', border:'1px solid rgba(148, 163, 184, 0.2)'}}>
                           <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                               <button onClick={() => setIndiceNota(prev => Math.min(prev + 1, notasClinicas.length - 1))} disabled={indiceNota >= notasClinicas.length - 1} style={{opacity: indiceNota >= notasClinicas.length - 1 ? 0.3 : 1, cursor:'pointer', background:'transparent', border:'none', color:'white', fontSize:'2rem'}}><IconLeft/></button>
                               <div style={{textAlign:'center'}}>
                                   <div style={{fontSize:'1.2rem', color:'var(--secondary)', fontWeight:'bold'}}>{new Date(notasClinicas[indiceNota].createdAt?.seconds * 1000).toLocaleDateString()}</div>
                                   <div style={{fontSize:'0.8rem', color:'#94A3B8'}}>Nota {indiceNota + 1} de {notasClinicas.length}</div>
                               </div>
                               <button onClick={() => setIndiceNota(prev => Math.max(prev - 1, 0))} disabled={indiceNota === 0} style={{opacity: indiceNota === 0 ? 0.3 : 1, cursor:'pointer', background:'transparent', border:'none', color:'white', fontSize:'2rem'}}><IconRight/></button>
                           </div>
                           <div style={{whiteSpace:'pre-wrap', lineHeight:'1.8', color:'#E2E8F0', fontSize:'1.1rem', minHeight:'300px', padding:'20px', background:'rgba(0,0,0,0.2)', borderRadius:'12px'}}>
                               {notasClinicas[indiceNota].contenido}
                           </div>
                       </div>
                   ) : (
                       <p style={{color:'gray', textAlign:'center'}}>No hay historial disponible.</p>
                   )}
               </div>
           </div>
       )}

       {/* MODAL RECURSO (STATS) */}
       {selectedResource && (
           <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', zIndex:9999, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(15px)', display:'flex', justifyContent:'center', alignItems:'center', padding:'20px'}} onClick={() => setSelectedResource(null)}>
               <div style={{background: 'var(--bg-card)', border: 'var(--glass-border)', borderRadius: '20px', padding: '40px', textAlign: 'center', maxWidth: '600px', width:'100%', boxShadow: '0 0 80px rgba(6, 182, 212, 0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center'}} onClick={e => e.stopPropagation()}>
                  <h2 style={{color: selectedResource.type === 'gold' ? '#F59E0B' : (selectedResource.type === 'nexo' ? '#8B5CF6' : 'white'), fontFamily: 'Rajdhani', textTransform:'uppercase', fontSize:'2.5rem', marginBottom:'30px', textShadow: '0 0 20px rgba(0,0,0,0.5)'}}>{STATS_CONFIG[selectedResource.type].label}</h2>
                  <img src={STATS_CONFIG[selectedResource.type].icon} style={{width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '40vh', marginBottom: '30px', filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.1))'}} />
                  <div style={{fontSize: '4rem', fontWeight: 'bold', color: 'white', marginBottom: '10px', lineHeight: 1}}>{Math.floor(selectedResource.value)}<span style={{fontSize:'1.5rem', color:'var(--text-muted)'}}>.{Math.round((selectedResource.value - Math.floor(selectedResource.value))*100)}</span></div>
                  <button onClick={() => setSelectedResource(null)} className="btn-primary" style={{marginTop: '40px', width: '200px', fontSize: '1.1rem'}}>ENTENDIDO</button>
              </div>
           </div>
      )}

       <button onClick={() => setPacienteSeleccionado(null)} style={{background:'none', border:'none', color:'#94A3B8', marginBottom:'20px', cursor:'pointer'}}>⬅ VOLVER</button>
       
       <div style={{background: 'linear-gradient(90deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.9) 100%)', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: '1px solid rgba(148, 163, 184, 0.1)', display:'flex', alignItems:'center', gap:'20px'}}>
           <div style={{width:'80px', height:'80px', borderRadius:'50%', overflow:'hidden', border:'2px solid var(--primary)'}}>
               {etapa.imagen.endsWith('.mp4') ? <video src={etapa.imagen} autoPlay loop muted playsInline style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <img src={etapa.imagen} style={{width:'100%', height:'100%', objectFit:'cover'}} />}
           </div>
           <div><h1 style={{margin:0, fontFamily:'Rajdhani', color:'#F8FAFC'}}>{perfilReal.nombreReal || paciente.displayName}</h1><div style={{color:'var(--primary)', fontSize:'0.9rem'}}>NIVEL {nivel} • {etapa.nombreClase}</div></div>
           
           <div style={{marginLeft:'auto', display:'flex', gap:'10px'}}>
               <button onClick={resetearCofre} style={{background:'transparent', border:'1px solid #10B981', color:'#10B981', padding:'10px 20px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold'}}>RESET COFRE</button>
               <button onClick={registrarAsistencia} style={{background:'rgba(139, 92, 246, 0.2)', color:'#8B5CF6', border:'1px solid #8B5CF6', padding:'10px 20px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold'}}>+ ASISTENCIA</button>
           </div>
       </div>

       <div style={{display:'flex', gap:'10px', marginBottom:'20px', borderBottom:'1px solid rgba(148, 163, 184, 0.1)', paddingBottom:'10px'}}>
           {[{id:'tablero',icon:IconDashboard},{id:'expediente',icon:IconFile},{id:'notas',icon:IconNotes},{id:'gestion',icon:IconTools}].map(tab => (
               <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{padding:'10px 20px', background: activeTab===tab.id ? 'var(--primary)' : 'transparent', color: activeTab===tab.id ? 'black' : '#94A3B8', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', display:'flex', gap:'5px', alignItems:'center', textTransform:'uppercase'}}>
                   <tab.icon/> {tab.id}
               </button>
           ))}
       </div>

       {activeTab === 'tablero' && (
           <div style={{animation:'fadeIn 0.3s'}}>
               <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(100px, 1fr))', gap:'15px', marginBottom:'30px'}}>
                   <div onClick={() => setSelectedResource({type:'gold', value: paciente.gold})} style={{background:'rgba(15, 23, 42, 0.6)', padding:'15px', borderRadius:'12px', textAlign:'center', border:'1px solid rgba(148, 163, 184, 0.1)', cursor:'pointer'}}><img src={STATS_CONFIG.gold.icon} style={{width:'40px', height:'40px', marginBottom:'5px', objectFit:'contain'}} /><div style={{fontSize:'1.5rem', fontWeight:'bold', color:'#F59E0B'}}>{paciente.gold || 0}</div><div style={{fontSize:'0.7rem', color:'#94A3B8'}}>FONDOS</div></div>
                   <div onClick={() => setSelectedResource({type:'nexo', value: paciente.nexo})} style={{background:'rgba(15, 23, 42, 0.6)', padding:'15px', borderRadius:'12px', textAlign:'center', border:'1px solid rgba(139, 92, 246, 0.3)', cursor:'pointer'}}><img src={STATS_CONFIG.nexo.icon} style={{width:'40px', height:'40px', marginBottom:'5px', objectFit:'contain'}} /><div style={{fontSize:'1.5rem', fontWeight:'bold', color:'#8B5CF6'}}>{paciente.nexo || 0}</div><div style={{fontSize:'0.7rem', color:'#94A3B8'}}>NEXOS</div></div>
                   {['vitalidad','sabiduria','vinculacion'].map(stat => (<div key={stat} onClick={() => setSelectedResource({type:stat, value: paciente.stats?.[stat]})} style={{background:'rgba(15, 23, 42, 0.6)', padding:'15px', borderRadius:'12px', textAlign:'center', cursor:'pointer'}}>{/* @ts-ignore */}<img src={STATS_CONFIG[stat].icon} style={{width:'40px', height:'40px', marginBottom:'5px', objectFit:'contain'}} />{/* @ts-ignore */}<div style={{fontSize:'1.5rem', fontWeight:'bold', color:'#E2E8F0'}}>{Number(paciente.stats?.[stat] || 0).toFixed(1)}</div>{/* @ts-ignore */}<div style={{fontSize:'0.7rem', color:'#94A3B8'}}>{STATS_CONFIG[stat].label}</div></div>))}
               </div>
               {analizarBalance()}
               <h3 style={{marginTop:0, color:'#F8FAFC', fontFamily:'Rajdhani'}}>RESUMEN DE HOY</h3>
               <div style={{padding:'20px', background:'rgba(15, 23, 42, 0.6)', borderRadius:'12px'}}><div style={{fontSize:'1.1rem', color:'#E2E8F0'}}>Protocolos completados: <strong style={{color:'var(--primary)'}}>{habitos.filter(h => { const today = new Date().getDay(); const dias = ["D","L","M","X","J","V","S"]; return h.registro?.[dias[today]] === true; }).length}</strong> / {habitos.filter(h => h.estado !== 'archivado').length}</div></div>
           </div>
       )}

       {activeTab === 'expediente' && (
           <div style={{animation:'fadeIn 0.3s', maxWidth:'600px'}}>
               
               {/* --- NUEVA SECCIÓN DE PRUEBAS (BOTÓN GRÁFICO) --- */}
               <h3 style={{color:'var(--secondary)', borderBottom:'1px solid var(--secondary)', paddingBottom:'10px', marginTop:0}}>HERRAMIENTAS DIAGNÓSTICAS</h3>
               
               <div style={{display:'flex', gap:'20px', marginBottom:'30px'}}>
                   <button 
                     onClick={() => setCurrentView('catalog')} 
                     onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-5px)';
                        e.currentTarget.style.borderColor = '#22d3ee';
                        e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(34, 211, 238, 0.3)';
                     }}
                     onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                        e.currentTarget.style.boxShadow = 'none';
                     }}
                     style={{
                       background: 'rgba(15, 23, 42, 0.6)', // Fondo oscuro semitransparente
                       border: '1px solid rgba(148, 163, 184, 0.2)',
                       borderRadius: '16px',
                       padding: '20px',
                       display: 'flex',
                       flexDirection: 'column',
                       alignItems: 'center',
                       gap: '15px',
                       cursor: 'pointer',
                       transition: 'all 0.3s ease',
                       width: '160px', // Tamaño controlado
                       height: '180px'
                     }}
                   >
                     {/* IMAGEN DEL ICONO */}
                     <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img 
                            src="/evaluaciones.png" 
                            alt="Evaluaciones" 
                            style={{ 
                                width: '80px', 
                                height: '80px', 
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 0 10px rgba(34,211,238,0.3))' // Resplandor azul al icono
                            }} 
                        />
                     </div>

                     {/* RECUADRO DE TEXTO */}
                     <div style={{
                         background: 'rgba(0,0,0,0.3)',
                         width: '100%',
                         padding: '8px 0',
                         borderRadius: '8px',
                         borderTop: '1px solid rgba(255,255,255,0.05)'
                     }}>
                        <span style={{ 
                            color: '#e2e8f0', 
                            fontSize: '0.9rem', 
                            fontFamily: 'Rajdhani', 
                            fontWeight: 'bold',
                            letterSpacing: '1px'
                        }}>
                            CATÁLOGO
                        </span>
                     </div>
                   </button>
               </div>
               {/* -------------------------------- */}

               <h3 style={{color:'var(--secondary)', borderBottom:'1px solid var(--secondary)', paddingBottom:'10px', marginTop:0}}>ENFOQUE PERSONAL (OBJETIVO)</h3>
               <div style={{background:'rgba(236, 72, 153, 0.1)', border:'1px solid rgba(236, 72, 153, 0.3)', padding:'20px', borderRadius:'15px', marginBottom:'30px'}}>
                   <h4 style={{margin:'0 0 10px 0', color:'#EC4899', fontFamily:'Rajdhani'}}>OBJETIVO DEL PACIENTE</h4>
                   <p style={{color:'white', fontSize:'1.2rem', fontStyle:'italic'}}>"{paciente.objetivoPersonalData?.titulo || paciente.objetivoPersonal || "No definido"}"</p>
                   
                   {paciente.objetivoPersonalData?.acciones && (
                       <div style={{marginBottom:'20px', display:'flex', flexWrap:'wrap', gap:'10px'}}>
                           {paciente.objetivoPersonalData.acciones.map((acc:string, i:number) => (
                               <span key={i} style={{fontSize:'0.8rem', background:'rgba(255,255,255,0.1)', padding:'5px 10px', borderRadius:'15px', color:'white'}}>• {acc}</span>
                           ))}
                       </div>
                   )}

                   <div style={{marginTop:'20px', maxHeight:'200px', overflowY:'auto'}}>
                       <h5 style={{color:'#EC4899', margin:'0 0 10px 0'}}>ÚLTIMAS REFLEXIONES</h5>
                       {reflexionesObjetivo.length === 0 ? <p style={{color:'gray'}}>Sin registros.</p> : (
                           <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                               {reflexionesObjetivo.map((r, i) => (
                                   <div key={i} style={{background:'rgba(0,0,0,0.3)', padding:'10px', borderRadius:'8px', borderLeft: r.valoracion==='cerca'?'3px solid #10B981':(r.valoracion==='lejos'?'3px solid #EF4444':'3px solid gray')}}>
                                       <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.75rem', color:'#94A3B8', marginBottom:'5px'}}>
                                           <span>{r.createdAt?.seconds ? new Date(r.createdAt.seconds*1000).toLocaleDateString() : "Hoy"}</span>
                                           <span style={{fontWeight:'bold', color: r.valoracion==='cerca'?'#10B981':(r.valoracion==='lejos'?'#EF4444':'gray')}}>{r.valoracion?.toUpperCase()}</span>
                                       </div>
                                       <div style={{color:'#E2E8F0', fontSize:'0.9rem'}}>{r.reflexion}</div>
                                       {r.accionesCompletadas && r.accionesCompletadas.length > 0 && <div style={{marginTop:'5px', fontSize:'0.8rem', color:'#10B981'}}>✅ {r.accionesCompletadas.join(", ")}</div>}
                                   </div>
                               ))}
                           </div>
                       )}
                   </div>
               </div>

               <h3 style={{color:'var(--secondary)', borderBottom:'1px solid var(--secondary)', paddingBottom:'10px', marginTop:0}}>DATOS PERSONALES (PRIVADO)</h3>
               <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'15px'}}>
                   {['nombreReal','telefono','fechaNacimiento','contactoEmergencia','diagnostico'].map(field => (
                       <div key={field}><label style={{fontSize:'0.8rem', color:'#94A3B8', textTransform:'capitalize'}}>{field.replace(/([A-Z])/g, ' $1')}</label>
                       {/* @ts-ignore */}
                       <input type={field.includes('fecha')?'date':'text'} value={perfilReal[field]} onChange={e => setPerfilReal({...perfilReal, [field]: e.target.value})} style={{width:'100%', padding:'10px', background:'rgba(15, 23, 42, 0.6)', border:'1px solid rgba(148, 163, 184, 0.2)', color:'#E2E8F0', borderRadius:'8px'}} /></div>
                   ))}
               </div>
               <div style={{marginBottom:'20px'}}><label style={{fontSize:'0.8rem', color:'#94A3B8'}}>Medicación</label><textarea value={perfilReal.medicacion} onChange={e => setPerfilReal({...perfilReal, medicacion: e.target.value})} style={{width:'100%', height:'80px', padding:'10px', background:'rgba(15, 23, 42, 0.6)', border:'1px solid rgba(148, 163, 184, 0.2)', color:'#E2E8F0', borderRadius:'8px'}} /></div>
               <button onClick={guardarExpediente} className="btn-primary">GUARDAR CAMBIOS</button>
           </div>
       )}

       {activeTab === 'notas' && (
           <div style={{animation:'fadeIn 0.3s'}}>
               <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                   <h3 style={{margin:0, color:'#F8FAFC'}}>BITÁCORA DE SESIÓN</h3>
                   <div style={{display:'flex', gap:'10px'}}>
                       <button onClick={() => setShowHistoryModal(true)} style={{background:'var(--secondary)', border:'none', color:'black', padding:'8px 15px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold'}}>📖 CONSULTAR HISTORIAL</button>
                       <button onClick={exportarHistorial} style={{background:'none', border:'1px solid #E2E8F0', color:'#E2E8F0', padding:'8px 15px', borderRadius:'8px', cursor:'pointer'}}><IconDownload/> EXPORTAR TXT</button>
                   </div>
               </div>
               
               <div style={{background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: '16px', marginBottom: '30px', border: '1px solid rgba(148, 163, 184, 0.1)'}}>
                    <h4 style={{margin:'0 0 15px 0', color:'var(--secondary)'}}>NUEVA ENTRADA</h4>
                    <div style={{marginBottom:'15px'}}>
                        <label style={{fontSize:'0.8rem', color:'#94A3B8', display:'block', marginBottom:'5px'}}>FECHA DEL REGISTRO</label>
                        <input type="date" value={fechaNota} onChange={(e) => setFechaNota(e.target.value)} style={{padding:'10px', borderRadius:'8px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(148, 163, 184, 0.2)', color:'#E2E8F0', fontFamily:'inherit'}} />
                    </div>
                    <textarea value={nuevaNota} onChange={e => setNuevaNota(e.target.value)} placeholder="Escribe la evolución clínica, observaciones o bitácora de sesión..." style={{width:'100%', height:'120px', padding:'15px', borderRadius:'10px', background:'rgba(0,0,0,0.3)', color:'#E2E8F0', border:'1px solid rgba(148, 163, 184, 0.2)', fontFamily:'inherit', marginBottom:'15px', resize:'vertical'}} />
                    <div style={{textAlign:'right'}}><button onClick={guardarNota} className="btn-primary" style={{padding:'10px 30px'}}>GUARDAR NOTA</button></div>
               </div>
           </div>
       )}

       {activeTab === 'gestion' && (
           <div style={{animation:'fadeIn 0.3s'}}>
               <div style={{marginBottom:'40px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', background:'rgba(15, 23, 42, 0.6)', padding:'15px', borderRadius:'12px', cursor:'pointer'}} onClick={() => setShowHabits(!showHabits)}>
                      <h3 style={{margin:0, fontFamily:'Rajdhani', color:'#F8FAFC', fontSize:'1.5rem'}}>PROTOCOLOS DIARIOS ({habitos.length})</h3>
                      {showHabits ? <IconArrowUp /> : <IconArrowDown />}
                  </div>
                  {showHabits && (
                      <>
                        <div style={{background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: editingHabitId ? '2px solid var(--primary)' : '1px solid rgba(148, 163, 184, 0.1)'}}>
                            <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                                <input type="text" value={tituloHabito} onChange={(e) => setTituloHabito(e.target.value)} placeholder="Descripción..." style={{flex:2, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(148, 163, 184, 0.2)', color:'#E2E8F0', padding:'10px', borderRadius:'8px'}} />
                                <select value={frecuenciaMeta} onChange={(e) => setFrecuenciaMeta(Number(e.target.value))} style={{flex:1, padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color:'#E2E8F0', border: '1px solid rgba(148, 163, 184, 0.2)'}}>{[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} día/sem</option>)}</select>
                            </div>
                            <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                                {['vitalidad','sabiduria','vinculacion'].map(t => (
                                    <button key={t} onClick={() => toggleRecompensa(t)} style={{flex:1, padding:'8px', borderRadius:'8px', background: recompensas.includes(t)?'rgba(255,255,255,0.2)':'transparent', border: recompensas.includes(t)?'1px solid white':'1px solid gray', color:'#E2E8F0', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px'}}>
                                        {/* @ts-ignore */}
                                        <img src={STATS_CONFIG[t].icon} width="20" height="20" />
                                        {/* @ts-ignore */}
                                        <span style={{fontSize:'0.8rem'}}>{STATS_CONFIG[t].label}</span>
                                    </button>
                                ))}
                            </div>
                            <div style={{marginTop:'15px', display:'flex', gap:'10px'}}>
                                <button onClick={guardarHabito} className="btn-primary" style={{flex:1}}>{editingHabitId ? "GUARDAR" : "CREAR"}</button>
                                {editingHabitId && <button onClick={cancelarEdicion} style={{background:'none', border:'1px solid #EF4444', color:'#EF4444', padding:'10px', borderRadius:'8px', cursor:'pointer'}}>CANCELAR</button>}
                            </div>
                        </div>
                        <div style={{display:'grid', gap:'10px'}}>
                            {habitos.map(h => {
                                const inactivo = !tieneInteraccion(h) && h.estado !== 'archivado';
                                return (
                                <div key={h.id} style={{
                                    background: 'rgba(30, 41, 59, 0.4)', padding:'15px', borderRadius:'12px', 
                                    border: h.estado==='archivado'?'1px dashed gray': (inactivo ? '1px solid #EF4444' : '1px solid rgba(148, 163, 184, 0.1)'), 
                                    opacity:h.estado==='archivado'?0.6:1, position:'relative',
                                    boxShadow: inactivo ? '0 0 10px rgba(239, 68, 68, 0.2)' : 'none'
                                }}>
                                    {inactivo && <div style={{position:'absolute', top:-8, right:10, background:'#EF4444', fontSize:'0.6rem', padding:'2px 6px', borderRadius:'4px', fontWeight:'bold', color:'white'}}>SIN ACTIVIDAD</div>}
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                                        <div>
                                            <div style={{fontWeight:'bold', color:'#E2E8F0'}}>{h.titulo} <span style={{fontSize:'0.8rem', color:'#94A3B8'}}>({h.frecuenciaMeta}/sem)</span></div>
                                            
                                            {/* FILA DE SEGUIMIENTO DIARIO (NUEVO) */}
                                            <div style={{display: 'flex', gap: '5px', marginTop:'8px', marginBottom:'5px'}}>
                                              {['L','M','X','J','V','S','D'].map(day => (
                                                 <div key={day} style={{
                                                    width:'25px', height:'25px', borderRadius:'6px',
                                                    background: h.registro?.[day] ? 'var(--secondary)' : 'rgba(255,255,255,0.1)',
                                                    color: h.registro?.[day] ? 'black' : 'gray',
                                                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:'bold',
                                                    border: h.registro?.[day] ? 'none' : '1px solid rgba(255,255,255,0.1)'
                                                 }}>
                                                    {day}
                                                 </div>
                                              ))}
                                            </div>

                                            <div style={{display:'flex', gap:'5px', marginTop:'5px'}}>
                                                {h.recompensas?.map((r: string) => (
                                                    // @ts-ignore
                                                    <img key={r} src={STATS_CONFIG[r]?.icon} title={STATS_CONFIG[r]?.label} style={{width:'20px', height:'20px', objectFit:'contain'}} />
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{display:'flex', gap:'10px'}}>
                                            <button onClick={() => cargarParaEditar(h)} style={{background:'none', border:'none', color:'var(--primary)', cursor:'pointer'}}><IconEdit/></button>
                                            <button onClick={() => archivarHabito(h.id, h.estado)} style={{background:'none', border:'none', color:'#E2E8F0', cursor:'pointer'}}><IconMedal/></button>
                                            <button onClick={() => eliminarHabito(h.id)} style={{background:'none', border:'none', color:'#EF4444', cursor:'pointer'}}><IconTrash/></button>
                                        </div>
                                    </div>
                                    {/* BITÁCORA EN HÁBITO */}
                                    {h.comentariosSemana && Object.keys(h.comentariosSemana).length > 0 && (
                                        <div style={{marginTop:'10px', background:'rgba(0,0,0,0.3)', padding:'10px', borderRadius:'8px'}}>
                                            <div style={{fontSize:'0.7rem', color:'#FBBF24', marginBottom:'5px', fontWeight:'bold'}}>📝 NOTAS DEL PACIENTE:</div>
                                            {Object.entries(h.comentariosSemana).map(([dia, nota]:any) => (
                                                <div key={dia} style={{fontSize:'0.85rem', color:'#E2E8F0', marginBottom:'4px'}}>
                                                    <span style={{color:'#94A3B8', fontWeight:'bold'}}>{dia}: </span> 
                                                    <span style={{fontStyle:'italic'}}>"{nota}"</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                );
                            })}
                        </div>
                      </>
                  )}
               </div>
           </div>
       )}
    </div>
  );
}