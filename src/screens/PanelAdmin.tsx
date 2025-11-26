import { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, onSnapshot, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

export function PanelAdmin() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [migrando, setMigrando] = useState(false);
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

  // --- MIGRACIÓN DE RUTA CORTA A PROFUNDA ---
  const migrarRutaProfunda = async () => {
      if(!confirm("⚠️ ¿MIGRAR A ESTRUCTURA ANIDADA?\n\nEsto moverá los hábitos de 'users/{id}/habitos' a 'users/{psico}/pacientes/{id}/habitos'.")) return;

      setMigrando(true);
      setLogMigracion("Iniciando migración estructural...");
      let total = 0;

      try {
          const pacientes = usuarios.filter(u => u.rol === 'paciente');
          
          for (const p of pacientes) {
              if (!p.psicologoId) {
                  setLogMigracion(prev => prev + `\n❌ ${p.displayName}: Sin psicólogo.`);
                  continue;
              }

              // 1. Leer de la ruta "Corta" (Donde están ahora)
              const rutaViejaRef = collection(db, "users", p.id, "habitos");
              const snapshot = await getDocs(rutaViejaRef);

              if (snapshot.empty) {
                  continue; // Nada que mover
              }

              setLogMigracion(prev => prev + `\n🔄 ${p.displayName}: Moviendo ${snapshot.size} hábitos...`);

              for (const docHabito of snapshot.docs) {
                  const data = docHabito.data();
                  
                  // 2. Escribir en ruta "Profunda" (Destino)
                  // users/{PSICO}/pacientes/{PACIENTE}/habitos/{HABITO}
                  const rutaNuevaRef = doc(db, "users", p.psicologoId, "pacientes", p.id, "habitos", docHabito.id);
                  await setDoc(rutaNuevaRef, data);

                  // 3. Borrar de la ruta vieja (Opcional, para limpieza)
                  // await deleteDoc(docHabito.ref); 
                  total++;
              }
          }
          setLogMigracion(prev => prev + `\n✅ FIN: Se migraron ${total} documentos.`);
      } catch (e: any) {
          console.error(e);
          setLogMigracion(prev => prev + `\n⛔ ERROR: ${e.message}`);
      } finally {
          setMigrando(false);
      }
  };

  // ... (Resto de funciones de sort y tabla igual que antes) ...
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
        <div><h3 style={{margin:0, color: 'var(--primary)', fontSize:'1.5rem'}}>🛠️ Control Global</h3></div>
        
        <button onClick={migrarRutaProfunda} disabled={migrando} style={{background: migrando ? '#374151' : '#8B5CF6', color: 'white', border:'none', padding:'10px 20px', borderRadius:'8px', fontWeight:'bold', cursor: migrando ? 'wait' : 'pointer', boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)'}}>
            {migrando ? "MIGRANDO..." : "📂 MIGRAR A RUTA ANIDADA"}
        </button>
      </div>

      {logMigracion && <div style={{background:'black', color:'#10B981', padding:'10px', borderRadius:'8px', marginBottom:'20px', fontFamily:'monospace', whiteSpace:'pre-wrap', maxHeight:'200px', overflowY:'auto', fontSize:'0.8rem'}}>{logMigracion}</div>}

      <div style={{background: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', border: 'var(--glass-border)', overflowX: 'auto'}}>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead style={{background: 'rgba(0,0,0,0.2)'}}>
                <tr>
                    <SortableHeader label="USUARIO" field="displayName" />
                    <SortableHeader label="ROL" field="rol" />
                    <SortableHeader label="DOCTOR" field="psicologoId" />
                    <th style={{textAlign:'center', padding:'15px', color:'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>ACCIONES</th>
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
                    <td style={{textAlign:'center', padding:'15px'}}>
                        {!u.rol && !u.isAdmin && (
                            <div style={{display:'flex', gap:'5px', justifyContent:'center'}}>
                                <button onClick={()=>asignarRol(u.id,'psico')} style={{border:'1px solid var(--primary)', background:'transparent', color:'var(--primary)', borderRadius:'4px', cursor:'pointer'}}>PSICO</button>
                                <button onClick={()=>asignarRol(u.id,'paciente')} style={{border:'1px solid var(--secondary)', background:'transparent', color:'var(--secondary)', borderRadius:'4px', cursor:'pointer'}}>PACIENTE</button>
                            </div>
                        )}
                        {u.rol === 'psicologo' && !u.isAdmin && <button onClick={()=>toggleAutorizacion(u.id, u.isAuthorized)} style={{border:'1px solid #F87171', background:'transparent', color:'#F87171', borderRadius:'4px', cursor:'pointer'}}>{u.isAuthorized?"REVOCAR":"APROBAR"}</button>}
                    </td>
                </tr>
            ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}