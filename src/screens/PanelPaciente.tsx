import { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { XP_POR_HABITO, MAESTRIA_POR_HABITO, TABLA_NIVELES, obtenerNivel, obtenerMetaSiguiente, calcularDetalleStat, PERSONAJES, PersonajeTipo, obtenerEtapaActual, STATS_CONFIG, StatTipo } from '../game/GameAssets';
import { WeeklyChest } from '../components/WeeklyChest';

// --- COMPONENTE DE STAT AVANZADO (Con barra de progreso) ---
const StatBadge = ({ type, rawPoints, onClick }: { type: StatTipo, rawPoints: number, onClick: () => void }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const config = STATS_CONFIG[type];
    
    // Calculamos nivel y barra basados en los puntos crudos (Maestría)
    const detalle = calcularDetalleStat(rawPoints);

    return (
        <div 
            onClick={onClick}
            style={{
                position: 'relative', cursor: 'pointer', flex: 1,
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '16px', padding: '15px 5px', textAlign: 'center', 
                transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                height: '100%', justifyContent: 'space-between'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
        >
            {/* ICONO */}
            <img src={config.icon} alt={config.label} style={{width: '50px', height: '50px', objectFit:'contain', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))'}} />
            
            {/* NIVEL PRINCIPAL */}
            <div style={{fontWeight: 'bold', color: 'white', fontSize: '1.8rem', lineHeight: 1, textShadow: `0 0 10px ${config.color}`}}>
                {detalle.nivel}
            </div>
            
            {/* BARRA DE PROGRESO DE MAESTRÍA */}
            <div style={{width: '80%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginTop:'5px'}}>
                <div style={{width: `${detalle.progreso}%`, height: '100%', background: config.color, transition: 'width 0.5s'}}></div>
            </div>
            
            <div style={{fontSize: '0.6rem', opacity: 0.6, textTransform: 'uppercase', marginTop:'2px'}}>
                {config.label.split(' ')[0]}
            </div>

            {showTooltip && (
                // ... (Tooltip igual que antes) ...
                <div style={{
                    position: 'fixed', top:0, left:0, width:'100vw', height:'100vh', zIndex:9999, background:'rgba(0,0,0,0.85)',
                    display:'flex', justifyContent:'center', alignItems:'center', padding:'20px'
                }} onClick={(e) => {e.stopPropagation(); setShowTooltip(false);}}>
                    {/* ... Contenido del modal ... */}
                </div>
            )}
        </div>
    );
};

// ... (Utilidades de fecha igual) ...
const getWeekId = (date: Date) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7)); const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1)); return `${d.getUTCFullYear()}-W${Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7)}`; };
const getWeekLabel = (offset: number) => offset === 0 ? "SEMANA ACTUAL" : `HACE ${Math.abs(offset)} SEMANAS`;

