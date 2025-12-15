import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, query, orderBy, updateDoc, addDoc, increment, arrayRemove, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { STATS_CONFIG, PERSONAJES, PersonajeTipo, obtenerEtapaActual, obtenerNivel } from '../game/GameAssets';

// --- NUEVOS COMPONENTES MODULARES ---
// Asegúrate de que estos archivos existan en /components/panel/
import { BitacoraClinica } from '../components/panel/BitacoraClinica';
import { GestorHabitos } from '../components/panel/GestorHabitos';
import { ExpedienteClinico } from '../components/panel/ExpedienteClinico';
import { TableroResumen } from '../components/panel/TableroResumen';

// --- VISUALIZADOR ---
import { TestResultsViewer } from '../components/TestResultsViewer'; 
// ELIMINADO: import './PanelPsicologo.css'; (Esta era la causa del error)

// --- ICONOS ---
const IconDashboard = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const IconFile = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
const IconNotes = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>;
const IconTools = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0 2.83l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;

export function PanelExperimental({ userData, userUid }: any) {
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

  // PRUEBAS (Navegación)
  const [currentView, setCurrentView] = useState<'panel' | 'catalog' | 'diva5' | 'beck' | 'phq9'>('panel');
  const [visorData, setVisorData] = useState<any>(null);

  // HELPER SEMANAS (Para el conserje)
  const getWeekId = (date: Date) => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      return `${d.getUTCFullYear()}-W${weekNo}`;
  };

  // 1. CARGA PACIENTES
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users", userUid, "pacientes"), (s) => setPacientes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [userUid]);

  // 2. CARGA DETALLES DEL PACIENTE SELECCIONADO
  useEffect(() => {
    if (!pacienteSeleccionado) return;
    
    // Perfil
    const unsubP = onSnapshot(doc(db, "users", userUid, "pacientes", pacienteSeleccionado.id), (s) => {
        if(s.exists()) { setDatosLive({id:s.id, ...s.data()}); }
    });
    // Hábitos
    const unsubH = onSnapshot(collection(db, "users", userUid, "pacientes", pacienteSeleccionado.id, "habitos"), (s) => setHabitos(s.docs.map(d => ({id:d.id, ...d.data()}))));
    // Misiones
    const unsubM = onSnapshot(collection(db, "users", userUid, "pacientes", pacienteSeleccionado.id, "misiones"), (s) => setMisiones(s.docs.map(d => ({id:d.id, ...d.data()}))));
    // Notas
    const qNotas = query(collection(db, "users", userUid, "pacientes", pacienteSeleccionado.id, "notas_clinicas"), orderBy("createdAt", "desc"));
    const unsubN = onSnapshot(qNotas, (s) => setNotasClinicas(s.docs.map(d => ({id:d.id, ...d.data()}))));
    // Diario
    const qRef = query(collection(db, "users", userUid, "pacientes", pacienteSeleccionado.id, "diario_objetivo"), orderBy("createdAt", "desc"));
    const unsubR = onSnapshot(qRef, (s) => setReflexionesObjetivo(s.docs.map(d => d.data())));
    
    return () => { unsubP(); unsubH(); unsubM(); unsubN(); unsubR(); };
  }, [pacienteSeleccionado, userUid]);

  // 3. CONSERJE INTELIGENTE
  useEffect(() => {
    if (!pacienteSeleccionado || habitos.length === 0) return;
    const verificarYResetearSemana = async () => {
        const currentWeek = getWeekId(new Date());
        const batch = writeBatch(db);
        let hayCambios = false;
        habitos.forEach((h) => {
            if (h.lastUpdatedWeek !== currentWeek) {
                const habitoRef = doc(db, "users", userUid, "pacientes", pacienteSeleccionado.id, "habitos", h.id);
                const semanaAGuardar = h.lastUpdatedWeek || "semana_anterior";
                const updateData: any = {
                    registro: { L: false, M: false, X: false, J: false, V: false, S: false, D: false },
                    comentariosSemana: {},
                    lastUpdatedWeek: currentWeek
                };
                if (h.registro) {
                    updateData[`historial.${semanaAGuardar}`] = { checks: h.registro, comentarios: h.comentariosSemana || {} };
                }
                batch.update(habitoRef, updateData);
                hayCambios = true;
            }
        });
        if (hayCambios) try { await batch.commit(); } catch (error) { console.error("Error limpieza:", error); }
    };
    verificarYResetearSemana();
  }, [habitos, pacienteSeleccionado]);

  // --- MANEJADORES DE PRUEBAS ---
  const handleSelectTest = (testId: string) => {
    if (testId === 'diva5') setCurrentView('diva5');
    else if (testId === 'beck_anxiety') setCurrentView('beck');
    else if (testId === 'phq9') setCurrentView('phq9');
  };

  const finalizarEvaluacion = async (data: any, tipoTest: 'diva' | 'beck' | 'phq9') => {
    try {
      let dbTipo = 'evaluacion_diva';
      let dbTitulo = 'Resultados DIVA-5';
      if (tipoTest === 'beck') { dbTipo = 'evaluacion_beck'; dbTitulo = 'Resultados Beck (BAI)'; }
      else if (tipoTest === 'phq9') { dbTipo = 'evaluacion_phq9'; dbTitulo = 'Resultados PHQ-9'; }

      await addDoc(collection(db, "users", userUid, "pacientes", pacienteSeleccionado.id, "notas_clinicas"), {
          contenido: data.textoInforme, datosBrutos: data.raw || {}, puntajes: data.resumen || {},
          createdAt: new Date(), autor: userUid, tipo: dbTipo, titulo: dbTitulo
      });
      setCurrentView('panel'); setActiveTab('notas');
    } catch (e) { alert("Error al guardar."); }
  };

  // --- RENDERIZADO ---
  if (visorData) return <TestResultsViewer nota={visorData} onClose={() => setVisorData(null)} />;
  
  if (['catalog', 'diva5', 'beck', 'phq9'].includes(currentView)) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
             <div className="p-10 text-center text-gray-500">🚧 Módulo de Tests en Reconstrucción (V3)</div>
             <button onClick={() => setCurrentView('panel')} style={{marginTop: '20px', textDecoration: 'underline'}}>Volver al Panel</button>
        </div>
      );
  }

  if (!pacienteSeleccionado) {
      const filtrados = busqueda ? pacientes.filter(p => p.displayName.toLowerCase().includes(busqueda.toLowerCase())) : [];
      return (
        <div style={{border: '4px solid #F59E0B', minHeight:'100vh', padding:'20px'}}>
            <div style={{background:'#F59E0B', color:'black', textAlign:'center', fontWeight:'bold', marginBottom:'20px', padding:'10px'}}>🚧 LABORATORIO V2 - MODULAR 🚧</div>
            
            <input type="text" placeholder="Buscar paciente..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{width:'100%', padding:'20px', borderRadius:'15px', background:'rgba(30, 41, 59, 0.8)', border:'1px solid rgba(148, 163, 184, 0.2)', color:'white', fontSize:'1.2rem', marginBottom:'20px'}} />
            {busqueda && <div style={{display:'grid', gap:'15px'}}>{filtrados.map(p => (
                <div key={p.id} onClick={() => p.isAuthorized && setPacienteSeleccionado(p)} style={{background:'rgba(30, 41, 59, 0.6)', padding:'15px', borderRadius:'12px', cursor:p.isAuthorized?'pointer':'default', border: p.isAuthorized ? '1px solid white' : '1px dashed gray', opacity: p.isAuthorized?1:0.5}}>
                    <div style={{fontWeight:'bold', color:'#E2E8F0'}}>{p.displayName}</div>
                </div>
            ))}</div>}
        </div>
      );
  }

  const paciente = datosLive || pacienteSeleccionado;
  const nivel = obtenerNivel(paciente.xp || 0);
  const etapa = obtenerEtapaActual(PERSONAJES[paciente.avatarKey as PersonajeTipo]||PERSONAJES['atlas'], nivel);

  return (
    <div style={{border: '4px solid #F59E0B', minHeight:'100vh'}}>
       <div style={{background:'#F59E0B', color:'black', textAlign:'center', fontWeight:'bold', padding:'5px'}}>🚧 V2: VISTA DIVIDIDA + HUD 🚧</div>
       
       <button onClick={() => setPacienteSeleccionado(null)} style={{margin:'20px', background:'none', border:'none', color:'#94A3B8', cursor:'pointer'}}>⬅ VOLVER LISTA</button>

       {/* HEADER */}
       <div style={{background: 'linear-gradient(90deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.9) 100%)', padding: '20px', margin: '20px', borderRadius: '16px', border: '1px solid rgba(148, 163, 184, 0.1)', display:'flex', alignItems:'center', gap:'20px'}}>
           <div style={{width:'60px', height:'60px', borderRadius:'50%', overflow:'hidden', border:'2px solid var(--primary)'}}>
               <img src={etapa.imagen} style={{width:'100%', height:'100%', objectFit:'cover'}} />
           </div>
           <div><h1 style={{margin:0, fontFamily:'Rajdhani', color:'#F8FAFC'}}>{paciente.displayName}</h1><div style={{color:'var(--primary)', fontSize:'0.9rem'}}>NIVEL {nivel}</div></div>
       </div>

       {/* PESTAÑAS */}
       <div style={{display:'flex', gap:'10px', margin:'0 20px 20px 20px', borderBottom:'1px solid rgba(148, 163, 184, 0.1)', paddingBottom:'10px'}}>
           {[
               {id:'tablero',icon:IconDashboard},
               {id:'expediente',icon:IconFile},
               {id:'notas',icon:IconNotes},
               {id:'gestion',icon:IconTools}
           ].map(tab => (
               <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{padding:'10px 20px', background: activeTab===tab.id ? 'var(--primary)' : 'transparent', color: activeTab===tab.id ? 'black' : '#94A3B8', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', display:'flex', gap:'5px', alignItems:'center', textTransform:'uppercase'}}>
                   <tab.icon/> {tab.id}
               </button>
           ))}
       </div>

       {/* CONTENIDO MODULAR */}
       <div style={{padding:'0 20px 50px 20px'}}>
           
           {activeTab === 'tablero' && (
               <TableroResumen 
                   paciente={paciente} 
                   habitos={habitos} 
               />
           )}

           {activeTab === 'expediente' && (
               <ExpedienteClinico 
                   pacienteData={paciente}
                   userUid={userUid}
                   notas={notasClinicas}
                   onVerTest={(nota) => setVisorData(nota)} 
                   onNuevaPrueba={() => setCurrentView('catalog')} 
               />
           )}

           {activeTab === 'notas' && (
               <BitacoraClinica 
                   pacienteData={paciente} 
                   userUid={userUid} 
                   notas={notasClinicas} 
                   onVerTest={(nota) => setVisorData(nota)} 
               />
           )}

           {activeTab === 'gestion' && (
               <GestorHabitos 
                   pacienteId={paciente.id} 
                   userUid={userUid} 
                   habitos={habitos} 
                   misiones={misiones}
               />
           )}
       </div>
    </div>
  );
}