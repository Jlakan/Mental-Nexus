import { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, onSnapshot, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

export function PanelAdmin() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [migrando, setMigrando] = useState(false); // Estado para el botón de carga
  
  // Estado para el ordenamiento
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Cargar TODOS los usuarios
  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsuarios(lista);
    });
    return () => unsubscribe();
  }, []);

  // Diccionario ID -> Nombre
  const mapaPsicologos = usuarios.reduce((acc, user) => {
      if (user.rol === 'psicologo') {
          acc[user.id] = user.displayName || "Sin Nombre";
      }
      return acc;
  }, {} as Record<string, string>);

  // --- HERRAMIENTA DE MIGRACIÓN (NUEVO) ---
  const ejecutarMigracion = async () => {
      if(!confirm("⚠️ ATENCIÓN: Esto copiará todos los hábitos de la colección raíz 'habitos' a las carpetas personales de cada paciente.\n\n¿Deseas continuar?")) return;

      setMigrando(true);
      try {
          console.log("Iniciando migración...");
          
          // 1. Leer colección vieja
          const oldRef = collection(db, "habitos");
          const snapshot = await getDocs(oldRef);
          
          let copiados = 0;
          let errores = 0;

          // 2. Iterar y copiar
          for (const docViejo of snapshot.docs) {
              const data = docViejo.data();
              const pacienteId = data.pacienteId;

              if (pacienteId) {
                  try {
                      // Escribir en la nueva ruta: users/{pacienteId}/habitos/{docId}
                      // Usamos setDoc para mantener el MISMO ID original
                      await setDoc(doc(db, "users", pacienteId, "habitos", docViejo.id), data);
                      copiados++;
                  } catch (e) {
                      console.error("Error al copiar hábito:", docViejo.id, e);
                      errores++;
                  }
              } else {
                  console.warn("Hábito huérfano (sin pacienteId):", docViejo.id);
                  errores++;
              }
          }

          alert(`✅ MIGRACIÓN COMPLETADA\n\n- Copiados con éxito: ${copiados}\n- Errores/Omitidos: ${errores}\n\nAhora verifica en Firebase antes de borrar la colección vieja.`);

      } catch (error: any) {
          console.error("Error crítico:", error);
          alert("Error en la migración: " + error.message);
      } finally {
          setMigrando(false);
      }
  };

  // --- LÓGICA DE ORDENAMIENTO ---
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
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

  // --- ACCIONES DE BASE DE DATOS ---
  const toggleAutorizacion = async (uid: string, estadoActual: boolean) => {
    await updateDoc(doc(db, "users", uid), { isAuthorized: !estadoActual });
  };

  const asignarRol = async (uid: string, tipo: 'psico' | 'paciente') => {
    if(!confirm(`¿Confirmar rol de ${tipo === 'psico' ? 'Terapeuta' : 'Paciente'}?`)) return;
    
    const updates: any = { 
        isPsicologo: false, isPaciente: false, estatus: 'activo'
    };
    
    if (tipo === 'psico') {
        updates.rol = 'psicologo';
        updates.isAuthorized = true;
        updates.codigoVinculacion = "PSI-" + Math.floor(1000 + Math.random() * 9000);
    } else {
        updates.rol = 'paciente';
        updates.isAuthorized = false;
        updates.estatus = 'pendiente';
    }
    await updateDoc(doc(db, "users", uid), updates);
  };

  const SortableHeader = ({ label, field }: { label: string, field: string }) => (
      <th 
        onClick={() => handleSort(field)}
        style={{
            textAlign:'left', padding:'15px', color:'var(--primary)', fontSize:'0.85rem', 
            cursor: 'pointer', userSelect: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)',
            whiteSpace: 'nowrap'
        }}
      >
        <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
            {label}
            {sortConfig?.key === field && (
                <span style={{fontSize:'0.7rem'}}>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
            )}
            {sortConfig?.key !== field && <span style={{opacity:0.3, fontSize:'0.7rem'}}>⇅</span>}
        </div>
      </th>
  );

  return (
    <div style={{textAlign: 'left'}}>
      
      {/* HEADER DEL PANEL */}
      <div style={{
          background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', marginBottom: '30px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)', border: 'var(--glass-border)',
          display:'flex', justifyContent:'space-between', alignItems:'center'
      }}>
        <div>
            <h3 style={{margin:0, color: 'var(--primary)', fontSize:'1.5rem'}}>🛠️ Control Global</h3>
            <p style={{margin:0, fontSize:'0.9rem', color:'var(--text-muted)'}}>
                Usuarios Totales: <strong style={{color:'white'}}>{usuarios.length}</strong>
            </p>
        </div>

        {/* BOTÓN DE MIGRACIÓN */}
        <button 
            onClick={ejecutarMigracion} 
            disabled={migrando}
            style={{
                background: migrando ? '#374151' : '#F59E0B', 
                color: 'black', border:'none', padding:'10px 20px', borderRadius:'8px', 
                fontWeight:'bold', cursor: migrando ? 'wait' : 'pointer',
                boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)'
            }}
        >
            {migrando ? "MIGRANDO..." : "⚡ MIGRAR BD"}
        </button>
      </div>

      {/* TABLA DE DATOS */}
      <div style={{
          background: 'var(--bg-card)', borderRadius: '16px', overflow: 'hidden', 
          boxShadow: '0 4px 30px rgba(0,0,0,0.2)', border: 'var(--glass-border)',
          overflowX: 'auto'
      }}>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead style={{background: 'rgba(0,0,0,0.2)'}}>
                <tr>
                    <SortableHeader label="USUARIO / EMAIL" field="displayName" />
                    <SortableHeader label="ROL DEL SISTEMA" field="rol" />
                    <SortableHeader label="ASIGNADO A" field="psicologoId" />
                    <th style={{textAlign:'center', padding:'15px', color:'var(--primary)', fontSize:'0.85rem', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
                        COMANDOS
                    </th>
                </tr>
            </thead>
            <tbody>
            {usuariosOrdenados.map(u => (
                <tr key={u.id} style={{borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s'}} className="hover-row">
                    <td style={{padding:'15px'}}>
                        <div style={{fontWeight:'bold', color:'white', fontSize:'1rem'}}>{u.displayName}</div>
                        <div style={{fontSize:'0.8rem', color:'var(--text-muted)', fontFamily:'monospace'}}>{u.email}</div>
                    </td>
                    <td style={{padding:'15px'}}>
                        {u.isAdmin && <span style={{background:'rgba(251, 191, 36, 0.2)', color:'#FBBF24', border:'1px solid #FBBF24', padding:'2px 8px', borderRadius:'4px', fontSize:'0.7rem', fontWeight:'bold', marginRight:'5px', letterSpacing:'1px'}}>ADMIN</span>}
                        {u.rol === 'psicologo' && (
                            <span style={{
                                background: u.isAuthorized ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                                color: u.isAuthorized ? '#34D399' : '#F87171', 
                                border: u.isAuthorized ? '1px solid #34D399' : '1px solid #F87171',
                                padding:'2px 8px', borderRadius:'4px', fontSize:'0.7rem', fontWeight:'bold', letterSpacing:'1px'
                            }}>
                                {u.isAuthorized ? "TERAPEUTA" : "PENDIENTE"}
                            </span>
                        )}
                        {u.rol === 'paciente' && <span style={{background:'rgba(6, 182, 212, 0.1)', color:'var(--primary)', border:'1px solid var(--primary)', padding:'2px 8px', borderRadius:'4px', fontSize:'0.7rem', fontWeight:'bold', letterSpacing:'1px'}}>PACIENTE</span>}
                        {(!u.rol) && <span style={{background:'rgba(255,255,255,0.1)', color:'var(--text-muted)', padding:'2px 8px', borderRadius:'4px', fontSize:'0.7rem'}}>NUEVO</span>}
                    </td>
                    <td style={{padding:'15px'}}>
                        {u.rol === 'paciente' ? (
                            u.psicologoId ? (
                                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                    <span style={{fontSize:'1rem'}}>👨‍⚕️</span>
                                    <span style={{color:'white', fontWeight:'500', fontSize:'0.9rem'}}>
                                        {mapaPsicologos[u.psicologoId] || "ID Desconocido"}
                                    </span>
                                </div>
                            ) : (
                                <span style={{color:'var(--text-muted)', fontStyle:'italic', fontSize:'0.8rem'}}>-- Sin asignar --</span>
                            )
                        ) : (
                            <span style={{color:'var(--text-muted)', opacity:0.3}}>—</span>
                        )}
                    </td>
                    <td style={{textAlign:'center', padding:'15px'}}>
                        {!u.rol && !u.isAdmin && (
                            <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
                                <button onClick={() => asignarRol(u.id, 'psico')} style={{border: '1px solid var(--primary)', background:'rgba(6, 182, 212, 0.1)', padding: '6px 10px', borderRadius: '6px', cursor:'pointer', fontSize:'0.7rem', color:'var(--primary)', fontWeight:'bold'}}>+ PSICO</button>
                                <button onClick={() => asignarRol(u.id, 'paciente')} style={{border: '1px solid var(--secondary)', background:'rgba(16, 185, 129, 0.1)', padding: '6px 10px', borderRadius: '6px', cursor:'pointer', fontSize:'0.7rem', color:'var(--secondary)', fontWeight:'bold'}}>+ PACIENTE</button>
                            </div>
                        )}
                        {u.rol === 'psicologo' && !u.isAdmin && (
                            <button onClick={() => toggleAutorizacion(u.id, u.isAuthorized)} style={{border: u.isAuthorized ? '1px solid #F87171' : '1px solid var(--secondary)', background: 'transparent', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', fontWeight:'bold', fontSize:'0.7rem', color: u.isAuthorized ? '#F87171' : 'var(--secondary)'}}>
                                {u.isAuthorized ? "REVOCAR" : "APROBAR"}
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