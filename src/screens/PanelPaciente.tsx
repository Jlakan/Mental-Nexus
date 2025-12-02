import { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { XP_POR_HABITO, TABLA_NIVELES, obtenerNivel, obtenerMetaSiguiente, PERSONAJES, PersonajeTipo, obtenerEtapaActual, STATS_CONFIG, StatTipo } from '../game/GameAssets';
import { WeeklyChest } from '../components/WeeklyChest';

// --- CONFIGURACIÓN DE BALANCE ---
const FACTOR_GANANCIA_STAT = 0.15; // 0.15 puntos por check

// --- COMPONENTE DE STAT CON BARRA DE PROGRESO ---
const StatBadge = ({ type, value, onClick }: { type: StatTipo, value: number, onClick: () => void }) => {
    const config = STATS_CONFIG[type];
    // @ts-ignore
    const color = config.color || 'white';
    
    const valorEntero = Math.floor(value);
    const progresoDecimal = value - valorEntero;
    const porcentajeBarra = Math.min(100, Math.max(0, Math.round(progresoDecimal * 100)));

    return (
        <div 
            onClick={onClick}
            style={{
                position: 'relative', cursor: 'pointer', flex: 1,
                background: 'rgba(255,255,255,0.05)', 
                border: `1px solid ${color}40`,
                borderRadius: '16px', padding: '15px 5px', textAlign: 'center', 
                transition: 'transform 0.1s, box-shadow 0.2s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                height: '100%', justifyContent: 'center'
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

  // REFERENCIAS PARA DETECTAR CAMBIOS
  const prevLevelRef = useRef(1);

  const currentWeekId = getWeekId(new Date());
  const avatarKey = userData.avatarKey as PersonajeTipo;
  const avatarDef = PERSONAJES[avatarKey] || PERSONAJES['atlas'];
  const etapaVisual = obtenerEtapaActual(avatarDef, nivel);

  useEffect(() => {
    if (!psicologoId) return; 

    // 1. ESCUCHAMOS EL PERFIL (Para bonusGold, goldSpent, nexo, etc.)
    const userRef = doc(db, "users", psicologoId, "pacientes", userUid);
    const unsubUser = onSnapshot(userRef, (docSnap) => {
        if(docSnap.exists()) {
            const data = docSnap.data();
            // Actualizamos Nexo directo porque es moneda rara
            setNexo(data.nexo || 0);
            
            // Si hay hábitos cargados, recalculamos toda la economía con los nuevos datos del perfil
            if (misHabitos.length > 0) {
                calcularGamificacion(misHabitos, data);
            }
        }
    });

    // 2. ESCUCHAMOS LOS HÁBITOS
    const q = query(collection(db, "users", psicologoId, "pacientes", userUid, "habitos"));
    const unsubHabits = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // AUTO-ARCHIVADO DE SEMANA
      lista.forEach(async (h: any) => {
        if (h.ultimaSemanaRegistrada && h.ultimaSemanaRegistrada !== currentWeekId) {
            const registroAArchivar = h.registro || { L: false, M: false, X: false, J: false, V: false, S: false, D: false };
            const historialNuevo = { ...h.historial, [h.ultimaSemanaRegistrada]: registroAArchivar };
            await updateDoc(doc(db, "users", psicologoId, "pacientes", userUid, "habitos", h.id), {
                registro: { L: false, M: false, X: false, J: false, V: false, S: false, D: false },
                historial: historialNuevo,
                ultimaSemanaRegistrada: currentWeekId
            });
        } else if (!h.ultimaSemanaRegistrada) {
            // Primer inicio
            await updateDoc(doc(db, "users", psicologoId, "pacientes", userUid, "habitos", h.id), { ultimaSemanaRegistrada: currentWeekId });
        }
      });

      setMisHabitos(lista);
      // Calculamos usando los datos actuales de userData (que pueden venir por props o estar actualizados en el listener anterior)
      calcularGamificacion(lista, userData); 
    });

    return () => { unsubUser(); unsubHabits(); };
  }, [userUid, psicologoId, currentWeekId]);

  // MOTOR DE CÁLCULO
  const calcularGamificacion = async (habitos: any[], currentProfileData: any) => {
    let totalVitalidad = avatarDef.statsBase.vitalidad;
    let totalSabiduria = avatarDef.statsBase.sabiduria;
    let totalVinculacion = avatarDef.statsBase.vinculacion;
    let totalGold = 0;
    let totalXP = 0;

    const sumarSemana = (registro: any, recompensas: string[]) => {
        const checks = Object.values(registro).filter(v => v === true).length;
        
        totalXP += (checks * XP_POR_HABITO);
        totalGold += (checks * 5); // 5 de oro base por hábito
        const statGanado = checks * FACTOR_GANANCIA_STAT;

        if (recompensas?.includes('vitalidad')) totalVitalidad += statGanado;
        if (recompensas?.includes('sabiduria')) totalSabiduria += statGanado;
        if (recompensas?.includes('vinculacion')) totalVinculacion += statGanado;
    };

    habitos.forEach(h => {
        sumarSemana(h.registro, h.recompensas);
        if (h.historial) Object.values(h.historial).forEach((semana: any) => sumarSemana(semana, h.recompensas));
    });

    // --- SUMAR BONOS (COFRES) ---
    // Usamos currentProfileData para asegurar que leemos lo último de Firebase
    const bonos = currentProfileData.bonusStats || {};
    totalXP += (currentProfileData.bonusXP || 0);
    totalGold += (currentProfileData.bonusGold || 0); // <--- AQUÍ SE SUMAN TUS 200 DEL COFRE
    
    totalVitalidad += (bonos.vitalidad || 0);
    totalSabiduria += (bonos.sabiduria || 0);
    totalVinculacion += (bonos.vinculacion || 0);

    // --- RESTAR GASTOS (TIENDA) ---
    const gastos = currentProfileData.goldSpent || 0;
    totalGold = Math.max(0, totalGold - gastos);

    // CALCULAR NIVEL
    const nuevoNivel = obtenerNivel(totalXP);
    const meta = obtenerMetaSiguiente(nuevoNivel);

    // DETECTAR LEVEL UP
    if (nuevoNivel > prevLevelRef.current) {
        setLevelUpModal({ show: true, newLevel: nuevoNivel });
        const audio = new Audio('/levelup.mp3'); // Opcional si tienes sonido
        audio.play().catch(e => {}); 
    }
    prevLevelRef.current = nuevoNivel;

    // ACTUALIZAR ESTADO LOCAL
    setPuntosTotales(totalXP);
    setGold(totalGold);
    setStats({ 
        vitalidad: Number(totalVitalidad.toFixed(2)), 
        sabiduria: Number(totalSabiduria.toFixed(2)), 
        vinculacion: Number(totalVinculacion.toFixed(2)) 
    });
    setNivel(nuevoNivel);
    setXpSiguiente(meta);

    // ACTUALIZAR BASE DE DATOS (Solo totales)
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

  const contarDias = (registro: any) => (!registro ? 0 : Object.values(registro).filter(val => val === true).length);
  const getDatosVisualizacion = (habito: any) => semanaOffset === 0 ? habito.registro : { L: false, M: false, X: false, J: false, V: false, S: false, D: false };
  const diasSemana = ["L", "M", "X", "J", "V", "S", "D"];
  
  const xpPiso = TABLA_NIVELES[nivel - 1] || 0;
  const xpTecho = xpSiguiente;
  const porcentajeNivel = Math.min(100, Math.max(0, Math.round(((puntosTotales - xpPiso) / (xpTecho - xpPiso)) * 100)));

  return (
    <div style={{textAlign: 'left', paddingBottom: '50px'}}>
      
      {/* MODAL LEVEL UP */}
      {levelUpModal && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', zIndex:10000, background:'rgba(0,0,0,0.9)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column'}} onClick={() => setLevelUpModal(null)}>
            <div style={{animation:'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)', textAlign:'center'}}>
                <h1 style={{fontSize:'4rem', color:'var(--secondary)', textShadow:'0 0 30px var(--secondary)', margin:0}}>¡SUBIDA DE NIVEL!</h1>
                <h2 style={{fontSize:'8rem', color:'white', margin:0, lineHeight:1}}>{levelUpModal.newLevel}</h2>
                <p style={{color:'var(--text-muted)', fontSize:'1.5rem'}}>Sistemas Actualizados</p>
                <button className="btn-primary" style={{marginTop:'30px', fontSize:'1.5rem', padding:'15px 40px'}}>CONTINUAR</button>
            </div>
        </div>
      )}

      {/* MODAL AVATAR */}
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

      {/* MODAL RECURSO */}
      {selectedResource && (
          <div style={{position:'fixed', top:0, left:0, width:'100vw', height:'100vh', zIndex:9999, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(15px)', display:'flex', justifyContent:'center', alignItems:'center', padding:'20px'}} onClick={() => setSelectedResource(null)}>
              <div style={{background: 'var(--bg-card)', border: 'var(--glass-border)', borderRadius: '20px', padding: '40px', textAlign: 'center', maxWidth: '600px', width:'100%', boxShadow: '0 0 80px rgba(6, 182, 212, 0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center'}} onClick={e => e.stopPropagation()}>
                  <h2 style={{color: selectedResource.type === 'gold' ? '#F59E0B' : (selectedResource.type === 'nexo' ? '#8B5CF6' : 'white'), fontFamily: 'Rajdhani', textTransform:'uppercase', fontSize:'2.5rem', marginBottom:'30px', textShadow: '0 0 20px rgba(0,0,0,0.5)'}}>{STATS_CONFIG[selectedResource.type].label}</h2>
                  <img src={STATS_CONFIG[selectedResource.type].icon} style={{width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '40vh', marginBottom: '30px', filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.1))'}} />
                  <div style={{fontSize: '4rem', fontWeight: 'bold', color: 'white', marginBottom: '10px', lineHeight: 1}}>
                    {Math.floor(selectedResource.value)}
                    <span style={{fontSize:'1.5rem', color:'var(--text-muted)'}}>
                        .{Math.round((selectedResource.value - Math.floor(selectedResource.value))*100)}
                    </span>
                  </div>
                  <p style={{color: 'var(--text-muted)', fontSize: '1.2rem', lineHeight: '1.6', maxWidth: '80%'}}>{STATS_CONFIG[selectedResource.type].desc}</p>
                  <button onClick={() => setSelectedResource(null)} className="btn-primary" style={{marginTop: '40px', width: '200px', fontSize: '1.1rem'}}>ENTENDIDO</button>
              </div>
          </div>
      )}

      {/* HUD PRINCIPAL */}
      <div style={{background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '20px', padding: '30px 20px', color: 'white', marginBottom: '30px', boxShadow: '0 0 20px rgba(6, 182, 212, 0.2)', border: '1px solid rgba(255,255,255,0.1)'}}>
        
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'30px'}}>
            <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                <div onClick={() => setViewAvatar(true)} style={{width:'80px', height:'80px', borderRadius:'50%', overflow:'hidden', boxShadow:'0 0 15px var(--primary)', border: '2px solid var(--primary)', background: 'black', cursor: 'pointer', transition: 'transform 0.2s'}} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}>
                    <video src={etapaVisual.imagen} autoPlay loop muted playsInline style={{width:'100%', height:'100%', objectFit:'cover'}} />
                </div>
                <div>
                    <h2 style={{margin: 0, fontSize: '1.4rem', fontFamily: 'Rajdhani, sans-serif', color:'var(--primary)', textTransform:'uppercase'}}>{etapaVisual.nombreClase}</h2>
                    <p style={{margin: 0, fontSize:'0.8rem', color:'var(--text-muted)'}}>Nivel {nivel} | {puntosTotales} XP</p>
                </div>
            </div>
            
            <div style={{display:'flex', gap:'15px'}}>
                <div onClick={() => setSelectedResource({ type: 'gold', value: gold })} style={{textAlign:'right', minWidth:'80px', cursor:'pointer', transition:'transform 0.1s'}} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}>
                    <div style={{fontSize: '1.5rem', color:'#F59E0B', fontWeight:'bold', textShadow:'0 0 10px rgba(245, 158, 11, 0.5)', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'5px'}}>
                        <img src={STATS_CONFIG.gold.icon} style={{width:'50px', height:'50px', objectFit:'contain'}} />
                        {gold}
                    </div>
                    <div className="text-shine" style={{fontSize:'0.6rem', color:'#F59E0B', letterSpacing:'1px', marginTop:'5px', textTransform:'uppercase', fontWeight:'bold'}}>FONDOS</div>
                </div>
                <div onClick={() => setSelectedResource({ type: 'nexo', value: nexo })} style={{textAlign:'right', minWidth:'80px', cursor:'pointer', transition:'transform 0.1s'}} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}>
                    <div style={{fontSize: '1.5rem', color:'#8B5CF6', fontWeight:'bold', textShadow:'0 0 10px rgba(139, 92, 246, 0.5)', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'5px'}}>
                        <img src={STATS_CONFIG.nexo.icon} style={{width:'50px', height:'50px', objectFit:'contain'}} />
                        {nexo}
                    </div>
                    <div className="text-shine" style={{fontSize:'0.6rem', color:'#8B5CF6', letterSpacing:'1px', marginTop:'5px', textTransform:'uppercase', fontWeight:'bold'}}>NEXOS</div>
                </div>
            </div>
        </div>

        {/* STATS GRID */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', marginBottom:'40px'}}>
            <StatBadge type="vitalidad" value={stats.vitalidad} onClick={() => setSelectedResource({ type: 'vitalidad', value: stats.vitalidad })} />
            <StatBadge type="sabiduria" value={stats.sabiduria} onClick={() => setSelectedResource({ type: 'sabiduria', value: stats.sabiduria })} />
            <StatBadge type="vinculacion" value={stats.vinculacion} onClick={() => setSelectedResource({ type: 'vinculacion', value: stats.vinculacion })} />
        </div>

        {/* Barra XP */}
        <div style={{textAlign:'right', fontSize:'0.7rem', marginBottom:'5px', color:'var(--secondary)'}}>XP: {puntosTotales} / {xpSiguiente}</div>
        <div style={{width: '100%', background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '10px', overflow: 'hidden'}}>
            <div style={{width: `${porcentajeNivel}%`, background: 'var(--secondary)', height: '100%', borderRadius: '10px', transition: 'width 1s ease', boxShadow:'0 0 10px var(--secondary)'}}></div>
        </div>
      </div>

      {/* COFRE SEMANAL */}
      <WeeklyChest habitos={misHabitos} userUid={userUid} psicologoId={psicologoId} userData={userData} />

      {/* LISTA DE HÁBITOS */}
      <div style={{display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginTop:'20px'}}>
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
              {logrado && <div style={{position: 'absolute', top: 0, right: 0, background: 'var(--secondary)', color: 'black', padding: '5px 15px', borderBottomLeftRadius: '15px', fontSize: '0.7rem', fontWeight: 'bold'}}>¡META CUMPLIDA!</div>}
              <div style={{marginBottom: '20px'}}>
                <h4 style={{margin: '0 0 5px 0', fontSize: '1.3rem', color: 'white', letterSpacing:'0.5px'}}>{habito.titulo}</h4>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <span style={{background: 'rgba(255,255,255,0.1)', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold'}}>{meta} días/sem</span>
                    <div style={{display:'flex', gap:'5px', marginLeft:'auto'}}>
                        <img src={STATS_CONFIG.gold.icon} style={{width:'25px'}} title="+5 Fondos" />
                        {habito.recompensas?.includes('vitalidad') && <img src={STATS_CONFIG.vitalidad.icon} style={{width:'25px'}} title="Integridad" />}
                        {habito.recompensas?.includes('sabiduria') && <img src={STATS_CONFIG.sabiduria.icon} style={{width:'25px'}} title="I+D" />}
                        {habito.recompensas?.includes('vinculacion') && <img src={STATS_CONFIG.vinculacion.icon} style={{width:'25px'}} title="Vinculación" />}
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