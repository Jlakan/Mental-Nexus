import { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { XP_POR_HABITO, TABLA_NIVELES, obtenerNivel, obtenerMetaSiguiente, PERSONAJES, PersonajeTipo, obtenerEtapaActual, STATS_CONFIG } from '../game/GameAssets';

// --- COMPONENTE DE STAT GRANDE ---
const StatBadge = ({ type, value, isGold = false }: { type: 'vitalidad' | 'sabiduria' | 'carisma' | 'gold', value: number, isGold?: boolean }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const config = STATS_CONFIG[type];

    return (
        <div 
            style={{position: 'relative', cursor: 'help', flex: 1}}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowTooltip(!showTooltip)}
        >
            <div style={{
                background: isGold ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.05)', 
                border: isGold ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.2)', 
                borderRadius: '16px', padding: '15px 10px', textAlign: 'center', 
                transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px'
            }}>
                {/* ICONO MÁS GRANDE (50px) */}
                <img src={config.icon} alt={config.label} style={{width: '50px', height: '50px', objectFit:'contain', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))'}} />
                
                <div style={{fontWeight: 'bold', color: isGold ? '#F59E0B' : 'white', fontSize: '1.4rem', lineHeight: 1}}>{value}</div>
                <div style={{fontSize: '0.65rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop:'2px'}}>{isGold ? 'FONDOS' : config.label.split(' ')[0]}</div>
            </div>

            {showTooltip && (
                <div style={{
                    position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(15, 23, 42, 0.98)', border: '1px solid var(--primary)',
                    color: 'white', padding: '15px', borderRadius: '12px', width: '220px', zIndex: 100,
                    fontSize: '0.8rem', boxShadow: '0 4px 30px rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
                    textAlign: 'left'
                }}>
                    <strong style={{color: 'var(--primary)', display: 'block', marginBottom: '5px', fontSize:'0.9rem'}}>{config.label}</strong>
                    <p style={{margin:0, lineHeight:'1.4', color:'var(--text-muted)'}}>{config.desc}</p>
                </div>
            )}
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
const getWeekLabel = (offset: number) => offset === 0 ? "Semana Actual" : `Hace ${Math.abs(offset)} semanas`;

export function PanelPaciente({ userUid, psicologoId, userData }: any) {
  const [misHabitos, setMisHabitos] = useState<any[]>([]);
  const [puntosTotales, setPuntosTotales] = useState(0);
  const [gold, setGold] = useState(0);
  const [stats, setStats] = useState({ vitalidad: 0, sabiduria: 0, carisma: 0 });
  const [nivel, setNivel] = useState(1);
  const [xpSiguiente, setXpSiguiente] = useState(100);
  const [semanaOffset, setSemanaOffset] = useState(0);
  const [viewAvatar, setViewAvatar] = useState(false); // Nuevo estado para el Modal
  const currentWeekId = getWeekId(new Date());

  const avatarKey = userData.avatarKey as PersonajeTipo;
  const avatarDef = PERSONAJES[avatarKey] || PERSONAJES['atlas'];
  const etapaVisual = obtenerEtapaActual(avatarDef, nivel);

  useEffect(() => {
    if (!psicologoId) return; 
    const q = query(collection(db, "users", psicologoId, "pacientes", userUid, "habitos"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMisHabitos(lista);
      calcularGamificacion(lista);
    });
    return () => unsubscribe();
  }, [userUid, psicologoId]);

  const calcularGamificacion = async (habitos: any[]) => {
    let totalChecks = 0;
    let newVitalidad = avatarDef.statsBase.vitalidad;
    let newSabiduria = avatarDef.statsBase.sabiduria;
    let newCarisma = avatarDef.statsBase.carisma;

    const procesarSemana = (registro: any, recompensas: string[]) => {
        const checks = Object.values(registro).filter(v => v === true).length;
        totalChecks += checks;
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
    const oroCalculado = totalChecks * 5;
    const nuevoNivel = obtenerNivel(xp);
    const meta = obtenerMetaSiguiente(nuevoNivel);

    setPuntosTotales(xp);
    setGold(oroCalculado);
    setStats({ vitalidad: newVitalidad, sabiduria: newSabiduria, carisma: newCarisma });
    setNivel(nuevoNivel);
    setXpSiguiente(meta);

    if (userData.xp !== xp) {
        try {
            await updateDoc(doc(db, "users", psicologoId, "pacientes", userUid), {
                nivel: nuevoNivel, gold: oroCalculado, xp: xp,
                stats: { vitalidad: newVitalidad, sabiduria: newSabiduria, carisma: newCarisma }
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

  const contarDias = (registro: any) => (!registro ? 0 : Object.values(registro).filter(val => val === true).length);
  const getDatosVisualizacion = (habito: any) => semanaOffset === 0 ? habito.registro : { L: false, M: false, X: false, J: false, V: false, S: false, D: false };
  const diasSemana = ["L", "M", "X", "J", "V", "S", "D"];
  
  const xpPiso = TABLA_NIVELES[nivel - 1] || 0;
  const xpTecho = xpSiguiente;
  const porcentajeNivel = Math.min(100, Math.max(0, Math.round(((puntosTotales - xpPiso) / (xpTecho - xpPiso)) * 100)));

  return (
    <div style={{textAlign: 'left', paddingBottom: '50px'}}>
      
      {/* MODAL DE AVATAR (ZOOM) */}
      {viewAvatar && (
          <div style={{
              position:'fixed', top:0, left:0, width:'100vw', height:'100vh', zIndex:9999,
              background:'rgba(0,0,0,0.9)', backdropFilter:'blur(10px)',
              display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', padding:'20px'
          }} onClick={() => setViewAvatar(false)}>
              
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

      {/* HUD PRINCIPAL */}
      <div style={{background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '20px', padding: '20px', color: 'white', marginBottom: '30px', boxShadow: '0 0 20px rgba(6, 182, 212, 0.2)', border: '1px solid rgba(255,255,255,0.1)'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'20px'}}>
            <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                
                {/* AVATAR CLICKEABLE */}
                <div 
                    onClick={() => setViewAvatar(true)}
                    style={{
                        width:'80px', height:'80px', borderRadius:'50%', overflow:'hidden', 
                        boxShadow:'0 0 15px var(--primary)', border: '2px solid var(--primary)', 
                        background: 'black', cursor: 'pointer', transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
                >
                    <video src={etapaVisual.imagen} autoPlay loop muted playsInline style={{width:'100%', height:'100%', objectFit:'cover'}} />
                </div>

                <div>
                    <h2 style={{margin: 0, fontSize: '1.4rem', fontFamily: 'Rajdhani, sans-serif', color:'var(--primary)', textTransform:'uppercase'}}>{etapaVisual.nombreClase}</h2>
                    <p style={{margin: 0, fontSize:'0.8rem', color:'var(--text-muted)'}}>Nivel {nivel} | {puntosTotales} XP</p>
                </div>
            </div>
            
            {/* ORO GRANDE */}
            <StatBadge type="gold" value={gold} isGold />
        </div>

        {/* STATS GRID (GRANDES) */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', marginBottom:'20px'}}>
            <StatBadge type="vitalidad" value={stats.vitalidad} />
            <StatBadge type="sabiduria" value={stats.sabiduria} />
            <StatBadge type="carisma" value={stats.carisma} />
        </div>

        {/* Barra XP */}
        <div style={{width: '100%', background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '10px', overflow: 'hidden'}}>
            <div style={{width: `${porcentajeNivel}%`, background: 'var(--secondary)', height: '100%', borderRadius: '10px', transition: 'width 1s ease', boxShadow:'0 0 10px var(--secondary)'}}></div>
        </div>
      </div>

      {/* CONTROL TIEMPO */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', background: 'rgba(15, 23, 42, 0.6)', padding: '10px 15px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)'}}>
        <button onClick={() => setSemanaOffset(semanaOffset - 1)} style={{background:'rgba(255,255,255,0.1)', border:'none', width:'40px', height:'40px', borderRadius:'50%', cursor:'pointer', color:'white', fontSize:'1.2rem'}}>⬅</button>
        <div style={{textAlign:'center'}}>
            <span style={{fontWeight:'bold', color:'var(--primary)', fontSize:'1rem', textTransform:'uppercase', letterSpacing:'1px'}}>{getWeekLabel(semanaOffset)}</span>
        </div>
        <button onClick={() => semanaOffset < 0 && setSemanaOffset(semanaOffset + 1)} style={{background: 'rgba(255,255,255,0.1)', border: 'none', width:'40px', height:'40px', borderRadius:'50%', cursor: 'pointer', color: 'white', fontSize:'1.2rem'}}>➡</button>
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
            <div key={habito.id} style={{background: 'var(--bg-card)', padding: '25px', borderRadius: '20px', border: logrado ? '1px solid var(--secondary)' : '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden', opacity: esHistorial ? 0.7 : 1, boxShadow: logrado ? '0 0 20px rgba(16, 185, 129, 0.1)' : 'none'}}>
              <div style={{marginBottom: '20px'}}>
                <h4 style={{margin: '0 0 5px 0', fontSize: '1.3rem', color: 'white', letterSpacing:'0.5px'}}>{habito.titulo}</h4>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <span style={{background: 'rgba(255,255,255,0.1)', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold'}}>{meta} días/sem</span>
                    <div style={{display:'flex', gap:'5px', marginLeft:'auto'}}>
                        <img src="/recursos.png" style={{width:'20px'}} title="+5 Fondos" />
                        {habito.recompensas?.includes('vitalidad') && <img src={STATS_CONFIG.vitalidad.icon} style={{width:'20px'}} />}
                        {habito.recompensas?.includes('sabiduria') && <img src={STATS_CONFIG.sabiduria.icon} style={{width:'20px'}} />}
                        {habito.recompensas?.includes('carisma') && <img src={STATS_CONFIG.carisma.icon} style={{width:'20px'}} />}
                    </div>
                </div>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '12px'}}>
                {diasSemana.map(dia => (
                  <div key={dia} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'}}>
                      <span style={{fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold'}}>{dia}</span>
                      <button onClick={() => toggleDia(habito.id, dia, datosMostrar[dia])} style={{width: '32px', height: '32px', borderRadius: '8px', border: 'none', cursor: esHistorial ? 'not-allowed' : 'pointer', background: datosMostrar[dia] ? 'var(--secondary)' : 'rgba(255,255,255,0.05)', color: datosMostrar[dia] ? 'black' : 'white', boxShadow: datosMostrar[dia] ? '0 0 10px var(--secondary)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', transform: datosMostrar[dia] ? 'scale(1.1)' : 'scale(1)'}}>{datosMostrar[dia] && "✓"}</button>
                  </div>
                ))}
              </div>
              <div style={{marginTop: '15px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                <div style={{flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px'}}><div style={{width: `${porcentaje}%`, background: 'var(--primary)', height: '100%', borderRadius: '2px', transition: 'width 0.5s', boxShadow: '0 0 5px var(--primary)'}}></div></div>
                <span style={{fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold'}}>{diasLogrados}/{meta}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}