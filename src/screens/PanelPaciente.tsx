import { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

// --- UTILIDADES DE FECHA ---
// Función para obtener el ID de la semana (ej: "2023-W42")
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
  
  // Estado del Viaje en el Tiempo (0 = Hoy, -1 = Semana pasada, etc.)
  const [semanaOffset, setSemanaOffset] = useState(0);
  const currentWeekId = getWeekId(new Date());

  // Configuración del juego
  const XP_POR_HABITO = 100;
  const PUNTOS_NIVEL = 1000;

  useEffect(() => {
    const q = query(collection(db, "habitos"), where("pacienteId", "==", userUid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data };
      });

      // 1. VERIFICAR Y ARCHIVAR SEMANAS VIEJAS AUTOMÁTICAMENTE
      lista.forEach(async (h: any) => {
        // Si el hábito no tiene marca de semana o es vieja, archivamos
        if (h.ultimaSemanaRegistrada !== currentWeekId) {
            // Guardamos el registro actual en el historial
            const registroAArchivar = h.registro || { L: false, M: false, X: false, J: false, V: false, S: false, D: false };
            const historialNuevo = {
                ...h.historial,
                [h.ultimaSemanaRegistrada || "antiguo"]: registroAArchivar
            };

            // Reiniciamos la semana
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

  // Calcular puntaje (Incluyendo el historial para que no pierda sus niveles)
  const calcularGamificacion = (habitos: any[]) => {
    let totalChecks = 0;
    habitos.forEach(h => {
        // 1. Sumar semana actual
        totalChecks += Object.values(h.registro).filter(v => v === true).length;
        
        // 2. Sumar historial
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
    // Solo permitimos editar si estamos en la semana actual (offset 0)
    if (semanaOffset !== 0) return alert("No puedes modificar el pasado ⏳");

    try {
      const habitoRef = doc(db, "habitos", habitoId);
      await updateDoc(habitoRef, { [`registro.${dia}`]: !estadoActual });
    } catch (error) { console.error(error); }
  };

  const calcularProgresoHabito = (registro: any) => {
    if (!registro) return 0;
    const cumplidos = Object.values(registro).filter(val => val === true).length;
    return Math.round((cumplidos / 7) * 100);
  };

  // Función para obtener los datos a mostrar (Actual o Histórico)
  const getDatosVisualizacion = (habito: any) => {
      if (semanaOffset === 0) {
          return habito.registro; // Semana actual
      } else {
          // Buscamos en el historial
          // Para hacerlo real, necesitaríamos calcular el ID de la semana pasada.
          // Simplificación: Por ahora solo mostramos si existe en historial, sino vacío.
          // (En producción usaríamos librerías de fecha para restar semanas exactas al currentWeekId)
          return { L: false, M: false, X: false, J: false, V: false, S: false, D: false }; 
      }
  };

  const diasSemana = ["L", "M", "X", "J", "V", "S", "D"];

  return (
    <div style={{textAlign: 'left', paddingBottom: '50px'}}>
      
      {/* --- HUD GAMIFICACIÓN --- */}
      <div style={{background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', borderRadius: '20px', padding: '25px', color: 'white', marginBottom: '30px', boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
                <h2 style={{margin: 0, fontSize: '2rem', color: 'white'}}>Nivel {nivel}</h2>
                <p style={{margin: 0, opacity: 0.8}}>{puntosTotales} XP Totales</p>
            </div>
            <div style={{fontSize: '3rem'}}>🏆</div>
        </div>
      </div>

      {/* --- CONTROL DE TIEMPO --- */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: '#F3F4F6', padding: '10px', borderRadius: '12px'}}>
        <button 
            onClick={() => setSemanaOffset(semanaOffset - 1)}
            style={{border:'none', background:'white', width:'40px', height:'40px', borderRadius:'50%', cursor:'pointer', boxShadow:'0 2px 4px rgba(0,0,0,0.1)'}}
        >⬅</button>
        
        <div style={{textAlign:'center'}}>
            <span style={{fontWeight:'bold', color:'#374151'}}>{getWeekLabel(semanaOffset)}</span>
            <br/>
            <small style={{fontSize:'0.7rem', color:'#9CA3AF'}}>
                {semanaOffset === 0 ? "Editando" : "Modo Lectura"}
            </small>
        </div>

        <button 
            onClick={() => semanaOffset < 0 && setSemanaOffset(semanaOffset + 1)}
            style={{
                border:'none', background: semanaOffset === 0 ? '#E5E7EB' : 'white', 
                width:'40px', height:'40px', borderRadius:'50%', 
                cursor: semanaOffset === 0 ? 'default' : 'pointer', 
                boxShadow: semanaOffset === 0 ? 'none' : '0 2px 4px rgba(0,0,0,0.1)',
                opacity: semanaOffset === 0 ? 0.5 : 1
            }}
        >➡</button>
      </div>

      {/* --- LISTA DE HÁBITOS --- */}
      <div style={{display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'}}>
        {misHabitos.map(habito => {
          // Determinamos qué datos mostrar (Presente vs Pasado)
          // Nota: La lógica de historial visual exacta requiere calcular el ID de semana "2023-W46" restando días.
          // Para este ejemplo, si no es la semana actual, mostramos un mensaje de "Historial no disponible" si no hay datos exactos,
          // o mostramos el registro si estamos en semana 0.
          
          let datosMostrar = habito.registro;
          let esHistorial = false;

          if (semanaOffset < 0) {
              esHistorial = true;
              // Aquí intentamos buscar en el historial. 
              // Como simplificación, si hay historial, mostramos el último guardado para demo
              const llavesHistorial = habito.historial ? Object.keys(habito.historial).sort() : [];
              if (llavesHistorial.length > 0) {
                  // Mostramos la última semana guardada como ejemplo de "pasado"
                  datosMostrar = habito.historial[llavesHistorial[llavesHistorial.length - 1]]; 
              } else {
                  datosMostrar = { L: false, M: false, X: false, J: false, V: false, S: false, D: false };
              }
          }

          const porcentaje = calcularProgresoHabito(datosMostrar);
          const logrado = porcentaje >= habito.metaSemanal;
          
          return (
            <div key={habito.id} style={{
                background: 'white', padding: '25px', borderRadius: '20px', 
                boxShadow: logrado ? '0 4px 20px rgba(16, 185, 129, 0.15)' : '0 4px 6px rgba(0,0,0,0.05)', 
                border: logrado ? '2px solid #10B981' : '1px solid #F3F4F6',
                position: 'relative', overflow: 'hidden',
                opacity: esHistorial ? 0.8 : 1 // Visualmente distinto si es historial
            }}>
              
              {logrado && <div style={{position: 'absolute', top: 0, right: 0, background: '#10B981', color: 'white', padding: '5px 15px', borderBottomLeftRadius: '15px', fontSize: '0.8rem', fontWeight: 'bold'}}>¡META CUMPLIDA!</div>}

              <div style={{marginBottom: '20px'}}>
                <h4 style={{margin: '0 0 5px 0', fontSize: '1.2rem', color: '#1F2937'}}>{habito.titulo}</h4>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <span style={{fontSize: '0.85rem', color: '#6B7280'}}>Recompensa:</span>
                    <span style={{background: '#EFF6FF', color: '#4F46E5', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold'}}>+{XP_POR_HABITO} XP</span>
                </div>
              </div>

              {/* Botones de Días */}
              <div style={{display: 'flex', justifyContent: 'space-between', background: '#F9FAFB', padding: '10px', borderRadius: '12px'}}>
                {diasSemana.map(dia => (
                  <div key={dia} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px'}}>
                      <span style={{fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 'bold'}}>{dia}</span>
                      <button 
                        onClick={() => toggleDia(habito.id, dia, datosMostrar[dia])}
                        style={{
                          width: '32px', height: '32px', borderRadius: '10px', border: 'none', cursor: esHistorial ? 'not-allowed' : 'pointer', 
                          background: datosMostrar[dia] ? (esHistorial ? '#6B7280' : '#10B981') : '#E5E7EB', 
                          color: 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: datosMostrar[dia] ? '0 4px 10px rgba(0,0,0,0.1)' : 'none'
                        }}
                      >
                        {datosMostrar[dia] && "✓"}
                      </button>
                  </div>
                ))}
              </div>
              
              {/* Mini barra */}
              <div style={{marginTop: '15px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                <div style={{flex: 1, height: '6px', background: '#F3F4F6', borderRadius: '3px'}}>
                    <div style={{width: `${porcentaje}%`, background: esHistorial ? '#6B7280' : '#4F46E5', height: '100%', borderRadius: '3px', transition: 'width 0.5s'}}></div>
                </div>
                <span style={{fontSize: '0.8rem', color: '#6B7280', fontWeight: 'bold'}}>{porcentaje}%</span>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}