import { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, onSnapshot, getDocs, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

// Icono de Basura
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;

export function PanelAdmin() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [procesando, setProcesando] = useState(false);
  const [logMigracion, setLogMigracion] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsuarios(lista);
    });
    return () => unsubscribe();
  }, []);

  const mapaPsicologos = usuarios.reduce((acc, user) => {
      if (user.rol === 'psicologo') acc[user.id] = user.displayName || "Sin Nombre";
      return acc;
  }, {} as Record<string, string>);

  // --- ELIMINACIÓN TOTAL DE USUARIO ---
  const eliminarTotalmente = async (usuario: any) => {
      const confirmacion = prompt(`⚠️ ADVERTENCIA DE SEGURIDAD ⚠️\n\nEstás a punto de ELIMINAR TOTALMENTE al usuario: ${usuario.displayName}.\n\nEsta acción no se puede deshacer. Se borrarán sus datos, hábitos y acceso.\n\nEscribe "BORRAR" para confirmar:`);
      
      if (confirmacion !== "BORRAR") return;

      setProcesando(true);
      try {
          // 1. Si es PACIENTE, hay que limpiar su basura en la carpeta del psicólogo
          if (usuario.rol === 'paciente' && usuario.psicologoId) {
              console.log("Limpiando datos anidados del paciente...");
              
              // A. Borrar Hábitos (Uno por uno porque Firestore no borra colecciones enteras)
              const habitosRef = collection(db, "users", usuario.psicologoId, "pacientes", usuario.id, "habitos");
              const snapshotHabitos = await getDocs(habitosRef);
              
              // Usamos Batch para borrar rápido
              const batch = writeBatch(db);
              snapshotHabitos.forEach(doc => {
                  batch.delete(doc.ref);
              });
              await batch.commit();

              // B. Borrar el documento del paciente dentro del psicólogo
              await deleteDoc(doc(db, "users", usuario.psicologoId, "pacientes", usuario.id));
          }

          // 2. Borrar el Usuario Raíz (Directorio) - Aplica para todos
          await deleteDoc(doc(db, "users", usuario.id));

          alert(`✅ Usuario ${usuario.displayName} eliminado del sistema.`);

      } catch (error: any) {
          console.error(error);
          alert("Error al eliminar: " + error.message);
      } finally {
          setProcesando(false);
      }
  };

  // --- HERRAMIENTA DE MIGRACIÓN (Mantenemos por si acaso) ---
  const ejecutarMigracionProfunda = async () => {
      if(!confirm("⚠️ ¿MIGRAR A ESTRUCTURA ANIDADA?\n\nEsto moverá los hábitos de 'users/{id}/habitos' a 'users/{psico}/pacientes/{id}/habitos'.")) return;
      setProcesando(true);
      setLogMigracion("Iniciando migración...");
      let total = 0;
      try {
          const pacientes = usuarios.filter(u => u.rol === 'paciente');
          for (const p of pacientes) {
              if (!p.psicologoId) continue;
              const rutaViejaRef = collection(db, "users", p.id, "habitos");
              const snapshot = await getDocs(rutaViejaRef);
              if (snapshot.empty) continue;
              
              for (const docHabito of snapshot.docs) {
                  const data = docHabito.data();
                  const rutaNuevaRef = doc(db, "users", p.psicologoId, "pacientes", p.id, "habitos", docHabito.id);
                  await setDoc(rutaNuevaRef, data);
                  total++;
              }
          }
          setLogMigracion(prev => prev + `\n✅ FIN: Se migraron ${total} documentos.`);
      } catch (e: any) { setLogMigracion(prev => prev + `\n⛔ ERROR: ${e.message}`); } 
      finally { setProcesando(false); }
  };

  // --- ORDENAMIENTO ---
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const usuariosOrdenados = [...usuarios].sort((a, b) => {
    if (!sortConfig) return 0;
    let valA = a[sortConfig.key] || "";
    let valB = b[sortConfig.key] || "";
    if (sortConfig.key === 'psicologoId') {
        valA = mapaPsicologos[valA] || (a.rol === 'paciente' ? "zzz" : "");
        valB = mapaPsicologos[valB] || (b.rol === 'paciente' ? "zzz" : "");
    }
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleAutorizacion = async (uid: string, estadoActual: boolean) => {
    await updateDoc(doc(db, "users", uid), { isAuthorized: !estadoActual });
  };

  const asignarRol = async (uid: string, tipo: 'psico' | 'paciente') => {
    if(!confirm(`¿Confirmar rol?`)) return;
    const updates: any = { isPsicologo: false, isPaciente: false, estatus: 'activo' };
    if (tipo === 'psico') {
        updates.rol = 'psicologo'; updates.isAuthorized = true; updates.codigoVinculacion = "PSI-" + Math.floor(1000 + Math.random() * 9000);
    } else {
        updates.rol = 'paciente'; updates.isAuthorized = false; updates.estatus = 'pendiente';
    }
    await updateDoc(doc(db, "users", uid), updates);
  };

  const SortableHeader = ({ label, field }: { label: string, field: string }) => (
      <th onClick={() => handleSort(field)} style={{textAlign:'left', padding:'15px', color:'var(--primary)', fontSize:'0.85rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap'}}>
        <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
            {label} {sortConfig?.key === field && <span style={{fontSize:'0.7rem'}}>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>}
        </div>
      </th>
  );

  return (
    <div style={{textAlign: 'left'}}>
      <div style={{background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', marginBottom: '30px', border: 'var(--glass-border)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div><h3 style={{margin:0, color: 'var(--primary)', fontSize:'1.5rem'}}>🛠️ Control Global</h3>
        <p style={{margin:0, fontSize:'0.9rem', color:'var(--text-muted)'}}>Usuarios: {usuarios.length}</p>
        </div>
        
        <button onClick={ejecutarMigracionProfunda} disabled={procesando} style={{background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)', border:'none', padding:'10px 20px', borderRadius:'8px', fontSize:'0.8rem', cursor: procesando ? 'wait' : 'pointer'}}>
            {procesando ? "..." : "🔧 Herramientas"}
        </button>
      </div>

      {logMigracion && <div style={{background:'black', color:'#10B981', padding:'10px', borderRadius:'8px', marginBottom:'20px', fontFamily:'monospace', whiteSpace:'pre-wrap', maxHeight:'200px', overflowY:'auto', fontSize:'0.8rem'}}>{logMigracion}</div>}

      <div style={{background: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', border: 'var(--glass-border)', overflowX: 'auto'}}>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead style={{background: 'rgba(0,0,0,0.2)'}}>
                <tr>
                    <SortableHeader label="USUARIO" field="displayName" />
                    <SortableHeader label="ROL" field="rol" />
                    <SortableHeader label="ASIGNADO A" field="psicologoId" />
                    <th style={{textAlign:'center', padding:'15px', color:'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>ACCIONES</th>
                    <th style={{textAlign:'center', padding:'15px', color:'#EF4444', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>BORRAR</th>
                </tr>
            </thead>
            <tbody>
            {usuariosOrdenados.map(u => (
                <tr key={u.id} style={{borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                    <td style={{padding:'15px'}}><div style={{fontWeight:'bold', color:'white'}}>{u.displayName}</div><small style={{color:'var(--text-muted)'}}>{u.email}</small></td>
                    <td style={{padding:'15px'}}>
                        {u.rol === 'psicologo' && <span style={{color:'#34D399', fontWeight:'bold'}}>TERAPEUTA</span>}
                        {u.rol === 'paciente' && <span style={{color:'var(--primary)', fontWeight:'bold'}}>PACIENTE</span>}
                        {!u.rol && <span style={{color:'gray'}}>NUEVO</span>}
                    </td>
                    <td style={{padding:'15px'}}>{u.rol === 'paciente' ? (u.psicologoId ? <span style={{color:'white'}}>👨‍⚕️ {mapaPsicologos[u.psicologoId]}</span> : <span style={{color:'gray'}}>--</span>) : <span>—</span>}</td>
                    
                    {/* ACCIONES DE ROL */}
                    <td style={{textAlign:'center', padding:'15px'}}>
                        {!u.rol && !u.isAdmin && (
                            <div style={{display:'flex', gap:'5px', justifyContent:'center'}}>
                                <button onClick={()=>asignarRol(u.id,'psico')} style={{border:'1px solid var(--primary)', background:'transparent', color:'var(--primary)', borderRadius:'4px', cursor:'pointer'}}>PSICO</button>
                                <button onClick={()=>asignarRol(u.id,'paciente')} style={{border:'1px solid var(--secondary)', background:'transparent', color:'var(--secondary)', borderRadius:'4px', cursor:'pointer'}}>PACIENTE</button>
                            </div>
                        )}
                        {u.rol === 'psicologo' && !u.isAdmin && <button onClick={()=>toggleAutorizacion(u.id, u.isAuthorized)} style={{border:'1px solid #F87171', background:'transparent', color:'#F87171', borderRadius:'4px', cursor:'pointer'}}>{u.isAuthorized?"REVOCAR":"APROBAR"}</button>}
                    </td>

                    {/* BORRADO TOTAL */}
                    <td style={{textAlign:'center', padding:'15px'}}>
                        {!u.isAdmin && (
                            <button 
                                onClick={() => eliminarTotalmente(u)}
                                disabled={procesando}
                                title="Eliminar Usuario Totalmente"
                                style={{background:'rgba(239, 68, 68, 0.1)', border:'1px solid #EF4444', color:'#EF4444', padding:'8px', borderRadius:'8px', cursor:'pointer'}}
                            >
                                <IconTrash />
                            </button>
                        )}
                    </td>
                </tr>
            ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}