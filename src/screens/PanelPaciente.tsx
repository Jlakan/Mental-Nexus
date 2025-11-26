import { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { XP_POR_HABITO, TABLA_NIVELES, obtenerNivel, obtenerMetaSiguiente, PERSONAJES, PersonajeTipo } from '../game/GameAssets';

// --- UTILIDADES DE FECHA ---
const getWeekId = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
};
const getWeekLabel = (offset: number) => offset === 0 ? "Semana Actual" : `Hace ${Math.abs(offset)} semanas`;

// Recibe userData para saber qué personaje es
export function PanelPaciente({ userUid, psicologoId, userData }: any) {
  const [misHabitos, setMisHabitos] = useState<any[]>([]);
  
  // Estados del Juego
  const [puntosTotales, setPuntosTotales] = useState(0);
  const [gold, setGold] = useState(0);
  const [stats, setStats] = useState({ vitalidad: 0, sabiduria: 0, carisma: 0 });
  
  const [nivel, setNivel] = useState(1);
  const [xpSiguiente, setXpSiguiente] = useState(100);
  
  const [semanaOffset, setSemanaOffset] = useState(0);
  const currentWeekId = getWeekId(new Date());

  // DATOS DEL AVATAR
  const avatarKey = userData.avatarKey as PersonajeTipo;
  const avatarDef = PERSONAJES[avatarKey] || PERSONAJES['explorador']; // Fallback

  useEffect(() => {
    if (!psicologoId) return; 

    const q = query(collection(db, "users", psicologoId, "pacientes", userUid, "habitos"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Auto-archivado
      lista.forEach(async (h: any) => {
        if (h.ultimaSemanaRegistrada !== currentWeekId) {
            const registroAArchivar = h.registro || { L: false, M: false, X: false, J: false, V: false, S: false, D: false };
            const historialNuevo = { ...h.historial, [h.ultimaSemanaRegistrada || "antiguo"]: registroAArchivar };
            await updateDoc(doc(db, "users", psicologoId, "pacientes", userUid, "habitos", h.id), {
                registro: { L: false, M: false, X: false, J: false, V: false, S: false, D: false },
                historial: historialNuevo,
                ultimaSemanaRegistrada: currentWeekId
            });
        }
      });

      setMisHabitos(lista);
      calcularGamificacion(lista);
    });
    return () => unsubscribe();
  }, [userUid, psicologoId, currentWeekId]);

  const calcularGamificacion = async (habitos: any[]) => {
    let totalChecks = 0;
    let newVitalidad = avatarDef.statsBase.vitalidad; // Empezamos con los base del personaje
    let newSabiduria = avatarDef.statsBase.sabiduria;
    let newCarisma = avatarDef.statsBase.carisma;

    const procesarSemana = (registro: any, recompensas: string[]) => {
        const checks = Object.values(registro).filter(v => v === true).length;
        totalChecks += checks;
        // Stats (1 check = 1 punto de stat si la tarea lo da)
        if (recompensas?.includes('vitalidad')) newVitalidad += checks;
        if (recompensas?.includes('sabiduria')) newSabiduria += checks;
        if (recompensas?.includes('carisma')) newCarisma += checks;
    };

    habitos.forEach(h => {
        procesarSemana(h.registro, h.recompensas);
        if (h.historial) {
            Object.values(h.historial).forEach((semana: any) => procesarSemana(semana, h.recompensas));
        }
    });
    
    const xp = totalChecks * XP_POR_HABITO;
    const oroCalculado = totalChecks * 5; // 5 Oro por hábito

    const nuevoNivel = obtenerNivel(xp);
    const meta = obtenerMetaSiguiente(nuevoNivel);

    setPuntosTotales(xp);
    setGold(oroCalculado);
    setStats({ vitalidad: newVitalidad, sabiduria: newSabiduria, carisma: newCarisma });
    setNivel(nuevoNivel);
    setXpSiguiente(meta);

    // Guardamos stats en BD solo si cambiaron (para no saturar escrituras)
    if (userData.xp !== xp) {
        try {
            await updateDoc(doc(db, "users", psicologoId, "pacientes", userUid), {
                nivel: nuevoNivel,
                gold: oroCalculado,
                xp: xp,
                stats: { vitalidad: newVitalidad, sabiduria: newSabiduria, carisma: newCarisma }
            });
        } catch (e) { console.error("Error sync stats", e); }
    }
  };

  const toggleDia = async (habitoId: string, dia: string, estadoActual: boolean) => {
    if (semanaOffset !== 0) return alert("No puedes modificar el pasado ⏳");
    try {
      const habitoRef = doc(db, "users", psicologoId, "pacientes", userUid, "habitos", habitoId);
      await updateDoc(habitoRef, { [`registro.${dia}`]: !estadoActual });
    } catch (error) { console.error(error); }
  };

  const contarDias = (registro: any) => (!registro ? 0 : Object.values(registro).filter(val => val === true).length);
  const getDatosVisualizacion = (habito: any) => semanaOffset === 0 ? habito.registro : { L: false, M: false, X: false, J: false, V: false, S: false, D: false };
  const diasSemana = ["L", "M", "X", "J", "V", "S", "D"];
  
  // Barra de XP relativa al nivel actual
  const xpPiso = TABLA_NIVELES[nivel - 1] || 0;
  const xpTecho = xpSiguiente;
  const porcentajeNivel = Math.min(100, Math.max(0, Math.round(((puntosTotales - xpPiso) / (xpTecho - xpPiso)) * 100)));

  return (
    <div style={{textAlign: 'left', paddingBottom: '50px'}}>
      
      {/* --- HUD PRINCIPAL (ESTADÍSTICAS) --- */}
      <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
          borderRadius: '20px', padding: '20px', color: 'white', marginBottom: '30px', 
          boxShadow: '0 0 20px rgba(6, 182, 212, 0.2)', border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {/* Nivel y Oro */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'20px'}}>
            <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                {/* AVATAR DEL PERSONAJE */}
                <div style={{
                    background: 'rgba(255,255,255,0.1)', width:'70px', height:'70px', borderRadius:'50%', 
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.5rem', 
                    boxShadow:'0 0 15px var(--primary)', border: '2px solid var(--primary)'
                }}>
                    {avatarDef.emojiBase}
                </div>
                <div>
                    <h2 style={{margin: 0, fontSize: '1.4rem', fontFamily: 'Rajdhani, sans-serif', color:'var(--primary)', textTransform:'uppercase'}}>
                        {avatarDef.nombre}
                    </h2>
                    <p style={{margin: 0, fontSize:'0.9rem', color:'var(--text-muted)'}}>Nivel {nivel}</p>
                </div>
            </div>
            <div style={{textAlign:'right'}}>
                <div style={{fontSize: '1.5rem', color:'#F59E0B', fontWeight:'bold', textShadow:'0 0 10px rgba(245, 158, 11, 0.5)'}}>
                    💰 {gold}
                </div>
                <div style={{fontSize:'0.7rem', color:'var(--text-muted)', letterSpacing:'1px'}}>CRÉDITOS</div>
            </div>
        </div>

        {/* Stats Grid */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'20px'}}>
            <div style={{background:'rgba(239, 68, 68, 0.1)', border:'1px solid rgba(239, 68, 68, 0.3)', borderRadius:'10px', padding:'10px', textAlign:'center'}}>
                <div style={{fontSize:'1.2rem'}}>❤️</div>
                <div style={{fontWeight:'bold', color:'#EF4444', fontSize:'1.1rem'}}>{stats.vitalidad}</div>
                <div style={{fontSize:'0.6rem', opacity:0.7, letterSpacing:'1px'}}>VITALIDAD</div>
            </div>
            <div style={{background:'rgba(59, 130, 246, 0.1)', border:'1px solid rgba(59, 130, 246, 0.3)', borderRadius:'10px', padding:'10px', textAlign:'center'}}>
                <div style={{fontSize:'1.2rem'}}>🧠</div>
                <div style={{fontWeight:'bold', color:'#3B82F6', fontSize:'1.1rem'}}>{stats.sabiduria}</div>
                <div style={{fontSize:'0.6rem', opacity:0.7, letterSpacing:'1px'}}>SABIDURÍA</div>
            </div>
            <div style={{background:'rgba(245, 158, 11, 0.1)', border:'1px solid rgba(245, 158, 11, 0.3)', borderRadius:'10px', padding:'10px', textAlign:'center'}}>
                <div style={{fontSize:'1.2rem'}}>🤝</div>
                <div style={{fontWeight:'bold', color:'#F59E0B', fontSize:'1.1rem'}}>{stats.carisma}</div>
                <div style={{fontSize:'0.6rem', opacity:0.7, letterSpacing:'1px'}}>CARISMA</div>
            </div>
        </div>

        {/* Barra de XP */}
        <div style={{width: '100%', background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '10px', overflow: 'hidden'}}>
            <div style={{width: `${porcentajeNivel}%`, background: 'var(--secondary)', height: '100%', borderRadius: '10px', transition: 'width 1s ease', boxShadow:'0 0 10px var(--secondary)'}}></div>
        </div>
        <div style={{textAlign:'right', fontSize:'0.7rem', marginTop:'5px', color:'var(--secondary)'}}>
            XP: {puntosTotales} / {xpSiguiente}
        </div>
      </div>

      {/* CONTROL TIEMPO */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', background: 'rgba(15, 23, 42, 0.6)', padding: '10px 15px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)'}}>
        <button onClick={() => setSemanaOffset(semanaOffset - 1)} style={{background:'rgba(255,255,255,0.1)', border:'none', width:'40px', height:'40px', borderRadius:'50%', cursor:'pointer', color:'white', fontSize:'1.2rem'}}>⬅</button>
        <div style={{textAlign:'center'}}>
            <span style={{fontWeight:'bold', color:'var(--primary)', fontSize:'1rem', textTransform:'uppercase', letterSpacing:'1px'}}>{getWeekLabel(semanaOffset)}</span>
            <br/><small style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>{semanaOffset === 0 ? "● EN TIEMPO REAL" : "○ MODO HISTORIAL"}</small>
        </div>
        <button onClick={() => semanaOffset < 0 && setSemanaOffset(semanaOffset + 1)} style={{background: semanaOffset === 0 ? 'transparent' : 'rgba(255,255,255,0.1)', border: semanaOffset === 0 ? '1px solid rgba(255,255,255,0.1)' : 'none', width:'40px', height:'40px', borderRadius:'50%', cursor: semanaOffset === 0 ? 'default' : 'pointer', color: semanaOffset === 0 ? 'gray' : 'white', fontSize:'1.2rem'}}>➡</button>
      </div>

      {/* LISTA DE HÁBITOS */}
      <div style={{display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'}}>
        {misHabitos.map(habito => {
          if (habito.estado === 'archivado') return null;
          const datosMostrar = getDatosVisualizacion(habito);
          const diasLogrados = contarDias(datosMostrar);
          const meta = habito.frecuenciaMeta || 7;
          
          const porcentaje = Math.min(100, Math.round((diasLogrados / meta) * 100));
          const logrado = diasLogrados >= meta;
          const esHistorial = semanaOffset < 0;
          
          return (
            <div key={habito.id} style={{
                background: 'var(--bg-card)', padding: '25px', borderRadius: '20px', 
                border: logrado ? '1px solid var(--secondary)' : '1px solid rgba(255,255,255,0.05)',
                position: 'relative', overflow: 'hidden', opacity: esHistorial ? 0.7 : 1,
                boxShadow: logrado ? '0 0 20px rgba(16, 185, 129, 0.1)' : 'none'
            }}>
              {logrado && <div style={{position: 'absolute', top: 0, right: 0, background: 'var(--secondary)', color: 'black', padding: '5px 15px', borderBottomLeftRadius: '15px', fontSize: '0.7rem', fontWeight: 'bold'}}>¡META CUMPLIDA!</div>}

              <div style={{marginBottom: '20px'}}>
                <h4 style={{margin: '0 0 5px 0', fontSize: '1.3rem', color: 'white', letterSpacing:'0.5px'}}>{habito.titulo}</h4>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <span style={{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform:'uppercase'}}>Objetivo:</span>
                    <span style={{background: 'rgba(255,255,255,0.1)', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold'}}>{meta} días/sem</span>
                    
                    <div style={{display:'flex', gap:'3px', marginLeft:'auto'}}>
                        {/* Mostramos las monedas que da */}
                        <span style={{fontSize:'0.8rem', color:'#F59E0B'}}>+5💰</span>
                        {habito.recompensas?.includes('vitalidad') && <span>❤️</span>}
                        {habito.recompensas?.includes('sabiduria') && <span>🧠</span>}
                        {habito.recompensas?.includes('carisma') && <span>🤝</span>}
                    </div>
                </div>
              </div>

              <div style={{display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '12px'}}>
                {diasSemana.map(dia => (
                  <div key={dia} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'}}>
                      <span style={{fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold'}}>{dia}</span>
                      <button onClick={() => toggleDia(habito.id, dia, datosMostrar[dia])}
                        style={{
                          width: '32px', height: '32px', borderRadius: '8px', border: 'none', 
                          cursor: esHistorial ? 'not-allowed' : 'pointer', 
                          background: datosMostrar[dia] ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                          color: datosMostrar[dia] ? 'black' : 'white',
                          boxShadow: datosMostrar[dia] ? '0 0 10px var(--secondary)' : 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s ease', transform: datosMostrar[dia] ? 'scale(1.1)' : 'scale(1)',
                        }}>
                        {datosMostrar[dia] && "✓"}
                      </button>
                  </div>
                ))}
              </div>
              
              <div style={{marginTop: '15px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                <div style={{flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px'}}>
                    <div style={{width: `${porcentaje}%`, background: 'var(--primary)', height: '100%', borderRadius: '2px', transition: 'width 0.5s', boxShadow: '0 0 5px var(--primary)'}}></div>
                </div>
                <span style={{fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold'}}>{diasLogrados} / {meta}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}