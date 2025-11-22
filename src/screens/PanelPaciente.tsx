import { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

export function PanelPaciente({ userUid, psicologoId }: any) {
  const [misHabitos, setMisHabitos] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "habitos"), where("pacienteId", "==", userUid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMisHabitos(lista);
    });
    return () => unsubscribe();
  }, [userUid]);

  const toggleDia = async (habitoId: string, dia: string, estadoActual: boolean) => {
    try {
      const habitoRef = doc(db, "habitos", habitoId);
      await updateDoc(habitoRef, { [`registro.${dia}`]: !estadoActual });
    } catch (error) { console.error(error); }
  };

  const calcularProgreso = (registro: any) => {
    const cumplidos = Object.values(registro).filter(val => val === true).length;
    return Math.round((cumplidos / 7) * 100);
  };
  const diasSemana = ["L", "M", "X", "J", "V", "S", "D"];

  return (
    <div style={{textAlign: 'left'}}>
      <h3>🌱 Mis Hábitos Semanales</h3>
      {misHabitos.length === 0 && <p style={{color: '#666'}}>No tienes hábitos asignados.</p>}

      <div style={{display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginTop: '20px'}}>
        {misHabitos.map(habito => {
          const porcentaje = calcularProgreso(habito.registro);
          const logrado = porcentaje >= habito.metaSemanal;
          return (
            <div key={habito.id} style={{background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.05)'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                <h4 style={{margin: 0}}>{habito.titulo}</h4>
                <span style={{
                    background: logrado ? '#D1FAE5' : '#E0E7FF', 
                    color: logrado ? '#065F46' : '#3730A3',
                    padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold'
                }}>{porcentaje}%</span>
              </div>
              <div style={{width: '100%', background: '#F3F4F6', height: '10px', borderRadius: '5px', marginBottom: '20px', overflow: 'hidden'}}>
                <div style={{width: `${porcentaje}%`, background: logrado ? '#10B981' : '#4F46E5', height: '100%', borderRadius: '5px', transition: 'width 0.5s'}}></div>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                {diasSemana.map(dia => (
                  <button key={dia} onClick={() => toggleDia(habito.id, dia, habito.registro[dia])}
                    style={{
                      width: '36px', height: '36px', borderRadius: '50%', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                      background: habito.registro[dia] ? '#10B981' : '#F3F4F6', 
                      color: habito.registro[dia] ? 'white' : '#9CA3AF'
                    }}>
                    {dia}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}