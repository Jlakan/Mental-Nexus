import { useState, useEffect } from 'react';
import { auth, googleProvider, db } from './firebaseConfig';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  doc, setDoc, updateDoc, addDoc, deleteDoc, 
  collection, query, where, getDocs, onSnapshot 
} from 'firebase/firestore';
import './style.css';

// ==========================================
// 1. PANTALLA DE LOGIN
// ==========================================
function LoginScreen() {
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  return (
    <div className="container login-container">
      <h1>Mental Nexus 🧠</h1>
      <p style={{fontSize: '1.1rem', marginBottom: '2rem'}}>Tu espacio seguro de crecimiento y terapia.</p>
      <button className="btn-google" onClick={handleGoogleLogin}>
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" width="20" />
        Ingresar con Google
      </button>
    </div>
  );
}

// ==========================================
// 2. SALA DE ESPERA
// ==========================================
function PantallaEspera() {
  return (
    <div className="container" style={{textAlign: 'center'}}>
      <h2 style={{color: '#F59E0B'}}>⏳ Solicitud en Proceso</h2>
      <p>Tu cuenta ha sido creada exitosamente.</p>
      <div style={{padding: '20px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', margin: '30px 0', color: '#B45309'}}>
        <p style={{margin: 0, fontWeight: 600}}>Estamos verificando tus datos para asignarte el rol correcto.</p>
      </div>
      <button onClick={() => signOut(auth)} className="btn-link">Cerrar Sesión</button>
    </div>
  );
}

// ==========================================
// 3. VINCULACIÓN
// ==========================================
function VinculacionScreen({ userUid }: any) {
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");

  const validarCodigo = async () => {
    if (!codigo) return;
    try {
      const q = query(collection(db, "users"), where("codigoVinculacion", "==", codigo));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("Código no válido.");
        return;
      }
      const psicologoDoc = querySnapshot.docs[0];
      
      await updateDoc(doc(db, "users", userUid), {
        psicologoId: psicologoDoc.id,
        estatus: "activo",
        asignadoEl: new Date()
      });
      window.location.reload(); 
    } catch (err) {
      console.error(err);
      setError("Error de conexión.");
    }
  };

  return (
    <div className="container" style={{textAlign: 'center'}}>
      <h2>🔑 Acceso a Terapia</h2>
      <p>Para proteger tu privacidad, ingresa el código único proporcionado por tu especialista.</p>
      
      <div style={{margin: '30px 0'}}>
        <input 
          type="text" placeholder="EJ: PSI-0000" 
          value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          className="input-code"
        />
      </div>

      {error && <p style={{color: '#EF4444', fontWeight: 'bold'}}>{error}</p>}
      <button onClick={validarCodigo} className="btn-primary">Vincular Cuenta</button>
      <button onClick={() => signOut(auth)} className="btn-link" style={{marginTop: '20px'}}>Cancelar</button>
    </div>
  );
}

