import { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

// ... (Utilidades de fecha igual que antes) ...
const getWeekId = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
};
const getWeekLabel = (offset: number) => {
    if (offset === 0) return "Semana Actual";
    if (offset === -1) return "Semana Pasada";
    return `Hace ${Math.abs(offset)} semanas`;
};

export function PanelPaciente({ userUid }: any) {
  const [misHabitos, setMisHabitos] = useState<any[]>([]);
  const [puntosTotales, setPuntosTotales] = useState(0);
  const [nivel, setNivel] = useState(1);
  
  const [semanaOffset, setSemanaOffset] = useState(0);
  const currentWeekId = getWeekId(new Date());

  const XP_POR_HABITO = 100;
  const PUNTOS_NIVEL = 1000;

  useEffect(() => {
    const q = query(collection(db, "habitos"), where("pacienteId", "==", userUid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Auto-archivado
      lista.forEach(async (h: any) => {
        if (h.ultimaSemanaRegistrada !== currentWeekId) {
            const registroAArchivar = h.registro || { L: false, M: false, X: false, J: false, V: false, S: false, D: false };
            const historialNuevo = { ...h.historial, [h.ultimaSemanaRegistrada || "antiguo"]: registroAArchivar };
            await updateDoc(doc(db, "habitos", h.id), {
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
  }, [userUid, currentWeekId]);

  const calcularGamificacion = (habitos: any[]) => {
    let totalChecks = 0;
    habitos.forEach(h => {
        // Contamos TODO (Activos y Archivados)
        totalChecks += Object.values(h.registro).filter(v => v === true).length;
        if (h.historial) {
            Object.values(h.historial).forEach((semana: any) => {
                totalChecks += Object.values(semana).filter(v => v === true).length;
            });
        }
    });
    const xp = totalChecks * XP_POR_HABITO;
    setPuntosTotales(xp);
    setNivel(Math.floor(xp / PUNTOS_NIVEL) + 1);
  };

  const toggleDia = async (habitoId: string, dia: string, estadoActual: boolean) => {
    if (semanaOffset !== 0) return alert("No puedes modificar el pasado ⏳");
    try {
      const habitoRef = doc(db, "habitos", habitoId);
      await updateDoc(habitoRef, { [`registro.${dia}`]: !estadoActual });
    } catch (error) { console.error(error); }
  };

  const contarDias = (registro: any) => (!registro ? 0 : Object.values(registro).filter(val => val === true).length);

  const getDatosVisualizacion = (habito: any) => {
      if (semanaOffset === 0) return habito.registro;
      return { L: false, M: false, X: false, J: false, V: false, S: false, D: false }; 
  };

  const diasSemana = ["L", "M", "X", "J", "V", "S", "D"];
  
  // Filtramos solo los ACTIVOS para la barra de la semana actual
  const habitosActivos = misHabitos.filter(h => h.estado !== 'archivado');

  const promedioSemanal = habitosActivos.length > 0 
    ? Math.round(habitosActivos.reduce((acc, h) => {
          const dias = contarDias(h.registro);
          const meta = h.frecuenciaMeta || 7;
          return acc + Math.min(1, dias / meta);
      }, 0) / habitosActivos.length * 100)
    : 0;

  return (
    <div style={{textAlign: 'left', paddingBottom: '50px'}}>
      
      {/* HUD (Muestra Nivel Global calculado con TODOS los hábitos) */}
      <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, #3b82f6 100%)', 
          borderRadius: '20px', padding: '25px', color: 'white', marginBottom: '30px', 
          boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)', border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'15px'}}>
            <div>
                <h2 style={{margin: 0, fontSize: '2.5rem', color: 'white', fontFamily: 'Rajdhani, sans-serif'}}>Nivel {nivel}</h2>
                <p style={{margin: 0, opacity: 0.9, fontSize:'0.9rem', fontWeight:'bold'}}>⚡ {puntosTotales} XP Totales</p>
            </div>
            <div style={{fontSize: '3rem'}}>🏆</div>
        </div>

        <div style={{background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '15px', backdropFilter: 'blur(5px)'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem', fontWeight: 'bold', textTransform:'uppercase', letterSpacing:'1px'}}>
                <span>🚀 Meta Semanal</span>
                <span>{promedioSemanal}%</span>
            </div>
            <div style={{width: '100%', background: 'rgba(255,255,255,0.1)', height: '10px', borderRadius: '10px', overflow: 'hidden'}}>
                <div style={{width: `${promedioSemanal}%`, background: 'var(--secondary)', height: '100%', borderRadius: '10px', transition: 'width 1s ease'}}></div>
            </div>
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

      {/* LISTA DE HÁBITOS (Solo mostramos los ACTIVOS) */}
      <div style={{display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'}}>
        {misHabitos.map(habito => {
          // FILTRO VISUAL: Si está archivado, NO LO MOSTRAMOS AQUÍ
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
                position: 'relative', overflow: 'hidden',
                opacity: esHistorial ? 0.7 : 1,
                boxShadow: logrado ? '0 0 20px rgba(16, 185, 129, 0.1)' : 'none'
            }}>
              {logrado && <div style={{position: 'absolute', top: 0, right: 0, background: 'var(--secondary)', color: 'black', padding: '5px 15px', borderBottomLeftRadius: '15px', fontSize: '0.7rem', fontWeight: 'bold'}}>¡META CUMPLIDA!</div>}

              <div style={{marginBottom: '20px'}}>
                <h4 style={{margin: '0 0 5px 0', fontSize: '1.3rem', color: 'white', letterSpacing:'0.5px'}}>{habito.titulo}</h4>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <span style={{fontSize: '0.75rem', color: 'var(--text-muted)', textTransform:'uppercase'}}>Objetivo:</span>
                    <span style={{background: 'rgba(255,255,255,0.1)', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold'}}>{meta} días/sem</span>
                </div>
              </div>

              <div style={{display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '12px'}}>
                {diasSemana.map(dia => (
                  <div key={dia} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'}}>
                      <span style={{fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold'}}>{dia}</span>
                      <button 
                        onClick={() => toggleDia(habito.id, dia, datosMostrar[dia])}
                        style={{
                          width: '32px', height: '32px', borderRadius: '8px', border: 'none', 
                          cursor: esHistorial ? 'not-allowed' : 'pointer', 
                          background: datosMostrar[dia] ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                          color: datosMostrar[dia] ? 'black' : 'white',
                          boxShadow: datosMostrar[dia] ? '0 0 10px var(--secondary)' : 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s ease', transform: datosMostrar[dia] ? 'scale(1.1)' : 'scale(1)',
                        }}
                      >
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