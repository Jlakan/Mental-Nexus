import { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, collection, query, onSnapshot, increment, arrayUnion } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { XP_POR_HABITO, TABLA_NIVELES, obtenerNivel, obtenerMetaSiguiente, PERSONAJES, PersonajeTipo, obtenerEtapaActual, STATS_CONFIG, StatTipo } from '../game/GameAssets';
import { WeeklyChest } from '../components/WeeklyChest';

// --- CONFIGURACIÓN DE BALANCE ---
const FACTOR_GANANCIA_STAT = 0.15;

// --- TIPOS ---
type DificultadQuest = 'facil' | 'media' | 'dificil';
interface SubObjetivo { id: number; texto: string; completado: boolean; }
interface Quest {
    id: string; titulo: string; descripcion: string;
    dificultad: DificultadQuest; fechaVencimiento: string;
    estado: 'activa' | 'completada' | 'vencida';
    subObjetivos: SubObjetivo[];
}

// --- COMPONENTE DE STAT ---
const StatBadge = ({ type, value, onClick }: { type: StatTipo, value: number, onClick: () => void }) => {
    const config = STATS_CONFIG[type];
    // @ts-ignore
    const color = config.color || 'white';
    const valorEntero = Math.floor(value);
    const progresoDecimal = value - valorEntero;
    const porcentajeBarra = Math.min(100, Math.max(0, Math.round(progresoDecimal * 100)));

    return (
        <div onClick={onClick} style={{
                position: 'relative', cursor: 'pointer', flex: 1,
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${color}40`,
                borderRadius: '16px', padding: '15px 5px', textAlign: 'center', 
                transition: 'transform 0.1s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = `0 0 15px ${color}40`; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1.0)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
            <img src={config.icon} alt={config.label} style={{width: '50px', height: '50px', objectFit:'contain', filter: `drop-shadow(0 0 5px ${color})`}} />
            <div style={{width: '100%', padding: '0 10px'}}>
                <div style={{fontWeight: 'bold', color: 'white', fontSize: '1.8rem', lineHeight: 1}}>{valorEntero}</div>
                <div style={{width: '100%', height: '4px', background: 'rgba(0,0,0,0.5)', borderRadius: '2px', marginTop: '5px', overflow: 'hidden'}}>
                    <div style={{width: `${porcentajeBarra}%`, height: '100%', background: color, transition: 'width 0.5s ease', boxShadow: `0 0 5px ${color}`}} />
                </div>
                <div className="text-shine" style={{fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '1px', marginTop:'6px', color: color, fontWeight: 'bold'}}>
                    {config.label.split(' ')[0]}
                </div>
            </div>
        </div>
    );
};

const getWeekId = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
};

export function PanelPaciente({ userUid, psicologoId, userData }: any) {
  const [misHabitos, setMisHabitos] = useState<any[]>([]);
  const [misMisiones, setMisMisiones] = useState<Quest[]>([]);
  
  // ESTADOS DE JUEGO
  const [puntosTotales, setPuntosTotales] = useState(0);
  const [gold, setGold] = useState(0);
  const [nexo, setNexo] = useState(0);
  const [stats, setStats] = useState({ vitalidad: 0, sabiduria: 0, vinculacion: 0 });
  const [nivel, setNivel] = useState(1);
  const [xpSiguiente, setXpSiguiente] = useState(100);
  
  // ESTADOS DE UI
  const [semanaOffset, setSemanaOffset] = useState(0);
  const [viewAvatar, setViewAvatar] = useState(false);
  const [selectedResource, setSelectedResource] = useState<{ type: StatTipo, value: number } | null>(null);
  const [levelUpModal, setLevelUpModal] = useState<{show: boolean, newLevel: number} | null>(null);
  const [editingNote, setEditingNote] = useState<{ habitoId: string, dia: string, texto: string } | null>(null);
  
  // UI DESPLEGABLE
  const [showAllQuests, setShowAllQuests] = useState(false);
  const [showAllHabits, setShowAllHabits] = useState(false);
  const [expandedQuestId, setExpandedQuestId] = useState<string | null>(null);

  const prevLevelRef = useRef(1);
  const currentWeekId = getWeekId(new Date());
  
  const avatarKey = userData.avatarKey as PersonajeTipo;
  const avatarDef = PERSONAJES[avatarKey] || PERSONAJES['atlas'];
  const etapaVisual = obtenerEtapaActual(avatarDef, nivel);

  useEffect(() => {
    if (!psicologoId) return; 

    // 1. PERFIL
    const unsubUser = onSnapshot(doc(db, "users", psicologoId, "pacientes", userUid), (docSnap) => {
        if(docSnap.exists()) {
            const data = docSnap.data();
            setNexo(data.nexo || 0);
            if (misHabitos.length > 0) calcularGamificacion(misHabitos, data);
        }
    });

    // 2. HÁBITOS
    const unsubHabits = onSnapshot(query(collection(db, "users", psicologoId, "pacientes", userUid, "habitos")), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      lista.forEach(async (h: any) => {
        if (h.ultimaSemanaRegistrada && h.ultimaSemanaRegistrada !== currentWeekId) {
            const registroAArchivar = h.registro || { L: false, M: false, X: false, J: false, V: false, S: false, D: false };
            const comentariosAArchivar = h.comentariosSemana || {};
            const historialNuevo = { ...h.historial, [h.ultimaSemanaRegistrada]: { registro: registroAArchivar, comentarios: comentariosAArchivar } };
            await updateDoc(doc(db, "users", psicologoId, "pacientes", userUid, "habitos", h.id), {
                registro: { L: false, M: false, X: false, J: false, V: false, S: false, D: false },
                comentariosSemana: {}, historial: historialNuevo, ultimaSemanaRegistrada: currentWeekId
            });
        } else if (!h.ultimaSemanaRegistrada) {
            await updateDoc(doc(db, "users", psicologoId, "pacientes", userUid, "habitos", h.id), { ultimaSemanaRegistrada: currentWeekId });
        }
      });
      setMisHabitos(lista);
      calcularGamificacion(lista, userData); 
    });

    // 3. MISIONES
    const unsubMisiones = onSnapshot(query(collection(db, "users", psicologoId, "pacientes", userUid, "misiones")), (snapshot) => {
        const quests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quest));
        quests.forEach(async (q) => {
            if (q.estado === 'activa' && q.fechaVencimiento) {
                const hoy = new Date().toISOString().split('T')[0];
                if (hoy > q.fechaVencimiento) await updateDoc(doc(db, "users", psicologoId, "pacientes", userUid, "misiones", q.id), { estado: 'vencida' });
            }
        });
        setMisMisiones(quests);
    });

    return () => { unsubUser(); unsubHabits(); unsubMisiones(); };
  }, [userUid, psicologoId, currentWeekId]);

  // --- CÁLCULO ---
  const calcularGamificacion = async (habitos: any[], currentProfileData: any) => {
    let totalVitalidad = avatarDef.statsBase.vitalidad;
    let totalSabiduria = avatarDef.statsBase.sabiduria;
    let totalVinculacion = avatarDef.statsBase.vinculacion;
    let totalGold = 0;
    let totalXP = 0;

    const sumarSemana = (registro: any, recompensas: string[]) => {
        const checks = Object.values(registro || {}).filter(v => v === true).length;
        totalXP += (checks * XP_POR_HABITO);
        totalGold += (checks * 5); 
        const statGanado = checks * FACTOR_GANANCIA_STAT;
        if (recompensas?.includes('vitalidad')) totalVitalidad += statGanado;
        if (recompensas?.includes('sabiduria')) totalSabiduria += statGanado;
        if (recompensas?.includes('vinculacion')) totalVinculacion += statGanado;
    };

    habitos.forEach(h => {
        sumarSemana(h.registro, h.recompensas);
        if (h.historial) {
            Object.values(h.historial).forEach((semana: any) => {
                const registroReal = semana.registro ? semana.registro : semana;
                sumarSemana(registroReal, h.recompensas);
            });
        }
    });

    const bonos = currentProfileData.bonusStats || {};
    totalXP += (currentProfileData.bonusXP || 0);
    totalGold += (currentProfileData.bonusGold || 0);
    totalVitalidad += (bonos.vitalidad || 0);
    totalSabiduria += (bonos.sabiduria || 0);
    totalVinculacion += (bonos.vinculacion || 0);

    const gastos = currentProfileData.goldSpent || 0;
    totalGold = Math.max(0, totalGold - gastos);

    const nuevoNivel = obtenerNivel(totalXP);
    const meta = obtenerMetaSiguiente(nuevoNivel);

    if (nuevoNivel > prevLevelRef.current) {
        setLevelUpModal({ show: true, newLevel: nuevoNivel });
        const audio = new Audio('/levelup.mp3'); audio.play().catch(e => {}); 
    }
    prevLevelRef.current = nuevoNivel;

    setPuntosTotales(totalXP);
    setGold(totalGold);
    setStats({ 
        vitalidad: Number(totalVitalidad.toFixed(2)), 
        sabiduria: Number(totalSabiduria.toFixed(2)), 
        vinculacion: Number(totalVinculacion.toFixed(2)) 
    });
    setNivel(nuevoNivel);
    setXpSiguiente(meta);

    if (currentProfileData.xp !== totalXP || currentProfileData.gold !== totalGold) {
        try {
            await updateDoc(doc(db, "users", psicologoId, "pacientes", userUid), {
                nivel: nuevoNivel, gold: totalGold, xp: totalXP,
                stats: { 
                    vitalidad: Number(totalVitalidad.toFixed(2)), 
                    sabiduria: Number(totalSabiduria.toFixed(2)), 
                    vinculacion: Number(totalVinculacion.toFixed(2)) 
                }
            });
        } catch (e) { console.error(e); }
    }
  };

  const toggleDia = async (habitoId: string, dia: string, estadoActual: boolean) => {
    if (semanaOffset !== 0) return alert("Solo lectura");
    try {
      const habitoRef = doc(db, "users", psicologoId, "pacientes", userUid, "habitos", habitoId);
      await updateDoc(habitoRef, { [`registro.${dia}`]: !estadoActual });
    } catch (error) { console.error(error); }
  };

  const saveNote = async () => {
      if (!editingNote) return;
      try {
        const habitoRef = doc(db, "users", psicologoId, "pacientes", userUid, "habitos", editingNote.habitoId);
        await updateDoc(habitoRef, { [`comentariosSemana.${editingNote.dia}`]: editingNote.texto });
        setEditingNote(null);
      } catch (e) { console.error(e); }
  };

  const toggleSubObjetivo = async (quest: Quest, subId: number) => {
      if (quest.estado !== 'activa') return;
      const nuevosSub = quest.subObjetivos.map(s => s.id === subId ? { ...s, completado: !s.completado } : s);
      const todosCompletos = nuevosSub.every(s => s.completado);

      try {
          const questRef = doc(db, "users", psicologoId, "pacientes", userUid, "misiones", quest.id);
          if (todosCompletos) {
              const premios = { xp: 50, gold: 25, nexo: 0 };
              if (quest.dificultad === 'media') { premios.xp = 150; premios.gold = 75; }
              if (quest.dificultad === 'dificil') { premios.xp = 500; premios.gold = 200; premios.nexo = 1; }

              await updateDoc(questRef, { subObjetivos: nuevosSub, estado: 'completada' });
              
              const userRef = doc(db, "users", psicologoId, "pacientes", userUid);
              const updates: any = {
                  bonusXP: increment(premios.xp),
                  bonusGold: increment(premios.gold),
                  misionesCompletadas: arrayUnion(quest.id)
              };
              if (premios.nexo > 0) updates['nexo'] = increment(premios.nexo);
              await updateDoc(userRef, updates);
              alert(`¡MISIÓN COMPLETADA!\n\nHas ganado:\n+${premios.xp} XP\n+${premios.gold} Fondos${premios.nexo > 0 ? '\n+1 NEXO' : ''}`);
          } else {
              await updateDoc(questRef, { subObjetivos: nuevosSub });
          }
      } catch (e) { console.error(e); }
  };

  // Helpers
  const contarDias = (registro: any) => (!registro ? 0 : Object.values(registro).filter(val => val === true).length);
  const getDatosVisualizacion = (habito: any) => {
      if (semanaOffset === 0) return { registro: habito.registro, comentarios: habito.comentariosSemana || {} };
      return { registro: { L: false }, comentarios: {} }; 
  };
  const diasSemana = ["L", "M", "X", "J", "V", "S", "D"];
  const xpPiso = TABLA_NIVELES[nivel - 1] || 0;
  const xpTecho = xpSiguiente;
  const porcentajeNivel = Math.min(100, Math.max(0, Math.round(((puntosTotales - xpPiso) / (xpTecho - xpPiso)) * 100)));

  // RENDER MISION CARD
  const renderQuestCard = (quest: Quest, isModal: boolean = false) => {
      const activeSubs = quest.subObjetivos.filter(s => s.completado).length;
      const totalSubs = quest.subObjetivos.length;
      const isExpanded = expandedQuestId === quest.id || isModal;
      const colorDificultad = quest.dificultad === 'facil' ? '#10B981' : (quest.dificultad === 'media' ? '#F59E0B' : '#EF4444');
      const needsAction = quest.estado === 'activa' && activeSubs === 0;

      return (
          <div key={quest.id} style={{
              background: quest.estado === 'vencida' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-card)', 
              border: `1px solid ${quest.estado === 'vencida' ? '#EF4444' : 'rgba(255,255,255,0.1)'}`, 
              borderRadius: '15px', padding: '20px', marginBottom: '15px', position: 'relative', overflow: 'hidden',
              boxShadow: needsAction ? `0 0 15px ${colorDificultad}40` : 'none',
              animation: needsAction ? 'pulseBorder 2s infinite' : 'none'
          }}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer'}} onClick={() => !isModal && setExpandedQuestId(isExpanded ? null : quest.id)}>
                  <div>
                      <div style={{display:'flex', gap:'10px', alignItems:'center', marginBottom:'5px'}}>
                          <span style={{fontSize:'0.7rem', color: colorDificultad, border:`1px solid ${colorDificultad}`, padding:'2px 6px', borderRadius:'4px', textTransform:'uppercase', fontWeight:'bold'}}>{quest.dificultad}</span>
                          {quest.estado === 'vencida' && <span style={{fontSize:'0.7rem', background:'#EF4444', color:'white', padding:'2px 6px', borderRadius:'4px'}}>VENCIDA</span>}
                          {quest.estado === 'completada' && <span style={{fontSize:'0.7rem', background:'#10B981', color:'black', padding:'2px 6px', borderRadius:'4px'}}>COMPLETADA</span>}
                      </div>
                      <h4 style={{margin:0, color:'white', fontFamily:'Rajdhani', fontSize:'1.2rem'}}>{quest.titulo}</h4>
                  </div>
                  <div style={{textAlign:'right'}}>
                      {quest.estado === 'activa' && <span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>{activeSubs}/{totalSubs}</span>}
                  </div>
              </div>

              {isExpanded && (
                  <div style={{marginTop:'15px', paddingTop:'15px', borderTop:'1px solid rgba(255,255,255,0.1)'}}>
                      <p style={{color:'var(--text-muted)', fontSize:'0.9rem', marginBottom:'15px'}}>{quest.descripcion}</p>
                      
                      {quest.estado === 'vencida' ? (
                          <div style={{background:'rgba(239, 68, 68, 0.2)', padding:'10px', borderRadius:'8px', color:'#FCA5A5', fontSize:'0.9rem', fontStyle:'italic'}}>
                              ⚠️ Sincronización Fallida. Oportunidad perdida.
                          </div>
                      ) : (
                          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                              {quest.subObjetivos.map(sub => (
                                  <div key={sub.id} onClick={() => toggleSubObjetivo(quest, sub.id)} style={{display:'flex', alignItems:'center', gap:'10px', padding:'10px', background: sub.completado ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0,0,0,0.3)', borderRadius:'8px', cursor: quest.estado === 'completada' ? 'default' : 'pointer', border: sub.completado ? '1px solid #10B981' : '1px solid transparent'}}>
                                      <div style={{width:'20px', height:'20px', borderRadius:'4px', border:'2px solid var(--secondary)', display:'flex', alignItems:'center', justifyContent:'center', background: sub.completado ? 'var(--secondary)' : 'transparent'}}>{sub.completado && <span style={{color:'black', fontSize:'0.8rem'}}>✓</span>}</div>
                                      <span style={{color: sub.completado ? 'white' : 'var(--text-muted)', textDecoration: sub.completado ? 'line-through' : 'none'}}>{sub.texto}</span>
                                  </div>
                              ))}
                          </div>
                      )}
                      {quest.estado === 'activa' && <div style={{marginTop:'15px', fontSize:'0.8rem', color:'var(--text-muted)', textAlign:'right'}}>Vence: {quest.fechaVencimiento}</div>}
                  </div>
              )}
          </div>
      );
  };

  // RENDER HABIT CARD
  const renderHabitCard = (habito: any) => {
    const { registro, comentarios } = getDatosVisualizacion(habito);
    const diasLogrados = contarDias(registro);
    const meta = habito.frecuenciaMeta || 7;
    const porcentaje = Math.min(100, Math.round((diasLogrados / meta) * 100));
    const logrado = diasLogrados >= meta;
    const esHistorial = semanaOffset < 0;
    
    return (
      <div key={habito.id} style={{background: 'var(--bg-card)', padding: '25px', borderRadius: '20px', border: logrado ? '1px solid var(--secondary)' : '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden', opacity: esHistorial ? 0.7 : 1}}>
        {logrado && <div style={{position: 'absolute', top: 0, right: 0, background: 'var(--secondary)', color: 'black', padding: '5px 15px', borderBottomLeftRadius: '15px', fontSize: '0.7rem', fontWeight: 'bold'}}>¡META CUMPLIDA!</div>}
        
        <div style={{marginBottom: '20px'}}>
          <h4 style={{margin: '0 0 5px 0', fontSize: '1.3rem', color: 'white', letterSpacing:'0.5px'}}>{habito.titulo}</h4>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <span style={{background: 'rgba(255,255,255,0.1)', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold'}}>{meta} días/sem</span>
              <div style={{display:'flex', gap:'5px', marginLeft:'auto'}}>
                  <img src={STATS_CONFIG.gold.icon} style={{width:'25px'}} />
                  {habito.recompensas?.map((r: string) => <img key={r} src={STATS_CONFIG[r as StatTipo]?.icon} style={{width:'25px'}} />)}
              </div>
          </div>
        </div>
        
        <div style={{display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '12px'}}>
          {diasSemana.map(dia => {
              const tieneComentario = comentarios && comentarios[dia];
              return (
                  <div key={dia} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position:'relative'}}>
                      <span style={{fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold'}}>{dia}</span>
                      <div style={{position:'relative'}}>
                          <button onClick={() => toggleDia(habito.id, dia, registro[dia])} style={{width: '32px', height: '32px', borderRadius: '8px', border: 'none', cursor: esHistorial ? 'not-allowed' : 'pointer', background: registro[dia] ? 'var(--secondary)' : 'rgba(255,255,255,0.05)', color: registro[dia] ? 'black' : 'white', boxShadow: registro[dia] ? '0 0 10px var(--secondary)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', transform: registro[dia] ? 'scale(1.1)' : 'scale(1)'}}>{registro[dia] && "✓"}</button>
                          <div onClick={(e) => { e.stopPropagation(); setEditingNote({ habitoId: habito.id, dia, texto: tieneComentario || "" }); }}
                               style={{
                                   position:'absolute', bottom:-10, right:-10, width:'20px', height:'20px', borderRadius:'50%',
                                   background: tieneComentario ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                   color: tieneComentario ? 'black' : 'rgba(255,255,255,0.5)',
                                   border: '1px solid rgba(0,0,0,0.5)', fontSize:'0.7rem', display:'flex', alignItems:'center', justifyContent:'center',
                                   cursor:'pointer', boxShadow: tieneComentario ? '0 0 5px var(--primary)' : 'none', zIndex:2
                               }}>✎</div>
                      </div>
                  </div>
              );
          })}
        </div>
        <div style={{marginTop: '15px', display: 'flex', alignItems: 'center', gap: '10px'}}>
          <div style={{flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px'}}><div style={{width: `${porcentaje}%`, background: 'var(--primary)', height: '100%', borderRadius: '2px', transition: 'width 0.5s', boxShadow: '0 0 5px var(--primary)'}}></div></div>
        </div>
      </div>
    );
  };

  return (
    <div style={{textAlign: 'left', paddingBottom: '50px'}}>
      
      {/* MODAL LEVEL UP */}
      {levelUpModal && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', zIndex:10000, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column'}} onClick={() => setLevelUpModal(null)}>
            <div style={{animation:'popIn 0.5s', textAlign:'center'}}>
                <h1 style={{fontSize:'4rem', color:'var(--secondary)', textShadow:'0 0 30px var(--secondary)', margin:0}}>¡SUBIDA DE NIVEL!</h1>
                <h2 style={{fontSize:'8rem', color:'white', margin:0, lineHeight:1}}>{levelUpModal.newLevel}</h2>
                <button className="btn-primary" style={{marginTop:'30px', fontSize:'1.5rem', padding:'15px 40px'}}>CONTINUAR</button>
            </div>
        </div>
      )}

      {/* MODAL MISIONES FULL (DATA PAD) */}
      {showAllQuests && (
          <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', zIndex:9990, background:'rgba(10, 10, 20, 0.98)', backdropFilter:'blur(10px)', padding:'30px', overflowY:'auto'}}>
              <div style={{maxWidth:'800px', margin:'0 auto'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'40px', borderBottom:'1px solid var(--secondary)', paddingBottom:'20px'}}>
                      <div><h2 style={{fontFamily:'Rajdhani', color:'var(--secondary)', fontSize:'2.5rem', margin:0}}>REGISTRO DE MISIONES</h2><p style={{color:'var(--text-muted)', margin:0}}>Historial de operaciones especiales.</p></div>
                      <button onClick={() => setShowAllQuests(false)} className="btn-link" style={{fontSize:'1.2rem', color:'white', border:'1px solid white', padding:'10px 20px', borderRadius:'10px'}}>CERRAR</button>
                  </div>
                  {misMisiones.length === 0 ? <div style={{textAlign:'center', padding:'50px', color:'gray'}}>Sin registros.</div> : <div style={{display:'grid', gap:'20px'}}>{misMisiones.map(q => renderQuestCard(q, true))}</div>}
              </div>
          </div>
      )}

      {/* MODAL HÁBITOS FULL (DATA PAD DE PROTOCOLOS) */}
      {showAllHabits && (
          <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', zIndex:9990, background:'rgba(10, 10, 20, 0.98)', backdropFilter:'blur(10px)', padding:'30px', overflowY:'auto'}}>
              <div style={{maxWidth:'800px', margin:'0 auto'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'40px', borderBottom:'1px solid var(--primary)', paddingBottom:'20px'}}>
                      <div><h2 style={{fontFamily:'Rajdhani', color:'var(--primary)', fontSize:'2.5rem', margin:0}}>PROTOCOLOS DIARIOS</h2><p style={{color:'var(--text-muted)', margin:0}}>Listado completo de rutinas de mantenimiento.</p></div>
                      <button onClick={() => setShowAllHabits(false)} className="btn-link" style={{fontSize:'1.2rem', color:'white', border:'1px solid white', padding:'10px 20px', borderRadius:'10px'}}>CERRAR</button>
                  </div>
                  {misHabitos.length === 0 ? <div style={{textAlign:'center', padding:'50px', color:'gray'}}>Sin protocolos activos.</div> : <div style={{display:'grid', gap:'20px', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))'}}>{misHabitos.map(h => renderHabitCard(h))}</div>}
              </div>
          </div>
      )}

      {/* MODAL EDITOR NOTA & AVATAR & RECURSOS (Omitido visualmente, igual que antes) */}
       {editingNote && (
          <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', zIndex:10000, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(5px)', display:'flex', justifyContent:'center', alignItems:'center', padding:'20px'}}>
              <div style={{background: 'var(--bg-card)', border: '1px solid var(--secondary)', borderRadius: '20px', padding: '25px', width:'100%', maxWidth:'400px'}}>
                  <h3 style={{color:'var(--secondary)', margin:'0 0 15px 0', fontFamily:'Rajdhani'}}>REFLEXIÓN</h3>
                  <textarea value={editingNote.texto} onChange={e => setEditingNote({...editingNote, texto: e.target.value})} style={{width:'100%', height:'100px', background:'rgba(0,0,0,0.3)', color:'white', padding:'10px', border:'1px solid rgba(255,255,255,0.2)'}} />
                  <div style={{display:'flex', gap:'10px', marginTop:'15px'}}><button onClick={() => setEditingNote(null)} style={{flex:1, color:'white', background:'transparent', border:'1px solid white'}}>CANCELAR</button><button onClick={saveNote} className="btn-primary" style={{flex:1}}>GUARDAR</button></div>
              </div>
          </div>
      )}
       {viewAvatar && (
          <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', zIndex:9999, background:'rgba(0,0,0,0.9)', backdropFilter:'blur(10px)', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', padding:'20px'}} onClick={() => setViewAvatar(false)}>
              <div style={{width:'100%', maxWidth:'500px', background:'var(--bg-card)', border:'var(--glass-border)', borderRadius:'20px', padding:'20px', textAlign:'center', boxShadow:'0 0 50px rgba(6, 182, 212, 0.3)'}} onClick={e => e.stopPropagation()}>
                  <h2 style={{color:'var(--primary)', fontFamily:'Rajdhani', textTransform:'uppercase', fontSize:'2rem', marginBottom:'10px'}}>{etapaVisual.nombreClase}</h2>
                  <div style={{width:'100%', aspectRatio:'1/1', borderRadius:'15px', overflow:'hidden', border:'2px solid var(--primary)', marginBottom:'20px', background:'black'}}>
                    <video src={etapaVisual.imagen} autoPlay loop muted playsInline style={{width:'100%', height:'100%', objectFit:'cover'}} />
                  </div>
                  <p style={{color:'var(--secondary)', fontStyle:'italic', fontSize:'1.1rem', marginBottom:'15px'}}>"{etapaVisual.lema}"</p>
                  <p style={{color:'var(--text-muted)'}}>{etapaVisual.descripcionVisual}</p>
                  <button onClick={() => setViewAvatar(false)} className="btn-primary" style={{marginTop:'20px', width:'100%'}}>CERRAR</button>
              </div>
          </div>
      )}
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
      
      {/* HUD PRINCIPAL */}
      <div style={{background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '20px', padding: '30px 20px', color: 'white', marginBottom: '30px', boxShadow: '0 0 20px rgba(6, 182, 212, 0.2)', border: '1px solid rgba(255,255,255,0.1)'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'30px'}}>
            <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                <div onClick={() => setViewAvatar(true)} style={{width:'80px', height:'80px', borderRadius:'50%', overflow:'hidden', boxShadow:'0 0 15px var(--primary)', border: '2px solid var(--primary)', background: 'black', cursor: 'pointer'}}>
                    <video src={etapaVisual.imagen} autoPlay loop muted playsInline style={{width:'100%', height:'100%', objectFit:'cover'}} />
                </div>
                <div>
                    <h2 style={{margin: 0, fontSize: '1.4rem', fontFamily: 'Rajdhani', color:'var(--primary)'}}>{etapaVisual.nombreClase}</h2>
                    <p style={{margin: 0, fontSize:'0.8rem', color:'var(--text-muted)'}}>Nivel {nivel}</p>
                </div>
            </div>
            <div style={{display:'flex', gap:'15px'}}>
                 <div onClick={() => setSelectedResource({ type: 'gold', value: gold })} style={{textAlign:'right', cursor:'pointer'}}>
                    <div style={{fontSize: '1.5rem', color:'#F59E0B', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'5px'}}><img src={STATS_CONFIG.gold.icon} style={{width:'40px'}} /> {gold}</div>
                 </div>
                 <div onClick={() => setSelectedResource({ type: 'nexo', value: nexo })} style={{textAlign:'right', cursor:'pointer'}}>
                    <div style={{fontSize: '1.5rem', color:'#8B5CF6', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'5px'}}><img src={STATS_CONFIG.nexo.icon} style={{width:'40px'}} /> {nexo}</div>
                 </div>
            </div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', marginBottom:'40px'}}>
            <StatBadge type="vitalidad" value={stats.vitalidad} onClick={() => setSelectedResource({ type: 'vitalidad', value: stats.vitalidad })} />
            <StatBadge type="sabiduria" value={stats.sabiduria} onClick={() => setSelectedResource({ type: 'sabiduria', value: stats.sabiduria })} />
            <StatBadge type="vinculacion" value={stats.vinculacion} onClick={() => setSelectedResource({ type: 'vinculacion', value: stats.vinculacion })} />
        </div>

        <div style={{textAlign:'right', fontSize:'0.7rem', marginBottom:'5px', color:'var(--secondary)'}}>XP: {puntosTotales} / {xpSiguiente}</div>
        <div style={{width: '100%', background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '10px', overflow: 'hidden'}}>
            <div style={{width: `${porcentajeNivel}%`, background: 'var(--secondary)', height: '100%', borderRadius: '10px', transition: 'width 1s ease', boxShadow:'0 0 10px var(--secondary)'}}></div>
        </div>
      </div>

      {/* --- SECCIÓN MISIONES --- */}
      <div style={{marginBottom:'30px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
               <h3 style={{color:'white', fontFamily:'Rajdhani', margin:0, fontSize:'1.5rem'}}>MISIONES ACTIVAS</h3>
               <button onClick={() => setShowAllQuests(true)} className="btn-link" style={{fontSize:'0.9rem'}}>ABRIR DATA PAD</button>
          </div>
          
          {misMisiones.filter(q => q.estado === 'activa').length === 0 ? (
              <div style={{padding:'20px', border:'1px dashed rgba(255,255,255,0.2)', borderRadius:'15px', color:'var(--text-muted)', textAlign:'center'}}>Sin misiones activas.</div>
          ) : (
              <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                  {misMisiones.filter(q => q.estado === 'activa').slice(0, 3).map(q => renderQuestCard(q))}
              </div>
          )}
      </div>

      {/* COFRE SEMANAL */}
      <WeeklyChest habitos={misHabitos} userUid={userUid} psicologoId={psicologoId} userData={userData} />

      {/* --- SECCIÓN PROTOCOLOS DIARIOS (HÁBITOS) --- */}
      <div style={{marginBottom:'30px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
               <h3 style={{color:'white', fontFamily:'Rajdhani', margin:0, fontSize:'1.5rem', textTransform:'uppercase'}}>PROTOCOLOS DIARIOS</h3>
               <button onClick={() => setShowAllHabits(true)} className="btn-link" style={{fontSize:'0.9rem'}}>VER TODOS</button>
          </div>
          
          <div style={{display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'}}>
            {misHabitos.filter(h => h.estado !== 'archivado').slice(0, 3).map(habito => renderHabitCard(habito))}
          </div>
          
          {misHabitos.filter(h => h.estado !== 'archivado').length > 3 && (
              <div style={{textAlign:'center', marginTop:'15px'}}>
                  <button onClick={() => setShowAllHabits(true)} style={{background:'rgba(255,255,255,0.1)', border:'none', color:'var(--text-muted)', padding:'10px 20px', borderRadius:'20px', cursor:'pointer'}}>+ {misHabitos.length - 3} Protocolos restantes...</button>
              </div>
          )}
      </div>

    </div>
  );
}