// ==========================================
// 4. PANEL PACIENTE
// ==========================================
function PanelPaciente({ userUid }: any) {
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
      {misHabitos.length === 0 && <p style={{color: '#666'}}>No tienes hábitos asignados por el momento.</p>}

      <div style={{display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginTop: '20px'}}>
        {misHabitos.map(habito => {
          const porcentaje = calcularProgreso(habito.registro);
          const logrado = porcentaje >= habito.metaSemanal;
          return (
            <div key={habito.id} style={{background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.05)'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                <h4 style={{margin: 0, fontSize: '1.1rem'}}>{habito.titulo}</h4>
                <span style={{
                    background: logrado ? '#D1FAE5' : '#E0E7FF', 
                    color: logrado ? '#065F46' : '#3730A3',
                    padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold'
                }}>
                  {porcentaje}%
                </span>
              </div>

              <div style={{width: '100%', background: '#F3F4F6', height: '10px', borderRadius: '5px', marginBottom: '20px', overflow: 'hidden'}}>
                <div style={{width: `${porcentaje}%`, background: logrado ? '#10B981' : '#4F46E5', height: '100%', borderRadius: '5px', transition: 'width 0.5s ease'}}></div>
              </div>

              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                {diasSemana.map(dia => (
                  <button key={dia} onClick={() => toggleDia(habito.id, dia, habito.registro[dia])}
                    style={{
                      width: '36px', height: '36px', borderRadius: '50%', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem',
                      background: habito.registro[dia] ? '#10B981' : '#F3F4F6', 
                      color: habito.registro[dia] ? 'white' : '#9CA3AF',
                      boxShadow: habito.registro[dia] ? '0 2px 4px rgba(16, 185, 129, 0.3)' : 'none'
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

// ==========================================
// 5. PANEL PSICÓLOGO
// ==========================================
function PanelPsicologo({ userData, userUid }: any) {
  const [pacientes, setPacientes] = useState<any[]>([]); 
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);
  const [habitosPaciente, setHabitosPaciente] = useState<any[]>([]);
  const [tituloHabito, setTituloHabito] = useState("");
  const [metaSemanal, setMetaSemanal] = useState(80);
  const [miCodigo, setMiCodigo] = useState(userData.codigoVinculacion || "");

  useEffect(() => {
    const q = query(collection(db, "users"), where("psicologoId", "==", userUid));
    const unsubscribe = onSnapshot(q, (snap) => setPacientes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsubscribe();
  }, [userUid]);

  useEffect(() => {
    if (!pacienteSeleccionado) { setHabitosPaciente([]); return; }
    const q = query(collection(db, "habitos"), where("pacienteId", "==", pacienteSeleccionado.id));
    const unsubscribe = onSnapshot(q, (snap) => setHabitosPaciente(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsubscribe();
  }, [pacienteSeleccionado]);

  const generarCodigo = async () => {
    const nuevo = "PSI-" + Math.floor(1000 + Math.random() * 9000);
    await updateDoc(doc(db, "users", userUid), { codigoVinculacion: nuevo });
    setMiCodigo(nuevo);
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
    if(confirm("¿Borrar este hábito?")) await deleteDoc(doc(db, "habitos", id));
  };

  const calcularProgreso = (reg: any) => Math.round((Object.values(reg).filter(v => v === true).length / 7) * 100);

  return (
    <div style={{textAlign: 'left'}}>
      {/* Encabezado Consultorio */}
      <div style={{background: 'white', padding: '25px', borderRadius: '16px', marginBottom: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px'}}>
        <div>
          <h3 style={{margin: 0, color: '#4F46E5'}}>👨‍⚕️ Mi Consultorio</h3>
          <p style={{margin: '5px 0 0 0', fontSize: '0.9rem'}}>Gestiona el progreso de tus pacientes</p>
        </div>
        {miCodigo ? (
          <div style={{background: '#EEF2FF', padding: '10px 20px', borderRadius: '12px', border: '1px dashed #4F46E5'}}>
            <span style={{color: '#4F46E5', fontWeight: 'bold', letterSpacing: '1px'}}>{miCodigo}</span>
            <small style={{display:'block', color:'#6366F1', fontSize:'0.7rem', textTransform:'uppercase'}}>Código para Pacientes</small>
          </div>
        ) : (
          <button onClick={generarCodigo} className="btn-primary" style={{width: 'auto'}}>Generar Código</button>
        )}
      </div>

      <div style={{display: 'flex', gap: '30px', flexWrap: 'wrap'}}>
        
        {/* Columna Izquierda: Lista Pacientes */}
        <div style={{flex: 1, minWidth: '280px'}}>
          <h4 style={{color: '#6B7280', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px'}}>Pacientes ({pacientes.length})</h4>
          <div style={{display: 'grid', gap: '10px'}}>
            {pacientes.map(p => (
              <button onClick={() => setPacienteSeleccionado(p)} key={p.id} style={{
                  width: '100%', padding: '15px', 
                  background: pacienteSeleccionado?.id === p.id ? '#4F46E5' : 'white',
                  color: pacienteSeleccionado?.id === p.id ? 'white' : '#374151', 
                  border: 'none', borderRadius: '12px', 
                  cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: 'all 0.2s'
                }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <div style={{width: '30px', height: '30px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>👤</div>
                  <span>{p.displayName}</span>
                </div>
                {pacienteSeleccionado?.id === p.id && <span>👉</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Columna Derecha: Detalles */}
        <div style={{flex: 2, minWidth: '320px'}}>
          {pacienteSeleccionado ? (
            <div style={{animation: 'fadeIn 0.5s ease'}}>
              {/* Formulario de Creación */}
              <div style={{background: 'white', padding: '25px', borderRadius: '16px', marginBottom: '25px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)'}}>
                <h4 style={{marginTop: 0, color: '#111827'}}>Nuevo Hábito</h4>
                <div style={{marginBottom: '15px'}}>
                    <input type="text" value={tituloHabito} onChange={(e) => setTituloHabito(e.target.value)} placeholder="Nombre del hábito (Ej: Meditar 15 min)" />
                </div>
                <div style={{display: 'flex', gap: '15px'}}>
                  <div style={{flex: 1}}>
                    <input type="number" value={metaSemanal} onChange={(e) => setMetaSemanal(Number(e.target.value))} placeholder="Meta %" />
                  </div>
                  <div style={{flex: 2}}>
                    <button onClick={crearHabito} className="btn-primary">Agregar Hábito</button>
                  </div>
                </div>
              </div>

              {/* Lista de Progreso */}
              <h4 style={{color: '#6B7280', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px'}}>Progreso Actual</h4>
              <div style={{display: 'grid', gap: '15px'}}>
                {habitosPaciente.map(h => {
                   const p = calcularProgreso(h.registro);
                   return (
                    <div key={h.id} style={{background: 'white', padding: '15px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'}}>
                      <div style={{flex: 1}}>
                        <strong style={{color: '#374151', fontSize: '1rem'}}>{h.titulo}</strong>
                        <div style={{width: '100%', background: '#F3F4F6', height: '6px', marginTop: '8px', maxWidth: '300px', borderRadius: '3px', overflow: 'hidden'}}>
                            <div style={{width: `${p}%`, background: p >= h.metaSemanal ? '#10B981' : '#4F46E5', height: '100%', borderRadius: '3px', transition: 'width 0.5s'}}></div>
                        </div>
                        <small style={{color: '#9CA3AF', marginTop: '4px', display: 'block'}}>Meta: {h.metaSemanal}% | Actual: {p}%</small>
                      </div>
                      <button onClick={() => eliminarHabito(h.id)} style={{background: '#FEF2F2', border: 'none', color: '#EF4444', width: '35px', height: '35px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        🗑️
                      </button>
                    </div>
                   )
                })}
              </div>
            </div>
          ) : (
            <div style={{padding: '60px', textAlign: 'center', color: '#9CA3AF', border: '2px dashed #E5E7EB', borderRadius: '16px', background: 'rgba(255,255,255,0.5)'}}>
              <p style={{fontSize: '2rem', margin: 0}}>👈</p>
              <p>Selecciona un paciente para ver sus detalles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. PANEL ADMIN
// ==========================================
function PanelAdmin() {
  const [usuarios, setUsuarios] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snap) => setUsuarios(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsubscribe();
  }, []);

  const asignarRol = async (uid: string, tipo: 'psico' | 'paciente') => {
    if(!confirm(`¿Confirmar rol de ${tipo}?`)) return;
    const updates: any = { estatus: 'activo', isPsicologo: false, isPaciente: false };
    
    if (tipo === 'psico') {
        updates.isPsicologo = true;
        updates.codigoVinculacion = "PSI-" + Math.floor(1000 + Math.random() * 9000);
    } else {
        updates.isPaciente = true;
        updates.estatus = 'pendiente';
    }
    await updateDoc(doc(db, "users", uid), updates);
  };

  return (
    <div className="container" style={{maxWidth: '1100px'}}>
      <h2>🛠️ Administración</h2>
      <div style={{overflowX: 'auto', marginTop: '20px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)'}}>
        <table style={{width: '100%'}}>
            <thead>
            <tr style={{background: '#F9FAFB', color: '#6B7280', textAlign: 'left'}}>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Acciones</th>
            </tr>
            </thead>
            <tbody>
            {usuarios.map(u => (
                <tr key={u.id}>
                <td>
                    <div style={{fontWeight: 600, color: '#111827'}}>{u.displayName}</div>
                    <div style={{fontSize: '0.85rem', color: '#9CA3AF'}}>{u.email}</div>
                </td>
                <td>
                    {u.isAdmin && <span style={{background:'#FEF3C7', color:'#D97706', padding:'4px 8px', borderRadius:'6px', fontSize:'0.75rem', fontWeight:'bold', marginRight:'5px'}}>ADMIN</span>}
                    {u.isPsicologo && <span style={{background:'#E0E7FF', color:'#4338CA', padding:'4px 8px', borderRadius:'6px', fontSize:'0.75rem', fontWeight:'bold'}}>PSICÓLOGO</span>}
                    {u.isPaciente && <span style={{background:'#D1FAE5', color:'#065F46', padding:'4px 8px', borderRadius:'6px', fontSize:'0.75rem', fontWeight:'bold'}}>PACIENTE</span>}
                    {!u.isPsicologo && !u.isPaciente && !u.isAdmin && <span style={{background:'#F3F4F6', color:'#6B7280', padding:'4px 8px', borderRadius:'6px', fontSize:'0.75rem'}}>NUEVO</span>}
                </td>
                <td>
                    {!u.isAdmin && (
                    <div style={{display: 'flex', gap: '8px'}}>
                        <button onClick={() => asignarRol(u.id, 'psico')} style={{border: '1px solid #E5E7EB', background:'white', padding: '6px 10px', borderRadius: '8px', cursor:'pointer', fontSize:'0.8rem'}}>👨‍⚕️ Psico</button>
                        <button onClick={() => asignarRol(u.id, 'paciente')} style={{border: '1px solid #E5E7EB', background:'white', padding: '6px 10px', borderRadius: '8px', cursor:'pointer', fontSize:'0.8rem'}}>👤 Paciente</button>
                    </div>
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

// ==========================================
// 7. APP PRINCIPAL
// ==========================================
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'admin' | 'consultorio'>('consultorio');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        const docRef = doc(db, "users", currentUser.uid);
        const unsubUser = onSnapshot(docRef, async (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            const nuevo = {
              uid: currentUser.uid, email: currentUser.email, displayName: currentUser.displayName, photoURL: currentUser.photoURL,
              isAdmin: false, isPsicologo: false, isPaciente: false, estatus: "nuevo_ingreso", createdAt: new Date()
            };
            await setDoc(docRef, nuevo);
            setUserData(nuevo);
          }
          setLoading(false);
        });
        return () => unsubUser();
      } else {
        setUser(null); setUserData(null); setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="loading">Mental Nexus...</div>;
  if (!user) return <LoginScreen />;
  if (!userData) return <div className="loading">Cargando Perfil...</div>;

  const Header = () => (
    <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', padding: '0 10px'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
        <div style={{width: '40px', height: '40px', background: '#4F46E5', borderRadius: '10px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem'}}>
            {userData.displayName.charAt(0)}
        </div>
        <div>
            <h2 style={{margin: 0, fontSize: '1.2rem'}}>{userData.displayName}</h2>
            <div style={{fontSize: '0.8rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                {userData.isAdmin && "Administrador • "}{userData.isPsicologo && "Psicólogo"}{userData.isPaciente && "Paciente"}
            </div>
        </div>
      </div>
      <button onClick={() => signOut(auth)} className="btn-small" style={{color: '#EF4444', fontWeight: 'bold'}}>Cerrar Sesión</button>
    </header>
  );

  // ADMIN + PSICÓLOGO
  if (userData.isAdmin && userData.isPsicologo) {
    return (
      <div className="container" style={{maxWidth: '1200px', padding: '2rem'}}>
        <Header />
        <div style={{display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '1px solid #E5E7EB', paddingBottom: '1px'}}>
          <button 
            onClick={() => setActiveTab('consultorio')}
            style={{
              padding: '10px 20px', cursor: 'pointer', background: 'none', border: 'none', fontSize: '1rem',
              borderBottom: activeTab === 'consultorio' ? '3px solid #4F46E5' : '3px solid transparent',
              color: activeTab === 'consultorio' ? '#4F46E5' : '#9CA3AF', fontWeight: 600, transition: 'all 0.2s'
            }}
          >
            👨‍⚕️ Consultorio
          </button>
          <button 
            onClick={() => setActiveTab('admin')}
            style={{
              padding: '10px 20px', cursor: 'pointer', background: 'none', border: 'none', fontSize: '1rem',
              borderBottom: activeTab === 'admin' ? '3px solid #1F2937' : '3px solid transparent',
              color: activeTab === 'admin' ? '#1F2937' : '#9CA3AF', fontWeight: 600, transition: 'all 0.2s'
            }}
          >
            🛠️ Administración
          </button>
        </div>
        {activeTab === 'consultorio' ? <PanelPsicologo userData={userData} userUid={user.uid} /> : <PanelAdmin />}
      </div>
    );
  }

  if (userData.isAdmin) return <div className="container"><Header /><PanelAdmin /></div>;
  if (userData.isPsicologo) return <div className="container"><Header /><PanelPsicologo userData={userData} userUid={user.uid} /></div>;
  if (userData.isPaciente) {
    if (userData.estatus === 'pendiente' || !userData.psicologoId) return <div className="container"><Header /><VinculacionScreen userUid={user.uid} /></div>;
    return <div className="container"><Header /><PanelPaciente userUid={user.uid} /></div>;
  }

  return <PantallaEspera />;
}