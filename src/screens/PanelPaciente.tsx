import { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

export function PanelPaciente({ userUid }: any) {
  const [misHabitos, setMisHabitos] = useState<any[]>([]);
  const [puntosTotales, setPuntosTotales] = useState(0);
  const [nivel, setNivel] = useState(1);

  // Configuración del juego
  const XP_POR_HABITO = 100; // Puntos por cada check
  const PUNTOS_NIVEL = 1000; // Puntos necesarios para subir de nivel

  useEffect(() => {
    const q = query(collection(db, "habitos"), where("pacienteId", "==", userUid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMisHabitos(lista);
      calcularGamificacion(lista);
    });
    return () => unsubscribe();
  }, [userUid]);

  // Calcular puntaje total basado en todo lo marcado
  const calcularGamificacion = (habitos: any[]) => {
    let totalChecks = 0;
    habitos.forEach(h => {
        // Contamos cuántos 'true' hay en el registro
        const checks = Object.values(h.registro).filter(v => v === true).length;
        totalChecks += checks;
    });
    
    const xp = totalChecks * XP_POR_HABITO;
    setPuntosTotales(xp);
    setNivel(Math.floor(xp / PUNTOS_NIVEL) + 1);
  };

  const toggleDia = async (habitoId: string, dia: string, estadoActual: boolean) => {
    try {
      const habitoRef = doc(db, "habitos", habitoId);
      await updateDoc(habitoRef, { [`registro.${dia}`]: !estadoActual });
    } catch (error) { console.error(error); }
  };

  // ESTA ES LA FUNCIÓN CORRECTA
  const calcularProgresoHabito = (registro: any) => {
    const cumplidos = Object.values(registro).filter(val => val === true).length;
    return Math.round((cumplidos / 7) * 100);
  };

  const diasSemana = ["L", "M", "X", "J", "V", "S", "D"];

  // Cálculo de la "Carrera Semanal"
  const promedioSemanal = misHabitos.length > 0 
    ? Math.round(misHabitos.reduce((acc, h) => acc + calcularProgresoHabito(h.registro), 0) / misHabitos.length)
    : 0;

  return (
    <div style={{textAlign: 'left', paddingBottom: '50px'}}>
      
      {/* --- SECCIÓN DE ESTADÍSTICAS (HUD) --- */}
      <div style={{background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', borderRadius: '20px', padding: '25px', color: 'white', marginBottom: '30px', boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
            <div>
                <h2 style={{margin: 0, fontSize: '2rem', color: 'white'}}>Nivel {nivel}</h2>
                <p style={{margin: 0, opacity: 0.8}}>¡Sigue así! Has acumulado {puntosTotales} XP</p>
            </div>
            <div style={{fontSize: '3rem'}}>🏆</div>
        </div>

        {/* BARRA DE CARRERA SEMANAL */}
        <div style={{background: 'rgba(255,255,255,0.2)', borderRadius: '15px', padding: '15px', backdropFilter: 'blur(5px)'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 'bold'}}>
                <span>🏁 Meta Semanal</span>
                <span>{promedioSemanal}%</span>
            </div>
            <div style={{width: '100%', background: 'rgba(0,0,0,0.2)', height: '12px', borderRadius: '10px', overflow: 'hidden', position: 'relative'}}>
                <div style={{
                    width: `${promedioSemanal}%`, 
                    background: '#34D399', 
                    height: '100%', 
                    borderRadius: '10px', 
                    transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 0 10px #34D399'
                }}></div>
            </div>
            <p style={{margin: '8px 0 0 0', fontSize: '0.8rem', textAlign: 'center', opacity: 0.9}}>
                {promedioSemanal === 100 ? "¡INCREÍBLE! SEMANA PERFECTA 🎉" : "Completa tus hábitos para avanzar hacia la meta."}
            </p>
        </div>
      </div>

      {/* --- LISTA DE HÁBITOS (TARJETAS DE JUEGO) --- */}
      <h3 style={{color: '#374151', marginBottom: '20px'}}>Tus Misiones Diarias</h3>
      
      {misHabitos.length === 0 && (
        <div style={{textAlign: 'center', padding: '40px', background: '#F3F4F6', borderRadius: '16px', color: '#6B7280'}}>
            <p>Tu terapeuta aún no ha asignado misiones.</p>
        </div>
      )}

      <div style={{display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'}}>
        {misHabitos.map(habito => {
          // CORRECCIÓN AQUÍ: Usamos el nombre correcto de la función
          const porcentaje = calcularProgresoHabito(habito.registro);
          const logrado = porcentaje >= habito.metaSemanal;
          
          return (
            <div key={habito.id} style={{
                background: 'white', padding: '25px', borderRadius: '20px', 
                boxShadow: logrado ? '0 4px 20px rgba(16, 185, 129, 0.15)' : '0 4px 6px rgba(0,0,0,0.05)', 
                border: logrado ? '2px solid #10B981' : '1px solid #F3F4F6',
                position: 'relative', overflow: 'hidden'
            }}>
              
              {logrado && <div style={{position: 'absolute', top: 0, right: 0, background: '#10B981', color: 'white', padding: '5px 15px', borderBottomLeftRadius: '15px', fontSize: '0.8rem', fontWeight: 'bold'}}>¡META CUMPLIDA!</div>}

              <div style={{marginBottom: '20px'}}>
                <h4 style={{margin: '0 0 5px 0', fontSize: '1.2rem', color: '#1F2937'}}>{habito.titulo}</h4>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <span style={{fontSize: '0.85rem', color: '#6B7280'}}>Recompensa:</span>
                    <span style={{background: '#EFF6FF', color: '#4F46E5', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold'}}>+{XP_POR_HABITO} XP</span>
                </div>
              </div>

              {/* Botones de Días (Tipo Interruptor) */}
              <div style={{display: 'flex', justifyContent: 'space-between', background: '#F9FAFB', padding: '10px', borderRadius: '12px'}}>
                {diasSemana.map(dia => (
                  <div key={dia} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px'}}>
                      <span style={{fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 'bold'}}>{dia}</span>
                      <button 
                        onClick={() => toggleDia(habito.id, dia, habito.registro[dia])}
                        style={{
                          width: '32px', height: '32px', borderRadius: '10px', border: 'none', cursor: 'pointer', 
                          background: habito.registro[dia] ? '#10B981' : '#E5E7EB', 
                          color: 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          transform: habito.registro[dia] ? 'scale(1.1)' : 'scale(1)',
                          boxShadow: habito.registro[dia] ? '0 4px 10px rgba(16, 185, 129, 0.4)' : 'none'
                        }}
                      >
                        {habito.registro[dia] && "✓"}
                      </button>
                  </div>
                ))}
              </div>
              
              {/* Mini barra individual */}
              <div style={{marginTop: '15px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                <div style={{flex: 1, height: '6px', background: '#F3F4F6', borderRadius: '3px'}}>
                    <div style={{width: `${porcentaje}%`, background: '#4F46E5', height: '100%', borderRadius: '3px', transition: 'width 0.5s'}}></div>
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