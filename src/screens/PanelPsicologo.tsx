import { useState, useEffect } from 'react';
import { doc, updateDoc, addDoc, deleteDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

export function PanelPsicologo({ userData, userUid }: any) {
  const [pacientes, setPacientes] = useState<any[]>([]); 
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);
  const [habitosPaciente, setHabitosPaciente] = useState<any[]>([]);
  const [tituloHabito, setTituloHabito] = useState("");
  const [metaSemanal, setMetaSemanal] = useState(80);

  // 1. Cargar pacientes desde MI SUBCOLECCIÓN
  useEffect(() => {
    const colRef = collection(db, "users", userUid, "pacientes");
    const unsubscribe = onSnapshot(colRef, (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPacientes(lista);
    });
    return () => unsubscribe();
  }, [userUid]);

  // 2. Cargar hábitos del paciente seleccionado
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
      <div style={{background: 'white', padding: '20px', borderRadius: '16px', marginBottom: '30px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
            <h3 style={{margin:0, color: '#4F46E5'}}>👨‍⚕️ Mi Consultorio</h3>
            <p style={{margin:0, fontSize:'0.9rem', color:'#6B7280'}}>Código Pacientes: <strong>{userData.codigoVinculacion}</strong></p>
        </div>
      </div>

      <div style={{display: 'flex', gap: '30px', flexWrap: 'wrap'}}>
        {/* LISTA PACIENTES */}
        <div style={{flex: 1, minWidth: '300px'}}>
          <h4 style={{textTransform:'uppercase', fontSize:'0.8rem', color:'#9CA3AF'}}>Pacientes Registrados</h4>
          <div style={{display: 'grid', gap: '10px'}}>
            {pacientes.map(p => (
              <div key={p.id} style={{
                  background: pacienteSeleccionado?.id === p.id ? '#EEF2FF' : 'white',
                  border: pacienteSeleccionado?.id === p.id ? '1px solid #4F46E5' : '1px solid #E5E7EB',
                  padding: '15px', borderRadius: '12px', transition: 'all 0.2s'
                }}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div onClick={() => p.isAuthorized && setPacienteSeleccionado(p)} style={{cursor: p.isAuthorized ? 'pointer' : 'default', flex: 1}}>
                        <div style={{fontWeight: 'bold', color: '#374151'}}>{p.displayName}</div>
                        <div style={{fontSize: '0.8rem', color: '#6B7280'}}>{p.email}</div>
                    </div>
                    <button 
                        onClick={() => autorizarPaciente(p.id, p.isAuthorized)}
                        style={{
                            padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', border:'none', cursor:'pointer', fontWeight: 'bold',
                            background: p.isAuthorized ? '#D1FAE5' : '#FEE2E2',
                            color: p.isAuthorized ? '#065F46' : '#991B1B'
                        }}
                    >
                        {p.isAuthorized ? "ACTIVO" : "APROBAR"}
                    </button>
                </div>
                {!p.isAuthorized && <small style={{color: '#EF4444', display:'block', marginTop:'5px'}}>⚠️ Autorizar para gestionar</small>}
              </div>
            ))}
          </div>
        </div>

        {/* DETALLES */}
        <div style={{flex: 2, minWidth: '320px'}}>
          {pacienteSeleccionado ? (
            <div style={{animation: 'fadeIn 0.5s'}}>
              <div style={{background: 'white', padding: '20px', borderRadius: '16px', marginBottom: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)'}}>
                <h4>Asignar a: {pacienteSeleccionado.displayName}</h4>
                <div style={{display: 'flex', gap: '10px'}}>
                    <input type="text" value={tituloHabito} onChange={(e) => setTituloHabito(e.target.value)} placeholder="Hábito" style={{flex:2}} />
                    <input type="number" value={metaSemanal} onChange={(e) => setMetaSemanal(Number(e.target.value))} placeholder="%" style={{width:'60px'}} />
                    <button onClick={crearHabito} className="btn-primary" style={{flex:1}}>Agregar</button>
                </div>
              </div>
              
              <div style={{display: 'grid', gap: '10px'}}>
                {habitosPaciente.map(h => {
                   const p = calcularProgreso(h.registro);
                   return (
                    <div key={h.id} style={{background: 'white', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border:'1px solid #F3F4F6'}}>
                      <div style={{flex: 1}}>
                        <strong>{h.titulo}</strong>
                        <div style={{width: '100%', background: '#F3F4F6', height: '6px', marginTop: '5px', maxWidth: '200px', borderRadius:'3px'}}>
                            <div style={{width: `${p}%`, background: p >= h.metaSemanal ? '#10B981' : '#4F46E5', height: '100%', borderRadius:'3px'}}></div>
                        </div>
                      </div>
                      <button onClick={() => eliminarHabito(h.id)} style={{background:'none', border:'none', cursor:'pointer'}}>🗑️</button>
                    </div>
                   )
                })}
              </div>
            </div>
          ) : <div style={{padding: '50px', textAlign: 'center', color: '#9CA3AF', border: '2px dashed #E5E7EB', borderRadius: '16px'}}>Selecciona un paciente activo</div>}
        </div>
      </div>
    </div>
  );
}