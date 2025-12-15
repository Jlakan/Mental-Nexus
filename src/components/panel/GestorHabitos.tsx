import React, { useState } from 'react';
import { doc, updateDoc, addDoc, deleteDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { STATS_CONFIG, StatTipo } from '../../game/GameAssets';

// --- ICONOS ---
const IconEdit = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const IconTrash = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const IconChart = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>;
const IconMedal = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>;
const IconRepeat = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>;
const IconScroll = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>;
const IconPlus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;

interface Props {
  pacienteId: string;
  userUid: string;
  habitos: any[];
  misiones: any[]; 
}

export const GestorHabitos: React.FC<Props> = ({ pacienteId, userUid, habitos, misiones = [] }) => {
  const [activeTab, setActiveTab] = useState<'rutinas' | 'misiones'>('rutinas');
  
  // --- ESTADOS DE HÁBITOS ---
  const [expandedStatsHabit, setExpandedStatsHabit] = useState<string | null>(null);
  const [tituloHabito, setTituloHabito] = useState("");
  const [frecuenciaMeta, setFrecuenciaMeta] = useState(7);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [recompensas, setRecompensas] = useState<string[]>([]);

  // --- ESTADOS DE MISIONES ---
  const [questTitulo, setQuestTitulo] = useState("");
  const [questDif, setQuestDif] = useState<'facil'|'media'|'dificil'>('media');
  const [questFecha, setQuestFecha] = useState("");
  
  // NUEVO: ESTADO PARA LOS SUB-OBJETIVOS TEMPORALES
  const [questSubs, setQuestSubs] = useState<{id:number, texto:string, completado:boolean}[]>([]);
  const [newSubText, setNewSubText] = useState("");

  // ==========================
  // LÓGICA DE HÁBITOS
  // ==========================
  const guardarHabito = async () => {
    if (!tituloHabito) return;
    const d = { titulo: tituloHabito, frecuenciaMeta: frecuenciaMeta, recompensas: recompensas.length ? recompensas : ['xp'] };
    const col = collection(db, "users", userUid, "pacientes", pacienteId, "habitos");
    try {
      if (editingHabitId) await updateDoc(doc(col, editingHabitId), d);
      else await addDoc(col, { ...d, estado: 'activo', createdAt: new Date(), registro: {L:false,M:false,X:false,J:false,V:false,S:false,D:false} });
      setTituloHabito(""); setFrecuenciaMeta(7); setRecompensas([]); setEditingHabitId(null);
    } catch (e) { alert("Error al guardar hábito"); }
  };

  const cargarParaEditar = (h: any) => { setTituloHabito(h.titulo); setFrecuenciaMeta(h.frecuenciaMeta); setRecompensas(h.recompensas || []); setEditingHabitId(h.id); setActiveTab('rutinas'); };
  const cancelarEdicion = () => { setTituloHabito(""); setFrecuenciaMeta(7); setRecompensas([]); setEditingHabitId(null); };
  const toggleRecompensa = (t: string) => recompensas.includes(t) ? setRecompensas(recompensas.filter(r => r !== t)) : setRecompensas([...recompensas, t]);
  const archivarHabito = async (id:string, est:string) => { if(confirm("¿Cambiar estado?")) await updateDoc(doc(db,"users",userUid,"pacientes",pacienteId,"habitos",id),{estado: est==='archivado'?'activo':'archivado'}); };
  const eliminarHabito = async (id:string) => { if(confirm("¿Eliminar?")) await deleteDoc(doc(db,"users",userUid,"pacientes",pacienteId,"habitos",id)); };
  
  const tieneInteraccion = (h:any) => Object.values(h.registro||{}).some(v=>v) || Object.keys(h.comentariosSemana||{}).length > 0;

  const renderHabitChart = (h: any) => {
      const historial = h.historial || {};
      const historyKeys = Object.keys(historial).sort();
      const dataPoints = historyKeys.map(key => {
          const weekData = historial[key].checks || {};
          const count = Object.values(weekData).filter(v => v).length;
          return { label: key.split('-')[1], count }; 
      });
      const currentCount = Object.values(h.registro || {}).filter(v => v).length;
      dataPoints.push({ label: 'ACTUAL', count: currentCount });

      return (
          <div style={{background: 'rgba(0,0,0,0.4)', padding: '20px', borderRadius: '12px', marginTop: '15px', border: '1px solid rgba(255,255,255,0.1)'}}>
              <h4 style={{margin: '0 0 15px 0', color: '#22d3ee', fontSize: '0.9rem'}}>HISTORIAL</h4>
              {dataPoints.length === 1 && dataPoints[0].count === 0 ? <div style={{color: 'gray', fontSize: '0.8rem', fontStyle: 'italic'}}>Sin datos suficientes.</div> : 
                  <div style={{display: 'flex', alignItems: 'flex-end', gap: '8px', height: '80px'}}>
                      {dataPoints.map((pt, idx) => {
                          const heightPct = Math.min((pt.count / 7) * 100, 100);
                          const isCurrent = pt.label === 'ACTUAL';
                          return (
                              <div key={idx} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px'}}>
                                  <div style={{width: '100%', height: `${heightPct}%`, background: isCurrent ? 'var(--secondary)' : 'var(--primary)', borderRadius: '4px 4px 0 0', minHeight: '4px', opacity: isCurrent ? 1 : 0.6}}></div>
                                  <div style={{fontSize: '0.6rem', color: '#94a3b8'}}>{pt.label}</div>
                              </div>
                          );
                      })}
                  </div>
              }
          </div>
      );
  };

  // ==========================
  // LÓGICA DE MISIONES
  // ==========================
  
  // Helper para agregar sub-objetivos locales
  const addSub = () => {
      if (!newSubText.trim()) return;
      setQuestSubs([...questSubs, {id: Date.now(), texto: newSubText, completado: false}]);
      setNewSubText("");
  };

  // Helper para eliminar sub-objetivo local
  const removeSub = (id: number) => {
      setQuestSubs(questSubs.filter(s => s.id !== id));
  };

  const crearMision = async () => {
      if (!questTitulo) return;
      
      let xpReward = 150;
      if (questDif === 'media') xpReward = 300;
      if (questDif === 'dificil') xpReward = 500;

      await addDoc(collection(db, "users", userUid, "pacientes", pacienteId, "misiones"), {
          titulo: questTitulo,
          dificultad: questDif,
          xp: xpReward,
          fechaVencimiento: questFecha || null,
          estado: 'activa',
          createdAt: serverTimestamp(),
          subObjetivos: questSubs // ✅ AQUÍ GUARDAMOS LOS PASOS
      });
      
      // Limpiar formulario
      setQuestTitulo("");
      setQuestFecha("");
      setQuestDif("media");
      setQuestSubs([]); // Limpiamos los pasos
      alert("Misión asignada.");
  };

  const borrarMision = async (id: string) => {
      if(confirm("¿Eliminar misión?")) await deleteDoc(doc(db, "users", userUid, "pacientes", pacienteId, "misiones", id));
  };

  const misionesActivas = misiones.filter(m => m.estado === 'activa');
  const misionesCompletadas = misiones.filter(m => m.estado === 'completada');

  return (
    <div style={{animation:'fadeIn 0.3s'}}>
       
       {/* MENU DE PESTAÑAS INTERNAS */}
       <div style={{display:'flex', gap:'15px', marginBottom:'20px', borderBottom:'1px solid rgba(255,255,255,0.1)', paddingBottom:'10px'}}>
           <button 
             onClick={() => setActiveTab('rutinas')}
             style={{
                 background: 'none', border: 'none', 
                 color: activeTab === 'rutinas' ? 'var(--secondary)' : '#64748b',
                 fontWeight: 'bold', cursor:'pointer', fontSize:'1rem',
                 display:'flex', alignItems:'center', gap:'8px', borderBottom: activeTab === 'rutinas' ? '2px solid var(--secondary)' : 'none', paddingBottom:'5px'
             }}
           >
               <IconRepeat /> RUTINAS DIARIAS
           </button>
           <button 
             onClick={() => setActiveTab('misiones')}
             style={{
                 background: 'none', border: 'none', 
                 color: activeTab === 'misiones' ? '#F59E0B' : '#64748b',
                 fontWeight: 'bold', cursor:'pointer', fontSize:'1rem',
                 display:'flex', alignItems:'center', gap:'8px', borderBottom: activeTab === 'misiones' ? '2px solid #F59E0B' : 'none', paddingBottom:'5px'
             }}
           >
               <IconScroll /> MISIONES ÚNICAS
           </button>
       </div>

       {/* --- SECCIÓN RUTINAS --- */}
       {activeTab === 'rutinas' && (
          <>
            {/* FORMULARIO RUTINAS */}
            <div style={{background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: editingHabitId ? '2px solid var(--primary)' : '1px solid rgba(148, 163, 184, 0.1)'}}>
                <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                    <input type="text" value={tituloHabito} onChange={(e) => setTituloHabito(e.target.value)} placeholder="Ej: Beber 2L de agua..." style={{flex:2, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(148, 163, 184, 0.2)', color:'#E2E8F0', padding:'10px', borderRadius:'8px'}} />
                    <select value={frecuenciaMeta} onChange={(e) => setFrecuenciaMeta(Number(e.target.value))} style={{flex:1, padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color:'#E2E8F0', border: '1px solid rgba(148, 163, 184, 0.2)'}}>{[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} días/sem</option>)}</select>
                </div>
                <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                    {['vitalidad','sabiduria','vinculacion'].map(t => (
                        <button key={t} onClick={() => toggleRecompensa(t)} style={{flex:1, padding:'8px', borderRadius:'8px', background: recompensas.includes(t)?'rgba(255,255,255,0.2)':'transparent', border: recompensas.includes(t)?'1px solid white':'1px solid gray', color:'#E2E8F0', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px'}}>
                            {/* @ts-ignore */}
                            <img src={STATS_CONFIG[t].icon} width="20" height="20" />
                            {/* @ts-ignore */}
                            <span style={{fontSize:'0.8rem', textTransform:'capitalize'}}>{STATS_CONFIG[t].label}</span>
                        </button>
                    ))}
                </div>
                <div style={{marginTop:'15px', display:'flex', gap:'10px'}}>
                    <button onClick={guardarHabito} className="btn-primary" style={{flex:1}}>{editingHabitId ? "GUARDAR CAMBIOS" : "CREAR RUTINA"}</button>
                    {editingHabitId && <button onClick={cancelarEdicion} style={{background:'none', border:'1px solid #EF4444', color:'#EF4444', padding:'10px', borderRadius:'8px', cursor:'pointer'}}>CANCELAR</button>}
                </div>
            </div>

            {/* LISTA RUTINAS */}
            <div style={{display:'grid', gap:'10px'}}>
                {habitos.map(h => {
                    const inactivo = !tieneInteraccion(h) && h.estado !== 'archivado';
                    return (
                    <div key={h.id} style={{background: 'rgba(30, 41, 59, 0.4)', padding:'15px', borderRadius:'12px', border: h.estado==='archivado'?'1px dashed gray': (inactivo ? '1px solid #EF4444' : '1px solid rgba(148, 163, 184, 0.1)'), opacity:h.estado==='archivado'?0.6:1}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                            <div>
                                <div style={{fontWeight:'bold', color:'#E2E8F0'}}>{h.titulo} <span style={{fontSize:'0.8rem', color:'#94A3B8'}}>({h.frecuenciaMeta}/sem)</span></div>
                                <div style={{display: 'flex', gap: '5px', marginTop:'8px', marginBottom:'5px'}}>
                                    {['L','M','X','J','V','S','D'].map(day => <div key={day} style={{width:'25px', height:'25px', borderRadius:'6px', background: h.registro?.[day] ? 'var(--secondary)' : 'rgba(255,255,255,0.1)', color: h.registro?.[day] ? 'black' : 'gray', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:'bold'}}>{day}</div>)}
                                </div>
                            </div>
                            <div style={{display:'flex', gap:'5px'}}>
                                <button onClick={() => setExpandedStatsHabit(expandedStatsHabit === h.id ? null : h.id)} style={{background:'none', border:'none', color: expandedStatsHabit === h.id ? 'var(--secondary)' : '#94A3B8', cursor:'pointer'}} title="Ver historial"><IconChart /></button>
                                <button onClick={() => cargarParaEditar(h)} style={{background:'none', border:'none', color:'var(--primary)', cursor:'pointer'}}><IconEdit/></button>
                                <button onClick={() => eliminarHabito(h.id)} style={{background:'none', border:'none', color:'#EF4444', cursor:'pointer'}}><IconTrash/></button>
                            </div>
                        </div>
                        {expandedStatsHabit === h.id && renderHabitChart(h)}
                    </div>
                    );
                })}
            </div>
          </>
       )}

       {/* --- SECCIÓN MISIONES --- */}
       {activeTab === 'misiones' && (
           <>
             {/* FORMULARIO MISIONES */}
             <div style={{background: 'rgba(245, 158, 11, 0.1)', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: '1px solid rgba(245, 158, 11, 0.3)'}}>
                 <h4 style={{margin:'0 0 10px 0', color:'#F59E0B'}}>NUEVA MISIÓN PUNTUAL</h4>
                 
                 {/* DATOS BÁSICOS */}
                 <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                     <input type="text" value={questTitulo} onChange={(e) => setQuestTitulo(e.target.value)} placeholder="Ej: Leer capítulo 4..." style={{flex:2, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(245, 158, 11, 0.3)', color:'#E2E8F0', padding:'10px', borderRadius:'8px'}} />
                     <select value={questDif} onChange={(e) => setQuestDif(e.target.value as any)} style={{padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color:'#E2E8F0', border: '1px solid rgba(245, 158, 11, 0.3)'}}>
                         <option value="facil">Fácil (150 XP)</option>
                         <option value="media">Media (300 XP)</option>
                         <option value="dificil">Difícil (500 XP)</option>
                     </select>
                 </div>

                 {/* LISTA DE SUB-OBJETIVOS (NUEVO) */}
                 <div style={{marginBottom:'15px', padding:'10px', background:'rgba(0,0,0,0.2)', borderRadius:'8px'}}>
                     <label style={{color:'var(--text-muted)', fontSize:'0.8rem', display:'block', marginBottom:'5px'}}>Pasos o tareas (Opcional):</label>
                     <div style={{display:'flex', gap:'5px', marginBottom:'10px'}}>
                         <input 
                            type="text" 
                            placeholder="+ Agregar paso..." 
                            value={newSubText}
                            onChange={(e) => setNewSubText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addSub()}
                            style={{flex:1, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'white', padding:'5px', borderRadius:'4px'}}
                         />
                         <button onClick={addSub} style={{background:'var(--secondary)', border:'none', color:'black', borderRadius:'4px', cursor:'pointer'}}><IconPlus/></button>
                     </div>
                     
                     {questSubs.length > 0 && (
                         <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                             {questSubs.map(s => (
                                 <div key={s.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,0.05)', padding:'5px 10px', borderRadius:'4px'}}>
                                     <span style={{fontSize:'0.9rem', color:'white'}}>• {s.texto}</span>
                                     <span onClick={() => removeSub(s.id)} style={{color:'#EF4444', cursor:'pointer', fontSize:'0.8rem'}}>✕</span>
                                 </div>
                             ))}
                         </div>
                     )}
                 </div>

                 {/* FECHA Y GUARDAR */}
                 <div style={{display:'flex', gap:'10px'}}>
                     <input type="date" value={questFecha} onChange={e => setQuestFecha(e.target.value)} style={{padding:'10px', borderRadius:'8px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(245, 158, 11, 0.3)', color:'white'}} />
                     <button onClick={crearMision} className="btn-primary" style={{flex:1, background:'#F59E0B', color:'black', border:'none'}}>ASIGNAR MISIÓN</button>
                 </div>
             </div>

             {/* LISTA MISIONES */}
             <h4 style={{color:'#94A3B8', marginTop:'20px'}}>EN PROGRESO ({misionesActivas.length})</h4>
             <div style={{display:'grid', gap:'10px'}}>
                 {misionesActivas.map(m => (
                     <div key={m.id} style={{background:'rgba(30, 41, 59, 0.6)', padding:'15px', borderRadius:'12px', borderLeft:`4px solid ${m.dificultad === 'dificil' ? '#EF4444' : (m.dificultad === 'media' ? '#F59E0B' : '#10B981')}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                         <div>
                             <div style={{color:'white', fontWeight:'bold', fontSize:'1rem'}}>{m.titulo}</div>
                             <div style={{color:'#94A3B8', fontSize:'0.8rem'}}>
                                 XP: +{m.xp} • Vence: {m.fechaVencimiento || "Sin fecha"}
                                 {/* Mostrar conteo de pasos */}
                                 {(m.subObjetivos || []).length > 0 && ` • ${(m.subObjetivos || []).length} Pasos`}
                             </div>
                         </div>
                         <button onClick={() => borrarMision(m.id)} style={{background:'transparent', border:'none', color:'#EF4444', cursor:'pointer'}}><IconTrash /></button>
                     </div>
                 ))}
                 {misionesActivas.length === 0 && <p style={{color:'gray', fontStyle:'italic'}}>No hay misiones activas.</p>}
             </div>

             {misionesCompletadas.length > 0 && (
                 <>
                    <h4 style={{color:'#10B981', marginTop:'30px'}}>COMPLETADAS ({misionesCompletadas.length})</h4>
                    <div style={{display:'grid', gap:'10px', opacity:0.6}}>
                        {misionesCompletadas.map(m => (
                            <div key={m.id} style={{background:'rgba(16, 185, 129, 0.1)', padding:'10px', borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <div style={{color:'#10B981', textDecoration:'line-through'}}>{m.titulo}</div>
                                <div style={{fontSize:'0.8rem', color:'#10B981'}}>+{m.xp} XP</div>
                            </div>
                        ))}
                    </div>
                 </>
             )}
           </>
       )}
    </div>
  );
};