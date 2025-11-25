import { useState, useEffect } from 'react';
import { doc, updateDoc, addDoc, deleteDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

// --- ICONOS SVG (DISEÑO CYBERPUNK) ---
const IconEdit = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const IconMedal = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7"></circle>
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
  </svg>
);

const IconRestore = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"></polyline>
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
  </svg>
);

const IconTrash = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

export function PanelPsicologo({ userData, userUid }: any) {
  const [pacientes, setPacientes] = useState<any[]>([]); 
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);
  const [habitosPaciente, setHabitosPaciente] = useState<any[]>([]);
  
  // Formulario y Edición
  const [tituloHabito, setTituloHabito] = useState("");
  const [frecuenciaMeta, setFrecuenciaMeta] = useState(7);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  // --- LÓGICA DE GESTIÓN DE HÁBITOS ---

  const guardarHabito = async () => {
    if (!tituloHabito || !pacienteSeleccionado) return;
    
    try {
        if (editingId) {
            // MODO EDICIÓN
            await updateDoc(doc(db, "habitos", editingId), {
                titulo: tituloHabito,
                frecuenciaMeta: frecuenciaMeta
            });
        } else {
            // MODO CREACIÓN
            await addDoc(collection(db, "habitos"), {
                titulo: tituloHabito, 
                pacienteId: pacienteSeleccionado.id, 
                asignadoPor: userUid, 
                frecuenciaMeta: frecuenciaMeta,
                estado: 'activo',
                createdAt: new Date(), 
                registro: { L: false, M: false, X: false, J: false, V: false, S: false, D: false }
            });
        }
        // Limpiar formulario
        setTituloHabito(""); 
        setFrecuenciaMeta(7);
        setEditingId(null);
    } catch (e) { console.error(e); }
  };

  const cargarParaEditar = (habito: any) => {
      setTituloHabito(habito.titulo);
      setFrecuenciaMeta(habito.frecuenciaMeta || 7);
      setEditingId(habito.id);
  };

  const cancelarEdicion = () => {
      setTituloHabito("");
      setFrecuenciaMeta(7);
      setEditingId(null);
  };

  const archivarHabito = async (id: string, estadoActual: string) => {
      const nuevoEstado = estadoActual === 'archivado' ? 'activo' : 'archivado';
      const mensaje = nuevoEstado === 'archivado' 
        ? "El hábito se moverá al historial. El paciente conserva sus puntos."
        : "El hábito volverá a aparecer en la lista diaria.";
      
      if(confirm(mensaje)) {
          await updateDoc(doc(db, "habitos", id), { estado: nuevoEstado });
      }
  };

  const eliminarHabito = async (id: string) => {
    if(confirm("⚠️ ¿ELIMINAR TOTALMENTE?\n\nSe borrarán los puntos. Úsalo solo para errores.")) {
        await deleteDoc(doc(db, "habitos", id));
    }
  };

  const contarDiasCompletados = (reg: any) => Object.values(reg).filter(v => v === true).length;

  return (
    <div style={{textAlign: 'left'}}>
      {/* HEADER */}
      <div style={{
          background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', marginBottom: '30px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)', border: 'var(--glass-border)',
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
        
        {/* LISTA PACIENTES */}
        <div style={{flex: 1, minWidth: '300px'}}>
          <h4 style={{textTransform:'uppercase', fontSize:'0.8rem', color:'var(--secondary)', letterSpacing:'2px', marginBottom:'15px'}}>
            Pacientes
          </h4>
          <div style={{display: 'grid', gap: '10px'}}>
            {pacientes.map(p => (
              <div key={p.id} 
                onClick={() => p.isAuthorized && setPacienteSeleccionado(p)}
                style={{
                  background: pacienteSeleccionado?.id === p.id ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255,255,255,0.03)',
                  border: pacienteSeleccionado?.id === p.id ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                  padding: '15px', borderRadius: '12px', transition: 'all 0.2s', cursor: p.isAuthorized ? 'pointer' : 'default'
                }}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div style={{flex: 1}}>
                        <div style={{fontWeight: 'bold', color: 'white', fontSize:'1.1rem'}}>{p.displayName}</div>
                        <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{p.email}</div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); autorizarPaciente(p.id, p.isAuthorized); }}
                        style={{
                            padding: '6px 12px', borderRadius: '8px', fontSize: '0.7rem', cursor:'pointer', fontWeight: 'bold',
                            background: p.isAuthorized ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: p.isAuthorized ? 'var(--secondary)' : '#EF4444',
                            border: p.isAuthorized ? '1px solid var(--secondary)' : '1px solid #EF4444'
                        }}>
                        {p.isAuthorized ? "ACTIVO" : "APROBAR"}
                    </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ÁREA DE TRABAJO */}
        <div style={{flex: 2, minWidth: '320px'}}>
          {pacienteSeleccionado ? (
            <div style={{animation: 'fadeIn 0.5s'}}>
              
              {/* FORMULARIO */}
              <div style={{
                  background: 'var(--bg-card)', padding: '25px', borderRadius: '16px', marginBottom: '20px', 
                  border: editingId ? '1px solid var(--primary)' : 'var(--glass-border)',
                  boxShadow: '0 4px 30px rgba(0,0,0,0.3)'
                }}>
                <h4 style={{color: 'white', marginTop:0}}>
                    {editingId ? "✏️ Editando Hábito" : `Asignar a: ${pacienteSeleccionado.displayName}`}
                </h4>
                
                <div style={{display: 'flex', gap: '15px', alignItems:'center', flexWrap: 'wrap'}}>
                    <div style={{flex: 2, minWidth: '200px'}}>
                        <input type="text" value={tituloHabito} onChange={(e) => setTituloHabito(e.target.value)} placeholder="Nombre del Hábito..." 
                            style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white'}} />
                    </div>
                    <div style={{flex: 1, minWidth: '150px'}}>
                        <select value={frecuenciaMeta} onChange={(e) => setFrecuenciaMeta(Number(e.target.value))}
                            style={{width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.9rem'}}>
                            <option value={1}>1 día / sem</option> <option value={2}>2 días / sem</option> <option value={3}>3 días / sem</option>
                            <option value={4}>4 días / sem</option> <option value={5}>5 días / sem</option> <option value={6}>6 días / sem</option> <option value={7}>Diario (7)</option>
                        </select>
                    </div>
                    <button onClick={guardarHabito} className="btn-primary" style={{height:'42px', minWidth: '100px', display:'flex', alignItems:'center', justifyContent:'center'}}>
                        {editingId ? "GUARDAR" : "AGREGAR"}
                    </button>
                    {editingId && <button onClick={cancelarEdicion} style={{background:'none', border:'none', color:'#EF4444', cursor:'pointer'}}>Cancelar</button>}
                </div>
              </div>
              
              {/* LISTA DE HÁBITOS */}
              <div style={{display: 'grid', gap: '10px'}}>
                {habitosPaciente.map(h => {
                   const diasLogrados = contarDiasCompletados(h.registro);
                   const meta = h.frecuenciaMeta || 7;
                   const porcentaje = Math.min(100, Math.round((diasLogrados / meta) * 100));
                   const cumplido = diasLogrados >= meta;
                   const esArchivado = h.estado === 'archivado';

                   return (
                    <div key={h.id} style={{
                        background: esArchivado ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)', 
                        padding: '15px 20px', borderRadius: '12px', 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        border: esArchivado ? '1px dashed rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.05)',
                        opacity: esArchivado ? 0.6 : 1
                    }}>
                      <div style={{flex: 1}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'5px'}}>
                            <strong style={{color:'white', fontSize:'1.1rem', letterSpacing:'0.5px', textDecoration: esArchivado ? 'line-through' : 'none'}}>
                                {h.titulo} {esArchivado && "(Graduado)"}
                            </strong>
                            <span style={{color: cumplido ? 'var(--secondary)' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold'}}>
                                {diasLogrados} / {meta} Días
                            </span>
                        </div>
                        <div style={{width: '100%', background: 'rgba(0,0,0,0.5)', height: '6px', borderRadius:'3px', overflow:'hidden'}}>
                            <div style={{width: `${porcentaje}%`, background: cumplido ? 'var(--secondary)' : 'var(--primary)', height: '100%', borderRadius:'3px'}}></div>
                        </div>
                      </div>
                      
                      {/* BOTONERA DE ICONOS (NUEVA) */}
                      <div style={{display:'flex', gap:'10px', marginLeft:'15px', alignItems:'center'}}>
                          
                          {/* EDITAR (Azul) */}
                          <button onClick={() => cargarParaEditar(h)} title="Editar" 
                            style={{background:'none', border:'none', cursor:'pointer', color:'var(--primary)', padding:'5px'}}>
                            <IconEdit />
                          </button>
                          
                          {/* GRADUAR/RESTAURAR (Verde/Blanco) */}
                          <button onClick={() => archivarHabito(h.id, h.estado)} title={esArchivado ? "Reactivar" : "Graduar"} 
                            style={{background:'none', border:'none', cursor:'pointer', color: esArchivado ? 'white' : 'var(--secondary)', padding:'5px'}}>
                            {esArchivado ? <IconRestore /> : <IconMedal />}
                          </button>
                          
                          {/* ELIMINAR (Rojo) */}
                          <button onClick={() => eliminarHabito(h.id)} title="Eliminar Totalmente" 
                            style={{background:'none', border:'none', cursor:'pointer', color:'#EF4444', padding:'5px', opacity: 0.8}}>
                            <IconTrash />
                          </button>

                      </div>
                    </div>
                   )
                })}
              </div>
            </div>
          ) : (
            <div style={{padding: '60px', textAlign: 'center', color: 'var(--text-muted)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px', background: 'rgba(0,0,0,0.2)'}}>
              <p>Selecciona un paciente.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}