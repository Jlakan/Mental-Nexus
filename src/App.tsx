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
      <p>Plataforma de Terapia y Hábitos.</p>
      <button className="btn-google" onClick={handleGoogleLogin}>
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
    <div className="container">
      <h2>⏳ Solicitud Recibida</h2>
      <p>Tu cuenta ha sido creada.</p>
      <div style={{padding: '20px', background: '#e2e3e5', borderRadius: '8px', margin: '20px 0'}}>
        <p>Esperando asignación de rol por parte del Administrador.</p>
      </div>
      <button onClick={() => signOut(auth)} className="btn-link">Cerrar Sesión</button>
    </div>
  );
}

// ==========================================
// 3. PANTALLA DE VINCULACIÓN
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
    <div className="container">
      <h2>🔑 Vincular con Especialista</h2>
      <p>Ingresa el código que te dio tu terapeuta:</p>
      <input 
        type="text" placeholder="Ej: PSI-1234" 
        value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())}
        className="input-code"
      />
      {error && <p style={{color: 'red'}}>{error}</p>}
      <button onClick={validarCodigo} className="btn-primary">Entrar</button>
      <button onClick={() => signOut(auth)} className="btn-link">Salir</button>
    </div>
  );
}

// ==========================================
// 4. PANEL DEL PACIENTE
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
      <h3>🌱 Mis Hábitos</h3>
      {misHabitos.length === 0 && <p style={{color: '#666'}}>Sin hábitos asignados.</p>}

      <div style={{display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'}}>
        {misHabitos.map(habito => {
          const porcentaje = calcularProgreso(habito.registro);
          const logrado = porcentaje >= habito.metaSemanal;
          return (
            <div key={habito.id} style={{background: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #eee', boxShadow: '0 2px 5px rgba(0,0,0,0.05)'}}>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <h4 style={{margin: '0 0 10px 0'}}>{habito.titulo}</h4>
                <span style={{color: logrado ? '#28a745' : '#666', fontWeight: 'bold', fontSize: '14px'}}>{porcentaje}%</span>
              </div>
              <div style={{width: '100%', background: '#eee', height: '8px', borderRadius: '4px', marginBottom: '15px'}}>
                <div style={{width: `${porcentaje}%`, background: logrado ? '#28a745' : '#007bff', height: '100%', borderRadius: '4px', transition: 'width 0.3s ease'}}></div>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                {diasSemana.map(dia => (
                  <button key={dia} onClick={() => toggleDia(habito.id, dia, habito.registro[dia])}
                    style={{
                      width: '35px', height: '35px', borderRadius: '50%', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                      background: habito.registro[dia] ? '#4CAF50' : '#f0f0f0', color: habito.registro[dia] ? 'white' : '#333'
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
// 5. PANEL DE PSICÓLOGO
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
    if(confirm("¿Borrar?")) await deleteDoc(doc(db, "habitos", id));
  };

  const calcularProgreso = (reg: any) => Math.round((Object.values(reg).filter(v => v === true).length / 7) * 100);

  return (
    <div style={{textAlign: 'left'}}>
      <div style={{background: '#e3f2fd', padding: '20px', borderRadius: '12px', marginBottom: '20px'}}>
        <h3 style={{marginTop: 0, color: '#0d47a1'}}>👨‍⚕️ Mi Consultorio</h3>
        {miCodigo ? <p>Código para pacientes: <strong>{miCodigo}</strong></p> : <button onClick={generarCodigo} className="btn-primary">Generar Código</button>}
      </div>

      <div style={{display: 'flex', gap: '25px', flexWrap: 'wrap'}}>
        <div style={{flex: 1, minWidth: '280px'}}>
          <h4>Mis Pacientes ({pacientes.length})</h4>
          <ul style={{listStyle: 'none', padding: 0}}>
            {pacientes.map(p => (
              <li key={p.id} style={{marginBottom: '10px'}}>
                <button onClick={() => setPacienteSeleccionado(p)} style={{
                    width: '100%', padding: '15px', background: pacienteSeleccionado?.id === p.id ? '#007bff' : 'white',
                    color: pacienteSeleccionado?.id === p.id ? 'white' : '#333', border: '1px solid #e0e0e0', borderRadius: '10px', 
                    cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between'
                  }}>
                  <span>{p.displayName}</span><span>👤</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div style={{flex: 2, minWidth: '320px'}}>
          {pacienteSeleccionado ? (
            <div>
              <div style={{background: '#f8f9fa', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e9ecef'}}>
                <h4>Nuevo hábito para: {pacienteSeleccionado.displayName}</h4>
                <input type="text" value={tituloHabito} onChange={(e) => setTituloHabito(e.target.value)} placeholder="Hábito (Ej: Leer)" style={{width: '100%', padding: '10px', marginBottom:'10px'}} />
                <div style={{display: 'flex', gap: '10px'}}>
                  <input type="number" value={metaSemanal} onChange={(e) => setMetaSemanal(Number(e.target.value))} style={{width: '80px', padding: '10px'}} />
                  <button onClick={crearHabito} className="btn-primary" style={{flex: 1}}>Agregar ➕</button>
                </div>
              </div>
              <div style={{display: 'grid', gap: '10px'}}>
                {habitosPaciente.map(h => {
                   const p = calcularProgreso(h.registro);
                   return (
                    <div key={h.id} style={{border: '1px solid #eee', background: 'white', padding: '10px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between'}}>
                      <div style={{flex: 1}}>
                        <strong>{h.titulo}</strong>
                        <div style={{width: '100%', background: '#eee', height: '6px', marginTop: '5px', maxWidth: '200px'}}><div style={{width: `${p}%`, background: p >= h.metaSemanal ? '#28a745' : '#007bff', height: '100%'}}></div></div>
                      </div>
                      <button onClick={() => eliminarHabito(h.id)} style={{cursor: 'pointer'}}>🗑️</button>
                    </div>
                   )
                })}
              </div>
            </div>
          ) : <div style={{padding: '50px', textAlign: 'center', color: '#999', border: '2px dashed #ccc'}}>Selecciona un paciente</div>}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. PANEL DE ADMINISTRADOR
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
    <div className="container" style={{maxWidth: '1000px'}}>
      <h2>🛠️ Administración de Usuarios</h2>
      <div style={{overflowX: 'auto'}}>
        <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '20px'}}>
            <thead>
            <tr style={{background: '#343a40', color: 'white', textAlign: 'left'}}>
                <th style={{padding: '10px'}}>Usuario</th>
                <th style={{padding: '10px'}}>Rol Actual</th>
                <th style={{padding: '10px'}}>Asignar Rol</th>
            </tr>
            </thead>
            <tbody>
            {usuarios.map(u => (
                <tr key={u.id} style={{borderBottom: '1px solid #eee'}}>
                <td style={{padding: '10px'}}>{u.displayName}<br/><small>{u.email}</small></td>
                <td style={{padding: '10px'}}>
                    {u.isAdmin && <span style={{background:'gold', padding:'2px 5px', borderRadius:'4px', fontSize:'12px', marginRight:'5px', color:'black'}}>ADMIN</span>}
                    {u.isPsicologo && <span style={{color:'blue', marginRight:'5px'}}>Psicólogo</span>}
                    {u.isPaciente && <span style={{color:'green', marginRight:'5px'}}>Paciente</span>}
                    {!u.isPsicologo && !u.isPaciente && !u.isAdmin && <span style={{color:'red'}}>Sin Rol</span>}
                </td>
                <td style={{padding: '10px'}}>
                    {!u.isAdmin && (
                    <div style={{display: 'flex', gap: '5px'}}>
                        <button onClick={() => asignarRol(u.id, 'psico')} style={{cursor:'pointer', padding: '5px'}}>👨‍⚕️ Psico</button>
                        <button onClick={() => asignarRol(u.id, 'paciente')} style={{cursor:'pointer', padding: '5px'}}>👤 Paciente</button>
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

  if (loading) return <div className="loading">Cargando sistema...</div>;
  if (!user) return <LoginScreen />;
  if (!userData) return <div className="loading">Cargando perfil...</div>;

  const Header = () => (
    <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 20px'}}>
      <div>
        <h2 style={{margin: 0}}>Hola, {userData.displayName} 👋</h2>
        <small>
            {userData.isAdmin && "Admin "}{userData.isPsicologo && "Psicólogo "}{userData.isPaciente && "Paciente"}
        </small>
      </div>
      <button onClick={() => signOut(auth)} className="btn-small">Salir</button>
    </header>
  );

  if (userData.isAdmin && userData.isPsicologo) {
    return (
      <div className="container" style={{maxWidth: '1100px'}}>
        <Header />
        <div style={{display: 'flex', borderBottom: '2px solid #eee', marginBottom: '20px'}}>
          <button 
            onClick={() => setActiveTab('consultorio')}
            style={{
              padding: '10px 20px', cursor: 'pointer', background: 'none', border: 'none', fontSize: '16px',
              borderBottom: activeTab === 'consultorio' ? '3px solid #007bff' : 'none',
              color: activeTab === 'consultorio' ? '#007bff' : '#666', fontWeight: 'bold'
            }}
          >
            👨‍⚕️ Mi Consultorio
          </button>
          <button 
            onClick={() => setActiveTab('admin')}
            style={{
              padding: '10px 20px', cursor: 'pointer', background: 'none', border: 'none', fontSize: '16px',
              borderBottom: activeTab === 'admin' ? '3px solid #343a40' : 'none',
              color: activeTab === 'admin' ? '#343a40' : '#666', fontWeight: 'bold'
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