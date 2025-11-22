import { useState, useEffect } from 'react';
import { doc, updateDoc, addDoc, deleteDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

export function PanelPsicologo({ userData, userUid }: any) {
  const [pacientes, setPacientes] = useState<any[]>([]); 
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);
  const [habitosPaciente, setHabitosPaciente] = useState<any[]>([]);
  const [tituloHabito, setTituloHabito] = useState("");
  const [metaSemanal, setMetaSemanal] = useState(80);

  // 1. Cargar pacientes
  useEffect(() => {
    const colRef = collection(db, "users", userUid, "pacientes");
    const unsubscribe = onSnapshot(colRef, (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPacientes(lista);
    });
    return () => unsubscribe();
  }, [userUid]);

  // 2. Cargar hábitos
  useEffect(() => {
    if (!pacienteSeleccionado) { setHabitosPaciente([]); return; }
    const q = query(collection(db, "habitos"), where("pacienteId", "==", pacienteSeleccionado.id));
    const unsubscribe = onSnapshot(q, (snap) => setHabitosPaciente(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsubscribe();
  }, [pacienteSeleccionado]);

  const autorizarPaciente = async (pacienteId: string, estadoActual: boolean) => {
    const ref = doc(db, "users", userUid, "pacientes", pacienteId);
    await updateDoc(ref, { isAuthorized: !estadoActual });
  };

  const crearHabito = async () => {
    if (!tituloHabito || !pacienteSeleccionado) return;
    await addDoc(collection(db, "habitos"), {
      titulo: tituloHabito, pacienteId: pacienteSeleccionado.id, asignadoPor: userUid, metaSemanal: metaSemanal,
      createdAt: new Date(), registro: { L: false, M: false, X: false, J: false, V: false, S: false, D: false }
    });
    setTituloHabito(""); 
  };

  const eliminarHabito = async (id: string) => {
    if(confirm("¿Borrar?")) await deleteDoc(doc(db, "habitos", id));
  };

  const calcularProgreso = (reg: any) => Math.round((Object.values(reg).filter(v => v === true).length / 7) * 100);

  return (
    <div style={{textAlign: 'left'}}>
      {/* HEADER DEL PANEL */}
      <div style={{
          background: 'var(--bg-card)', 
          padding: '20px', borderRadius: '16px', marginBottom: '30px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)', 
          border: 'var(--glass-border)',
          display:'flex', justifyContent:'space-between', alignItems:'center'
      }}>
        <div>
            <h3 style={{margin:0, color: 'var(--primary)', fontSize:'1.5rem'}}>👨‍⚕️ Mi Consultorio</h3>
            <p style={{margin:0, fontSize:'0.9rem', color:'var(--text-muted)'}}>
                Código Pacientes: <strong style={{color:'white', letterSpacing:'1px'}}>{userData.codigoVinculacion}</strong>
            </p>
        </div>
      </div>

      <div style={{display: 'flex', gap: '30px', flexWrap: 'wrap'}}>
        
        {/* --- LISTA PACIENTES --- */}
        <div style={{flex: 1, minWidth: '300px'}}>
          <h4 style={{textTransform:'uppercase', fontSize:'0.8rem', color:'var(--secondary)', letterSpacing:'2px', marginBottom:'15px'}}>
            Pacientes Registrados
          </h4>
          
          <div style={{display: 'grid', gap: '10px'}}>
            {pacientes.map(p => (
              <div key={p.id} 
                onClick={() => p.isAuthorized && setPacienteSeleccionado(p)}
                style={{
                  // Diseño condicional: Si está seleccionado se ilumina, si no es oscuro
                  background: pacienteSeleccionado?.id === p.id ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255,255,255,0.03)',
                  border: pacienteSeleccionado?.id === p.id ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                  padding: '15px', borderRadius: '12px', transition: 'all 0.2s', cursor: p.isAuthorized ? 'pointer' : 'default'
                }}>
                
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div style={{flex: 1}}>
                        <div style={{fontWeight: 'bold', color: 'white', fontSize:'1.1rem'}}>{p.displayName}</div>
                        <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{p.email}</div>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); autorizarPaciente(p.id, p.isAuthorized); }}
                        style={{
                            padding: '6px 12px', borderRadius: '8px', fontSize: '0.7rem', border:'none', cursor:'pointer', fontWeight: 'bold',
                            background: p.isAuthorized ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: p.isAuthorized ? 'var(--secondary)' : '#EF4444',
                            border: p.isAuthorized ? '1px solid var(--secondary)' : '1px solid #EF4444'
                        }}
                    >
                        {p.isAuthorized ? "ACTIVO" : "APROBAR"}
                    </button>
                </div>
                {!p.isAuthorized && <small style={{color: '#EF4444', display:'block', marginTop:'5px', fontSize:'0.75rem'}}>⚠️ Autorización requerida</small>}
              </div>
            ))}
          </div>
        </div>

        {/* --- ÁREA DE TRABAJO (DERECHA) --- */}
        <div style={{flex: 2, minWidth: '320px'}}>
          {pacienteSeleccionado ? (
            <div style={{animation: 'fadeIn 0.5s'}}>
              
              {/* FORMULARIO DE ASIGNACIÓN */}
              <div style={{
                  background: 'var(--bg-card)', padding: '25px', borderRadius: '16px', marginBottom: '20px', 
                  border: 'var(--glass-border)', boxShadow: '0 4px 30px rgba(0,0,0,0.3)'
                }}>
                <h4 style={{color: 'white', marginTop:0}}>Asignar a: <span style={{color:'var(--primary)'}}>{pacienteSeleccionado.displayName}</span></h4>
                
                <div style={{display: 'flex', gap: '15px', alignItems:'center'}}>
                    <div style={{flex: 3}}>
                        <input 
                            type="text" 
                            value={tituloHabito} 
                            onChange={(e) => setTituloHabito(e.target.value)} 
                            placeholder="Nombre del Hábito..." 
                            style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white'}}
                        />
                    </div>
                    <div style={{flex: 1}}>
                        <input 
                            type="number" 
                            value={metaSemanal} 
                            onChange={(e) => setMetaSemanal(Number(e.target.value))} 
                            placeholder="%" 
                            style={{textAlign:'center', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white'}}
                        />
                    </div>
                    <button onClick={crearHabito} className="btn-primary" style={{height:'42px', display:'flex', alignItems:'center', justifyContent:'center'}}>
                        AGREGAR
                    </button>
                </div>
              </div>
              
              {/* LISTA DE HÁBITOS ASIGNADOS */}
              <div style={{display: 'grid', gap: '10px'}}>
                {habitosPaciente.map(h => {
                   const p = calcularProgreso(h.registro);
                   return (
                    <div key={h.id} style={{
                        background: 'rgba(255,255,255,0.03)', padding: '15px 20px', borderRadius: '12px', 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      <div style={{flex: 1}}>
                        <strong style={{color:'white', fontSize:'1.1rem', letterSpacing:'0.5px'}}>{h.titulo}</strong>
                        
                        {/* Barra de progreso */}
                        <div style={{width: '100%', background: 'rgba(0,0,0,0.5)', height: '6px', marginTop: '8px', maxWidth: '250px', borderRadius:'3px', overflow:'hidden'}}>
                            <div style={{width: `${p}%`, background: p >= h.metaSemanal ? 'var(--secondary)' : 'var(--primary)', height: '100%', borderRadius:'3px', boxShadow: p >= h.metaSemanal ? '0 0 10px var(--secondary)' : 'none'}}></div>
                        </div>
                        <small style={{color: 'var(--text-muted)', fontSize:'0.75rem', marginTop:'5px', display:'block'}}>Meta: {h.metaSemanal}%</small>
                      </div>
                      
                      <button onClick={() => eliminarHabito(h.id)} style={{background:'none', border:'none', cursor:'pointer', fontSize:'1.2rem', opacity:0.7, transition:'opacity 0.2s'}} title="Eliminar">
                        🗑️
                      </button>
                    </div>
                   )
                })}
              </div>
            </div>
          ) : (
            // ESTADO VACÍO
            <div style={{
                padding: '60px', textAlign: 'center', color: 'var(--text-muted)', 
                border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px', background: 'rgba(0,0,0,0.2)'
            }}>
              <p style={{fontSize:'2rem', margin:0}}>👈</p>
              <p>Selecciona un paciente de la lista para ver su expediente.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}