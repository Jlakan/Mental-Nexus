import { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

export function PanelAdmin() {
  const [usuarios, setUsuarios] = useState<any[]>([]);

  // Cargar TODOS los usuarios
  useEffect(() => {
    // No filtramos por rol, traemos todo para poder cruzar datos
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsuarios(lista);
    });
    return () => unsubscribe();
  }, []);

  // --- LÓGICA DE CRUCE DE DATOS (ID -> NOMBRE) ---
  // Creamos un "Diccionario" rápido para buscar nombres de psicólogos por su ID
  const mapaPsicologos = usuarios.reduce((acc, user) => {
      if (user.rol === 'psicologo') {
          acc[user.id] = user.displayName || "Sin Nombre";
      }
      return acc;
  }, {} as Record<string, string>);

  const toggleAutorizacion = async (uid: string, estadoActual: boolean) => {
    await updateDoc(doc(db, "users", uid), { isAuthorized: !estadoActual });
  };

  const asignarRol = async (uid: string, tipo: 'psico' | 'paciente') => {
    if(!confirm(`¿Confirmar rol de ${tipo === 'psico' ? 'Terapeuta' : 'Paciente'}?`)) return;
    
    const updates: any = { 
        isPsicologo: false, 
        isPaciente: false,
        estatus: 'activo'
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

  return (
    <div className="container" style={{maxWidth: '1100px'}}>
      <h2>🛠️ Panel de Control Global</h2>
      <p>Gestiona roles, permisos y vinculaciones.</p>

      <div style={{background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginTop: '20px', overflowX: 'auto'}}>
        <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead style={{background: '#F9FAFB'}}>
                <tr>
                    <th style={{textAlign:'left', padding:'15px', color:'#6B7280', fontSize:'0.85rem'}}>Usuario</th>
                    <th style={{textAlign:'left', padding:'15px', color:'#6B7280', fontSize:'0.85rem'}}>Rol / Estado</th>
                    <th style={{textAlign:'left', padding:'15px', color:'#6B7280', fontSize:'0.85rem'}}>Asignación</th> {/* NUEVA COLUMNA */}
                    <th style={{textAlign:'center', padding:'15px', color:'#6B7280', fontSize:'0.85rem'}}>Acciones</th>
                </tr>
            </thead>
            <tbody>
            {usuarios.map(u => (
                <tr key={u.id} style={{borderBottom: '1px solid #F3F4F6'}}>
                    
                    {/* 1. USUARIO */}
                    <td style={{padding:'15px'}}>
                        <div style={{fontWeight:'bold', color:'#1F2937'}}>{u.displayName}</div>
                        <div style={{fontSize:'0.8rem', color:'#6B7280'}}>{u.email}</div>
                    </td>

                    {/* 2. ROL Y ESTADO */}
                    <td style={{padding:'15px'}}>
                        {u.isAdmin && <span style={{background:'#FEF3C7', color:'#D97706', padding:'4px 8px', borderRadius:'6px', fontSize:'0.7rem', fontWeight:'bold', marginRight:'5px'}}>ADMIN</span>}
                        
                        {u.rol === 'psicologo' && (
                            <span style={{background: u.isAuthorized ? '#D1FAE5' : '#FEE2E2', color: u.isAuthorized ? '#065F46' : '#991B1B', padding:'4px 8px', borderRadius:'6px', fontSize:'0.7rem', fontWeight:'bold'}}>
                                {u.isAuthorized ? "TERAPEUTA ACTIVO" : "TERAPEUTA PENDIENTE"}
                            </span>
                        )}
                        
                        {u.rol === 'paciente' && <span style={{background:'#E0E7FF', color:'#4338CA', padding:'4px 8px', borderRadius:'6px', fontSize:'0.7rem', fontWeight:'bold'}}>PACIENTE</span>}
                        
                        {(!u.rol) && <span style={{background:'#F3F4F6', color:'#6B7280', padding:'4px 8px', borderRadius:'6px', fontSize:'0.7rem', fontWeight:'bold'}}>SIN ROL</span>}
                    </td>

                    {/* 3. ASIGNACIÓN (NUEVA COLUMNA) */}
                    <td style={{padding:'15px'}}>
                        {u.rol === 'paciente' ? (
                            u.psicologoId ? (
                                <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                                    <span style={{fontSize:'1rem'}}>👨‍⚕️</span>
                                    <span style={{color:'#374151', fontWeight:'500'}}>
                                        {mapaPsicologos[u.psicologoId] || "ID Desconocido"}
                                    </span>
                                </div>
                            ) : (
                                <span style={{color:'#9CA3AF', fontStyle:'italic'}}>Sin asignar</span>
                            )
                        ) : (
                            <span style={{color:'#E5E7EB'}}>—</span>
                        )}
                    </td>

                    {/* 4. ACCIONES */}
                    <td style={{textAlign:'center', padding:'15px'}}>
                        {!u.rol && !u.isAdmin && (
                            <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
                                <button onClick={() => asignarRol(u.id, 'psico')} style={{border: '1px solid #E5E7EB', background:'white', padding: '6px 10px', borderRadius: '8px', cursor:'pointer', fontSize:'0.8rem', color:'#4F46E5'}}>
                                    Hacer Psico
                                </button>
                                <button onClick={() => asignarRol(u.id, 'paciente')} style={{border: '1px solid #E5E7EB', background:'white', padding: '6px 10px', borderRadius: '8px', cursor:'pointer', fontSize:'0.8rem', color:'#10B981'}}>
                                    Hacer Paciente
                                </button>
                            </div>
                        )}

                        {u.rol === 'psicologo' && !u.isAdmin && (
                            <button 
                                onClick={() => toggleAutorizacion(u.id, u.isAuthorized)}
                                style={{
                                    border: '1px solid #E5E7EB', background:'white', padding:'6px 12px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', fontSize:'0.8rem',
                                    color: u.isAuthorized ? '#EF4444' : '#10B981'
                                }}
                            >
                                {u.isAuthorized ? "Revocar" : "Aprobar"}
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