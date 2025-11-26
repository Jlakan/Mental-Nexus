import { useState, useEffect } from 'react';
import { doc, updateDoc, addDoc, deleteDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

export function PanelPsicologo({ userData, userUid }: any) {
  const [pacientes, setPacientes] = useState<any[]>([]); 
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);
  const [habitosPaciente, setHabitosPaciente] = useState<any[]>([]);
  
  // Formulario y Edición
  const [tituloHabito, setTituloHabito] = useState("");
  const [frecuenciaMeta, setFrecuenciaMeta] = useState(7);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recompensas, setRecompensas] = useState<string[]>([]);

  // 1. Cargar pacientes (Desde mi subcolección)
  useEffect(() => {
    const colRef = collection(db, "users", userUid, "pacientes");
    const unsubscribe = onSnapshot(colRef, (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPacientes(lista);
    });
    return () => unsubscribe();
  }, [userUid]);

  // 2. Cargar hábitos (RUTA PROFUNDA ACTUALIZADA)
  useEffect(() => {
    if (!pacienteSeleccionado) { setHabitosPaciente([]); return; }
    
    // RUTA: users/{YO_PSICOLOGO}/pacientes/{PACIENTE_ID}/habitos
    const colRef = collection(db, "users", userUid, "pacientes", pacienteSeleccionado.id, "habitos");
    
    const unsubscribe = onSnapshot(colRef, (snap) => {
        const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setHabitosPaciente(lista);
    });
    return () => unsubscribe();
  }, [pacienteSeleccionado, userUid]); // Agregamos userUid a dependencias

  // --- MANEJO DE RECOMPENSAS ---
  const toggleRecompensa = (tipo: string) => {
    if (recompensas.includes(tipo)) setRecompensas(recompensas.filter(r => r !== tipo));
    else setRecompensas([...recompensas, tipo]);
  };

  // --- CREAR NUEVO (RUTA PROFUNDA) ---
  const guardarHabito = async () => {
    if (!tituloHabito || !pacienteSeleccionado) return;
    
    // Referencia a la colección profunda
    const habitosRef = collection(db, "users", userUid, "pacientes", pacienteSeleccionado.id, "habitos");

    const datos = {
        titulo: tituloHabito, 
        frecuenciaMeta: frecuenciaMeta,
        recompensas: recompensas.length > 0 ? recompensas : ['xp']
    };

    try {
        if (editingId) {
            // Editar existente
            await updateDoc(doc(habitosRef, editingId), datos);
        } else {
            // Crear nuevo
            await addDoc(habitosRef, {
                ...datos,
                asignadoPor: userUid, 
                estado: 'activo',
                createdAt: new Date(), 
                registro: { L: false, M: false, X: false, J: false, V: false, S: false, D: false }
            });
        }
        setTituloHabito(""); setFrecuenciaMeta(7); setRecompensas([]); setEditingId(null);
    } catch (e) { console.error(e); }
  };

  // --- EDICIÓN ---
  const cargarParaEditar = (habito: any) => {
      setTituloHabito(habito.titulo);
      setFrecuenciaMeta(habito.frecuenciaMeta || 7);
      setRecompensas(habito.recompensas || []);
      setEditingId(habito.id);
  };

  const cancelarEdicion = () => {
      setTituloHabito(""); setFrecuenciaMeta(7); setRecompensas([]); setEditingId(null);
  };

  // --- ACCIONES EN RUTA PROFUNDA ---
  const autorizarPaciente = async (id: string, estado: boolean) => {
    await updateDoc(doc(db, "users", userUid, "pacientes", id), { isAuthorized: !estado });
  };

  const archivarHabito = async (id: string, estadoActual: string) => {
      const nuevo = estadoActual === 'archivado' ? 'activo' : 'archivado';
      if(confirm(nuevo === 'archivado' ? "Se moverá al historial." : "Se reactivará.")) 
        // Ruta profunda
        await updateDoc(doc(db, "users", userUid, "pacientes", pacienteSeleccionado.id, "habitos", id), { estado: nuevo });
  };

  const eliminarHabito = async (id: string) => {
    if(confirm("⚠️ ¿ELIMINAR TOTALMENTE?")) 
        // Ruta profunda
        await deleteDoc(doc(db, "users", userUid, "pacientes", pacienteSeleccionado.id, "habitos", id));
  };

  const contarDias = (reg: any) => Object.values(reg).filter(v => v === true).length;

  // --- MONITOR DE BALANCE ---
  const analizarBalance = () => {
      if (habitosPaciente.length === 0) return null;
      const activos = habitosPaciente.filter(h => h.estado !== 'archivado');
      if (activos.length === 0) return null;

      const stats = { vitalidad: 0, sabiduria: 0, carisma: 0 };
      activos.forEach(h => {
          if (h.recompensas?.includes('vitalidad')) stats.vitalidad++;
          if (h.recompensas?.includes('sabiduria')) stats.sabiduria++;
          if (h.recompensas?.includes('carisma')) stats.carisma++;
      });

      const faltantes = [];
      if (stats.vitalidad === 0) faltantes.push("VITALIDAD");
      if (stats.sabiduria === 0) faltantes.push("SABIDURÍA");
      if (stats.carisma === 0) faltantes.push("CARISMA");

      if (faltantes.length > 0) {
          return <div style={{background:'rgba(245,158,11,0.1)', border:'1px solid #F59E0B', color:'#F59E0B', padding:'10px', borderRadius:'8px', marginBottom:'20px', fontSize:'0.85rem'}}>⚠️ Balance sugerido: Faltan actividades de <b>{faltantes.join(", ")}</b>.</div>;
      }
      return <div style={{background:'rgba(16,185,129,0.1)', border:'1px solid #10B981', color:'#10B981', padding:'10px', borderRadius:'8px', marginBottom:'20px', fontSize:'0.85rem'}}>✅ Plan Balanceado.</div>;
  };

  return (
    <div style={{textAlign: 'left'}}>
      <div style={{background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', marginBottom: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', border: 'var(--glass-border)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
            <h3 style={{margin:0, color: 'var(--primary)', fontSize:'1.5rem'}}>👨‍⚕️ Mi Consultorio</h3>
            <p style={{margin:0, fontSize:'0.9rem', color:'var(--text-muted)'}}>Código: <strong style={{color:'white'}}>{userData.codigoVinculacion}</strong></p>
        </div>
      </div>

      <div style={{display: 'flex', gap: '30px', flexWrap: 'wrap'}}>
        {/* LISTA PACIENTES */}
        <div style={{flex: 1, minWidth: '300px'}}>
          <h4 style={{textTransform:'uppercase', fontSize:'0.8rem', color:'var(--secondary)', letterSpacing:'2px', marginBottom:'15px'}}>Pacientes</h4>
          <div style={{display: 'grid', gap: '10px'}}>
            {pacientes.map(p => (
              <div key={p.id} onClick={() => p.isAuthorized && setPacienteSeleccionado(p)}
                style={{
                  background: pacienteSeleccionado?.id === p.id ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255,255,255,0.03)',
                  border: pacienteSeleccionado?.id === p.id ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                  padding: '15px', borderRadius: '12px', transition: 'all 0.2s', cursor: p.isAuthorized ? 'pointer' : 'default'
                }}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div>
                        <div style={{fontWeight: 'bold', color: 'white', fontSize:'1.1rem'}}>{p.displayName}</div>
                        <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{p.email}</div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); autorizarPaciente(p.id, p.isAuthorized); }}
                        style={{
                            padding: '6px 12px', borderRadius: '4px', fontSize: '0.65rem', cursor:'pointer', fontWeight: 'bold', letterSpacing:'1px',
                            background: p.isAuthorized ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: p.isAuthorized ? 'var(--secondary)' : '#EF4444', border: p.isAuthorized ? '1px solid var(--secondary)' : '1px solid #EF4444'
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
              
              {/* FICHA STATS */}
              <div style={{background: 'linear-gradient(90deg, rgba(15,23,42,0.8) 0%, rgba(30,41,59,0.8) 100%)', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-around', alignItems: 'center'}}>
                  <div style={{textAlign:'center'}}><div style={{fontSize:'2rem', fontWeight:'bold', color:'white'}}>{pacienteSeleccionado.nivel || 1}</div><div style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>NIVEL</div></div>
                  <div style={{textAlign:'center'}}><div style={{fontSize:'1.5rem', color:'#F59E0B'}}>💰 {pacienteSeleccionado.gold || 0}</div><div style={{fontSize:'0.7rem', color:'var(--text-muted)'}}>ORO</div></div>
                  <div style={{display:'flex', gap:'15px'}}>
                      <div style={{textAlign:'center'}}><span style={{fontSize:'1.2rem'}}>❤️</span><div style={{fontSize:'0.8rem', color:'white'}}>{pacienteSeleccionado.stats?.vitalidad || 0}</div></div>
                      <div style={{textAlign:'center'}}><span style={{fontSize:'1.2rem'}}>🧠</span><div style={{fontSize:'0.8rem', color:'white'}}>{pacienteSeleccionado.stats?.sabiduria || 0}</div></div>
                      <div style={{textAlign:'center'}}><span style={{fontSize:'1.2rem'}}>🤝</span><div style={{fontSize:'0.8rem', color:'white'}}>{pacienteSeleccionado.stats?.carisma || 0}</div></div>
                  </div>
              </div>

              {analizarBalance()}

              {/* FORMULARIO CREAR/EDITAR */}
              <div style={{background: 'var(--bg-card)', padding: '25px', borderRadius: '16px', marginBottom: '20px', border: editingId ? '1px solid var(--primary)' : 'var(--glass-border)', boxShadow: '0 4px 30px rgba(0,0,0,0.3)'}}>
                <h4 style={{color: 'white', marginTop:0}}>{editingId ? "✏️ EDITAR" : "NUEVA MISIÓN"}</h4>
                <div style={{marginBottom: '15px'}}>
                    <input type="text" value={tituloHabito} onChange={(e) => setTituloHabito(e.target.value)} placeholder="Descripción..." style={{background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.2)', color:'white'}} />
                </div>
                <div style={{display:'flex', gap:'10px', marginBottom:'15px'}}>
                    {['vitalidad', 'sabiduria', 'carisma'].map(tipo => (
                        <button key={tipo} onClick={() => toggleRecompensa(tipo)} style={{
                            background: recompensas.includes(tipo) ? (tipo==='vitalidad'?'#EF4444':tipo==='sabiduria'?'#3B82F6':'#F59E0B') : 'transparent', 
                            color: recompensas.includes(tipo) ? (tipo==='carisma'?'black':'white') : (tipo==='vitalidad'?'#EF4444':tipo==='sabiduria'?'#3B82F6':'#F59E0B'), 
                            border: `1px solid ${tipo==='vitalidad'?'#EF4444':tipo==='sabiduria'?'#3B82F6':'#F59E0B'}`, 
                            borderRadius:'20px', padding:'5px 12px', fontSize:'0.8rem', cursor:'pointer', textTransform:'capitalize'
                        }}>
                            {tipo === 'vitalidad' && '❤️ '} {tipo === 'sabiduria' && '🧠 '} {tipo === 'carisma' && '🤝 '} {tipo}
                        </button>
                    ))}
                </div>
                <div style={{display: 'flex', gap: '15px', alignItems:'center'}}>
                    <div style={{flex: 1}}>
                        <select value={frecuenciaMeta} onChange={(e) => setFrecuenciaMeta(Number(e.target.value))} style={{width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.9rem'}}>
                            {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} día{n>1?'s':''}/sem</option>)}
                        </select>
                    </div>
                    <button onClick={guardarHabito} className="btn-primary" style={{flex: 1, height:'42px'}}>{editingId ? "GUARDAR CAMBIOS" : "AGREGAR"}</button>
                    {editingId && <button onClick={cancelarEdicion} style={{background:'none', border:'none', color:'#EF4444', cursor:'pointer'}}>CANCELAR</button>}
                </div>
              </div>
              
              {/* LISTA HÁBITOS */}
              <div style={{display: 'grid', gap: '10px'}}>
                {habitosPaciente.map(h => {
                   const diasLogrados = contarDias(h.registro);
                   const meta = h.frecuenciaMeta || 7;
                   const porcentaje = Math.min(100, Math.round((diasLogrados / meta) * 100));
                   const cumplido = diasLogrados >= meta;
                   const esArchivado = h.estado === 'archivado';

                   return (
                    <div key={h.id} style={{
                        background: esArchivado ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)', 
                        padding: '15px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        border: esArchivado ? '1px dashed rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.05)', opacity: esArchivado ? 0.5 : 1
                    }}>
                      <div style={{flex: 1}}>
                        <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'5px'}}>
                            <strong style={{color:'white', fontSize:'1.1rem', textDecoration: esArchivado ? 'line-through' : 'none'}}>{h.titulo}</strong>
                            <div style={{display:'flex', gap:'3px'}}>
                                {h.recompensas?.includes('vitalidad') && <span style={{fontSize:'0.8rem'}}>❤️</span>}
                                {h.recompensas?.includes('sabiduria') && <span style={{fontSize:'0.8rem'}}>🧠</span>}
                                {h.recompensas?.includes('carisma') && <span style={{fontSize:'0.8rem'}}>🤝</span>}
                            </div>
                        </div>
                        <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem', color:'var(--text-muted)', marginBottom:'3px'}}>
                            <span>{diasLogrados}/{meta} Días</span>
                            <span>{esArchivado ? "MASTERED" : "EN CURSO"}</span>
                        </div>
                        <div style={{width: '100%', background: 'rgba(0,0,0,0.5)', height: '4px', borderRadius:'2px', overflow:'hidden'}}>
                            <div style={{width: `${porcentaje}%`, background: cumplido ? 'var(--secondary)' : 'var(--primary)', height: '100%'}}></div>
                        </div>
                      </div>
                      <div style={{display:'flex', gap:'10px', marginLeft:'15px'}}>
                          <button onClick={() => cargarParaEditar(h)} style={{background:'none', border:'1px solid var(--primary)', color:'var(--primary)', padding:'4px 8px', borderRadius:'4px', cursor:'pointer', fontSize:'0.7rem'}}>EDIT</button>
                          <button onClick={() => archivarHabito(h.id, h.estado)} style={{background:'none', border: esArchivado ? '1px solid white' : '1px solid var(--secondary)', color: esArchivado ? 'white' : 'var(--secondary)', padding:'4px 8px', borderRadius:'4px', cursor:'pointer', fontSize:'0.7rem'}}>{esArchivado ? "RESTORE" : "MASTER"}</button>
                          <button onClick={() => eliminarHabito(h.id)} style={{background:'none', border:'1px solid #EF4444', color:'#EF4444', padding:'4px 8px', borderRadius:'4px', cursor:'pointer', fontSize:'0.7rem'}}>PURGE</button>
                      </div>
                    </div>
                   )
                })}
              </div>
            </div>
          ) : <div style={{padding: '60px', textAlign: 'center', color: 'var(--text-muted)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px'}}>Selecciona un paciente.</div>}
        </div>
      </div>
    </div>
  );
}