export function PanelPaciente({ userUid, psicologoId, userData }: any) {
  const [misHabitos, setMisHabitos] = useState<any[]>([]);
  
  // ESTADOS: Ahora guardamos Puntos de Maestría (Raw), no niveles directos
  const [puntosTotales, setPuntosTotales] = useState(0);
  const [gold, setGold] = useState(0);
  const [nexo, setNexo] = useState(0);
  
  // Stats ahora son Puntos de Maestría acumulados
  const [maestria, setMaestria] = useState({ vitalidad: 0, sabiduria: 0, vinculacion: 0 });
  
  const [nivel, setNivel] = useState(1);
  const [xpSiguiente, setXpSiguiente] = useState(100);
  const [semanaOffset, setSemanaOffset] = useState(0);
  const [viewAvatar, setViewAvatar] = useState(false);
  const [selectedResource, setSelectedResource] = useState<{ type: StatTipo, value: number } | null>(null);

  const currentWeekId = getWeekId(new Date());
  const avatarKey = userData.avatarKey as PersonajeTipo;
  const avatarDef = PERSONAJES[avatarKey] || PERSONAJES['atlas'];
  const etapaVisual = obtenerEtapaActual(avatarDef, nivel);

  useEffect(() => {
    if (!psicologoId) return; 
    const userRef = doc(db, "users", psicologoId, "pacientes", userUid);
    const unsubUser = onSnapshot(userRef, (docSnap) => { if(docSnap.exists()) setNexo(docSnap.data().nexo || 0); });

    const q = query(collection(db, "users", psicologoId, "pacientes", userUid, "habitos"));
    const unsubHabits = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // ... (Auto-archivado igual) ...
      lista.forEach(async (h: any) => { if (h.ultimaSemanaRegistrada !== currentWeekId) { /* ... */ } });

      setMisHabitos(lista);
      calcularGamificacion(lista);
    });
    return () => { unsubUser(); unsubHabits(); };
  }, [userUid, psicologoId, currentWeekId]);

  const calcularGamificacion = async (habitos: any[]) => {
    let totalChecks = 0;
    
    // Base de maestría del personaje (Ej: 100 pts iniciales para Nivel 1)
    // Multiplicamos el stat base x 100 para darles un "colchón" inicial
    let maestriaVitalidad = avatarDef.statsBase.vitalidad * 100;
    let maestriaSabiduria = avatarDef.statsBase.sabiduria * 100;
    let maestriaVinculacion = avatarDef.statsBase.vinculacion * 100;

    const procesarSemana = (registro: any, recompensas: string[]) => {
        const checks = Object.values(registro).filter(v => v === true).length;
        totalChecks += checks;
        
        // LÓGICA NUEVA: Sumamos +15 Puntos de Maestría por check
        if (recompensas?.includes('vitalidad')) maestriaVitalidad += (checks * MAESTRIA_POR_HABITO);
        if (recompensas?.includes('sabiduria')) maestriaSabiduria += (checks * MAESTRIA_POR_HABITO);
        if (recompensas?.includes('vinculacion')) maestriaVinculacion += (checks * MAESTRIA_POR_HABITO);
    };

    habitos.forEach(h => {
        procesarSemana(h.registro, h.recompensas);
        if (h.historial) Object.values(h.historial).forEach((semana: any) => procesarSemana(semana, h.recompensas));
    });
    
    const xp = (totalChecks * XP_POR_HABITO) + (userData.bonusXP || 0);
    const oroCalculado = (totalChecks * 5) + (userData.gold || 0); // Usamos lo guardado si hay

    const nuevoNivel = obtenerNivel(xp);
    const meta = obtenerMetaSiguiente(nuevoNivel);

    setPuntosTotales(xp);
    setGold(oroCalculado);
    setMaestria({ vitalidad: maestriaVitalidad, sabiduria: maestriaSabiduria, vinculacion: maestriaVinculacion });
    setNivel(nuevoNivel);
    setXpSiguiente(meta);

    // Guardamos los puntos crudos en la BD
    if (userData.xp !== xp) {
        try {
            await updateDoc(doc(db, "users", psicologoId, "pacientes", userUid), {
                nivel: nuevoNivel, gold: oroCalculado, xp: xp,
                // Guardamos la maestría cruda para que persista
                maestria: { vitalidad: maestriaVitalidad, sabiduria: maestriaSabiduria, vinculacion: maestriaVinculacion }
            });
        } catch (e) { console.error(e); }
    }
  };

  // ... (Funciones auxiliares igual) ...
  const toggleDia = async (habitoId: string, dia: string, estadoActual: boolean) => {
    if (semanaOffset !== 0) return alert("Solo lectura");
    try {
      const habitoRef = doc(db, "users", psicologoId, "pacientes", userUid, "habitos", habitoId);
      await updateDoc(habitoRef, { [`registro.${dia}`]: !estadoActual });
    } catch (error) { console.error(error); }
  };
  const contarDias = (r: any) => (!r ? 0 : Object.values(r).filter(v => v === true).length);
  const getDatosVisualizacion = (h: any) => semanaOffset === 0 ? h.registro : { L: false, M: false, X: false, J: false, V: false, S: false, D: false };
  const diasSemana = ["L", "M", "X", "J", "V", "S", "D"];
  const xpPiso = TABLA_NIVELES[nivel - 1] || 0;
  const porcentajeNivel = Math.min(100, Math.max(0, Math.round(((puntosTotales - xpPiso) / (xpSiguiente - xpPiso)) * 100)));

  return (
    <div style={{textAlign: 'left', paddingBottom: '50px'}}>
      
      {/* MODALES (Avatar y Recurso) */}
      {viewAvatar && <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.9)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center'}} onClick={()=>setViewAvatar(false)}><div style={{color:'white'}}>AVATAR ZOOM (Video)</div></div>}
      
      {selectedResource && (
          <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', zIndex:9999, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(15px)', display:'flex', justifyContent:'center', alignItems:'center', padding:'20px'}} onClick={() => setSelectedResource(null)}>
              <div style={{background: 'var(--bg-card)', border: 'var(--glass-border)', borderRadius: '20px', padding: '40px', textAlign: 'center', maxWidth: '600px', width:'100%', boxShadow: '0 0 80px rgba(6, 182, 212, 0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center'}} onClick={e => e.stopPropagation()}>
                  {/* Usamos calcularDetalleStat para mostrar el progreso en el modal también */}
                  <h2 style={{color: 'white', fontFamily: 'Rajdhani', textTransform:'uppercase', fontSize:'2.5rem', marginBottom:'30px'}}>{STATS_CONFIG[selectedResource.type].label}</h2>
                  <img src={STATS_CONFIG[selectedResource.type].icon} style={{width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '30vh', marginBottom: '30px'}} />
                  
                  {selectedResource.type !== 'gold' && selectedResource.type !== 'nexo' ? (
                      <div style={{textAlign:'center'}}>
                          <div style={{fontSize: '4rem', fontWeight: 'bold', color: 'white', lineHeight: 1}}>Nivel {calcularDetalleStat(selectedResource.value).nivel}</div>
                          <div style={{color: 'var(--primary)', fontSize:'1.2rem'}}>Progreso: {calcularDetalleStat(selectedResource.value).progreso}%</div>
                      </div>
                  ) : (
                      <div style={{fontSize: '4rem', fontWeight: 'bold', color: '#F59E0B'}}>{selectedResource.value}</div>
                  )}
                  
                  <p style={{color: 'var(--text-muted)', fontSize: '1.2rem', marginTop:'20px'}}>{STATS_CONFIG[selectedResource.type].desc}</p>
                  <button onClick={() => setSelectedResource(null)} className="btn-primary" style={{marginTop: '40px', width: '200px'}}>ENTENDIDO</button>
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
                    <h2 style={{margin: 0, fontSize: '1.4rem', fontFamily: 'Rajdhani, sans-serif', color:'var(--primary)', textTransform:'uppercase'}}>{etapaVisual.nombreClase}</h2>
                    <p style={{margin: 0, fontSize:'0.8rem', color:'var(--text-muted)'}}>Nivel {nivel} | {puntosTotales} XP</p>
                </div>
            </div>
            
            <div style={{display:'flex', gap:'15px'}}>
                <div onClick={() => setSelectedResource({ type: 'gold', value: gold })} style={{textAlign:'right', minWidth:'80px', cursor:'pointer'}}>
                    <div style={{fontSize: '1.5rem', color:'#F59E0B', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'5px'}}><img src={STATS_CONFIG.gold.icon} style={{width:'50px'}} />{gold}</div>
                </div>
                <div onClick={() => setSelectedResource({ type: 'nexo', value: nexo })} style={{textAlign:'right', minWidth:'80px', cursor:'pointer'}}>
                    <div style={{fontSize: '1.5rem', color:'#8B5CF6', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'5px'}}><img src={STATS_CONFIG.nexo.icon} style={{width:'50px'}} />{nexo}</div>
                </div>
            </div>
        </div>

        {/* STATS GRID (AHORA CON BARRAS DE PROGRESO) */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', marginBottom:'25px'}}>
            <StatBadge type="vitalidad" value={maestria.vitalidad} onClick={() => setSelectedResource({ type: 'vitalidad', value: maestria.vitalidad })} />
            <StatBadge type="sabiduria" value={maestria.sabiduria} onClick={() => setSelectedResource({ type: 'sabiduria', value: maestria.sabiduria })} />
            <StatBadge type="vinculacion" value={maestria.vinculacion} onClick={() => setSelectedResource({ type: 'vinculacion', value: maestria.vinculacion })} />
        </div>

        {/* Barra XP Global */}
        <div style={{width: '100%', background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '10px', overflow: 'hidden'}}>
            <div style={{width: `${porcentajeNivel}%`, background: 'var(--secondary)', height: '100%'}}></div>
        </div>
      </div>

      <WeeklyChest habitos={misHabitos} userUid={userUid} psicologoId={psicologoId} userData={userData} />

      {/* CONTROL TIEMPO */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', background: 'rgba(15, 23, 42, 0.6)', padding: '10px 15px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)'}}>
        <button onClick={() => setSemanaOffset(semanaOffset - 1)} style={{background:'transparent', border:'none', color:'white', fontSize:'1.2rem'}}>⬅</button>
        <div style={{fontWeight:'bold', color:'var(--primary)'}}>{getWeekLabel(semanaOffset)}</div>
        <button onClick={() => semanaOffset < 0 && setSemanaOffset(semanaOffset + 1)} style={{background:'transparent', border:'none', color:'white', fontSize:'1.2rem'}}>➡</button>
      </div>

      {/* LISTA DE HÁBITOS (Igual) */}
      <div style={{display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'}}>
        {misHabitos.map(habito => {
          if (habito.estado === 'archivado') return null;
          const datosMostrar = getDatosVisualizacion(habito);
          const diasLogrados = contarDias(datosMostrar);
          const meta = habito.frecuenciaMeta || 7;
          const porcentaje = Math.min(100, Math.round((diasLogrados / meta) * 100));
          const logrado = diasLogrados >= meta;
          
          return (
            <div key={habito.id} style={{background: 'var(--bg-card)', padding: '25px', borderRadius: '20px', border: logrado ? '1px solid var(--secondary)' : '1px solid rgba(255,255,255,0.05)'}}>
              <div style={{marginBottom: '20px'}}>
                <h4 style={{margin: '0 0 5px 0', fontSize: '1.3rem', color: 'white'}}>{habito.titulo}</h4>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <span style={{background: 'rgba(255,255,255,0.1)', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold'}}>{meta} días/sem</span>
                    <div style={{display:'flex', gap:'5px', marginLeft:'auto'}}>
                        <img src={STATS_CONFIG.gold.icon} style={{width:'25px'}} />
                        {habito.recompensas?.includes('vitalidad') && <img src={STATS_CONFIG.vitalidad.icon} style={{width:'25px'}} />}
                        {habito.recompensas?.includes('sabiduria') && <img src={STATS_CONFIG.sabiduria.icon} style={{width:'25px'}} />}
                        {habito.recompensas?.includes('vinculacion') && <img src={STATS_CONFIG.vinculacion.icon} style={{width:'25px'}} />}
                    </div>
                </div>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '12px'}}>
                {diasSemana.map(dia => (
                  <div key={dia} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'}}>
                      <span style={{fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold'}}>{dia}</span>
                      <button onClick={() => toggleDia(habito.id, dia, datosMostrar[dia])} style={{width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: datosMostrar[dia] ? 'var(--secondary)' : 'rgba(255,255,255,0.05)', color: datosMostrar[dia] ? 'black' : 'white'}}>{datosMostrar[dia] && "✓"}</button>
                  </div>
                ))}
              </div>
              <div style={{marginTop: '15px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                <div style={{flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px'}}><div style={{width: `${porcentaje}%`, background: 'var(--primary)', height: '100%'}}></div></div>
                <span style={{fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold'}}>{diasLogrados}/{meta}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}