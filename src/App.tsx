import { useState, useEffect } from 'react';
import { auth, googleProvider, db } from './firebaseConfig';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  doc, setDoc, updateDoc, addDoc, deleteDoc, 
  collection, query, where, getDocs, onSnapshot, getDoc
} from 'firebase/firestore';
import './style.css';

// ==========================================
// 1. LOGIN Y REGISTRO
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

function RegistroScreen({ user, onRegistroCompletado }: any) {
  const [modo, setModo] = useState<'seleccion' | 'paciente' | 'terapeuta'>('seleccion');
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");

  const registrarTerapeuta = async () => {
    try {
      // Crea el documento en la raíz users
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        rol: 'psicologo',
        isAuthorized: false, // Requiere aprobación del Admin
        codigoVinculacion: "PSI-" + Math.floor(1000 + Math.random() * 9000),
        createdAt: new Date()
      });
      window.location.reload();
    } catch (err) {
      console.error(err);
      setError("Error al registrar.");
    }
  };

  const registrarPaciente = async () => {
    if (!codigo) return setError("Ingresa el código de tu terapeuta.");
    
    try {
      // 1. Buscar al psicólogo por código
      const q = query(collection(db, "users"), where("codigoVinculacion", "==", codigo));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return setError("Código no válido.");
      }
      const psicologoDoc = querySnapshot.docs[0];
      const psicologoId = psicologoDoc.id;

      // 2. Crear "Puntero" en raíz (para que el login sepa dónde buscar)
      // Esto es necesario porque Firebase Auth solo da el UID.
      await setDoc(doc(db, "users", user.uid), {
        rol: 'paciente',
        psicologoId: psicologoId, // Referencia al padre
        email: user.email
      });

      // 3. Crear Perfil REAL dentro de la colección del Psicólogo
      // Ruta: users/{psicologoId}/pacientes/{pacienteId}
      await setDoc(doc(db, "users", psicologoId, "pacientes", user.uid), {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        rol: 'paciente',
        isAuthorized: false, // Requiere aprobación del Psicólogo
        createdAt: new Date()
      });

      window.location.reload();
    } catch (err) {
      console.error(err);
      setError("Error al registrar o código inválido.");
    }
  };

  if (modo === 'seleccion') {
    return (
      <div className="container" style={{textAlign: 'center'}}>
        <h2>Bienvenido, {user.displayName}</h2>
        <p>Para continuar, selecciona tu perfil:</p>
        <div style={{display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '30px'}}>
          <button className="btn-primary" onClick={() => setModo('paciente')} style={{background: '#10B981'}}>
            Soy Paciente 👤
          </button>
          <button className="btn-primary" onClick={() => setModo('terapeuta')}>
            Soy Terapeuta 👨‍⚕️
          </button>
        </div>
        <button onClick={() => signOut(auth)} className="btn-link" style={{marginTop: '20px'}}>Cancelar</button>
      </div>
    );
  }

  if (modo === 'terapeuta') {
    return (
      <div className="container">
        <h2>Registro de Terapeuta</h2>
        <p>Se creará tu cuenta y quedarás en espera de validación por un Administrador.</p>
        {error && <p style={{color: 'red'}}>{error}</p>}
        <button onClick={registrarTerapeuta} className="btn-primary">Confirmar Registro</button>
        <button onClick={() => setModo('seleccion')} className="btn-link">Volver</button>
      </div>
    );
  }

  return ( // Modo Paciente
    <div className="container">
      <h2>Registro de Paciente</h2>
      <p>Ingresa el código proporcionado por tu Psicólogo:</p>
      <input 
        type="text" placeholder="EJ: PSI-1234" 
        className="input-code"
        value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())}
      />
      {error && <p style={{color: 'red'}}>{error}</p>}
      <button onClick={registrarPaciente} className="btn-primary">Registrarme</button>
      <button onClick={() => setModo('seleccion')} className="btn-link">Volver</button>
    </div>
  );
}

// ==========================================
// 2. PANTALLA DE ESPERA (NO AUTORIZADO)
// ==========================================
function PantallaEspera({ mensaje }: { mensaje?: string }) {
  return (
    <div className="container" style={{textAlign: 'center'}}>
      <h2 style={{color: '#F59E0B'}}>⏳ Cuenta en Revisión</h2>
      <div style={{padding: '20px', background: '#FFFBEB', borderRadius: '12px', margin: '20px 0', color: '#B45309'}}>
        <p style={{margin: 0, fontWeight: 'bold'}}>
          {mensaje || "Tu cuenta está pendiente de autorización."}
        </p>
      </div>
      <button onClick={() => signOut(auth)} className="btn-link">Cerrar Sesión</button>
    </div>
  );
}

// ==========================================
// 3. PANEL PACIENTE (Lee de la subcolección)
// ==========================================
function PanelPaciente({ userUid, psicologoId }: any) {
  const [misHabitos, setMisHabitos] = useState<any[]>([]);

  // Escuchar hábitos. Nota: Los hábitos ahora vivirán dentro de la subcolección del paciente o referenciados
  // Para simplificar la consulta, seguiremos guardando hábitos en una colección 'habitos' global pero filtrada,
  // O podemos guardarlos dentro del paciente. Por ahora, global filtrada es más fácil de consultar.
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
      {misHabitos.length === 0 && <p style={{color: '#666'}}>No tienes hábitos asignados.</p>}

      <div style={{display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginTop: '20px'}}>
        {misHabitos.map(habito => {
          const porcentaje = calcularProgreso(habito.registro);
          const logrado = porcentaje >= habito.metaSemanal;
          return (
            <div key={habito.id} style={{background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.05)'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                <h4 style={{margin: 0}}>{habito.titulo}</h4>
                <span style={{
                    background: logrado ? '#D1FAE5' : '#E0E7FF', 
                    color: logrado ? '#065F46' : '#3730A3',
                    padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold'
                }}>{porcentaje}%</span>
              </div>
              <div style={{width: '100%', background: '#F3F4F6', height: '10px', borderRadius: '5px', marginBottom: '20px'}}>
                <div style={{width: `${porcentaje}%`, background: logrado ? '#10B981' : '#4F46E5', height: '100%', borderRadius: '5px', transition: 'width 0.5s'}}></div>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                {diasSemana.map(dia => (
                  <button key={dia} onClick={() => toggleDia(habito.id, dia, habito.registro[dia])}
                    style={{
                      width: '36px', height: '36px', borderRadius: '50%', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                      background: habito.registro[dia] ? '#10B981' : '#F3F4F6', 
                      color: habito.registro[dia] ? 'white' : '#9CA3AF'
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
// 4. PANEL PSICÓLOGO (Gestiona SU subcolección)
// ==========================================
function PanelPsicologo({ userData, userUid }: any) {
  const [pacientes, setPacientes] = useState<any[]>([]); 
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);
  const [habitosPaciente, setHabitosPaciente] = useState<any[]>([]);
  const [tituloHabito, setTituloHabito] = useState("");
  const [metaSemanal, setMetaSemanal] = useState(80);

  // 1. Cargar pacientes desde MI SUBCOLECCIÓN
  useEffect(() => {
    // users/{miId}/pacientes
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
      <div style={{background: 'white', padding: '20px', borderRadius: '16px', marginBottom: '30px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
            <h3 style={{margin:0, color: '#4F46E5'}}>👨‍⚕️ Mi Consultorio</h3>
            <p style={{margin:0, fontSize:'0.9rem', color:'#6B7280'}}>Código: <strong>{userData.codigoVinculacion}</strong></p>
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
                            padding: '5px 10px', borderRadius: '6px', fontSize: '0.7rem', border:'none', cursor:'pointer',
                            background: p.isAuthorized ? '#D1FAE5' : '#FEE2E2',
                            color: p.isAuthorized ? '#065F46' : '#991B1B'
                        }}
                    >
                        {p.isAuthorized ? "Activo" : "Autorizar"}
                    </button>
                </div>
                {!p.isAuthorized && <small style={{color: '#EF4444', display:'block', marginTop:'5px'}}>⚠️ Debe autorizar para asignar hábitos</small>}
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

// ==========================================
// 5. PANEL ADMIN (Aprueba Terapeutas)
// ==========================================
function PanelAdmin() {
  const [terapeutas, setTerapeutas] = useState<any[]>([]);

  useEffect(() => {
    // Solo mostramos los que quieren ser psicólogos
    const q = query(collection(db, "users"), where("rol", "==", "psicologo"));
    const unsubscribe = onSnapshot(q, (snap) => setTerapeutas(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsubscribe();
  }, []);

  const toggleAutorizacion = async (uid: string, estadoActual: boolean) => {
    await updateDoc(doc(db, "users", uid), { isAuthorized: !estadoActual });
  };

  return (
    <div className="container" style={{maxWidth: '1000px'}}>
      <h2>🛠️ Administración de Terapeutas</h2>
      <p>Aprueba el acceso a los profesionales.</p>
      <div style={{background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginTop: '20px'}}>
        <table style={{width: '100%'}}>
            <thead style={{background: '#F9FAFB'}}>
                <tr><th style={{textAlign:'left', padding:'15px'}}>Nombre</th><th>Estado</th><th>Acción</th></tr>
            </thead>
            <tbody>
            {terapeutas.map(t => (
                <tr key={t.id} style={{borderBottom: '1px solid #F3F4F6'}}>
                    <td style={{padding:'15px'}}>
                        <div style={{fontWeight:'bold'}}>{t.displayName}</div>
                        <div style={{fontSize:'0.8rem', color:'#6B7280'}}>{t.email}</div>
                    </td>
                    <td style={{textAlign:'center'}}>
                        {t.isAuthorized 
                            ? <span style={{background:'#D1FAE5', color:'#065F46', padding:'4px 8px', borderRadius:'6px', fontSize:'0.7rem', fontWeight:'bold'}}>AUTORIZADO</span>
                            : <span style={{background:'#FEF3C7', color:'#B45309', padding:'4px 8px', borderRadius:'6px', fontSize:'0.7rem', fontWeight:'bold'}}>PENDIENTE</span>
                        }
                    </td>
                    <td style={{textAlign:'center'}}>
                        <button 
                            onClick={() => toggleAutorizacion(t.id, t.isAuthorized)}
                            style={{
                                border: '1px solid #E5E7EB', background:'white', padding:'5px 10px', borderRadius:'8px', cursor:'pointer',
                                color: t.isAuthorized ? '#EF4444' : '#10B981'
                            }}
                        >
                            {t.isAuthorized ? "Revocar" : "Aprobar"}
                        </button>
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
// 6. APP PRINCIPAL
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
        
        // 1. Buscar en raíz
        let docRef = doc(db, "users", currentUser.uid);
        let docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Si es paciente, su data real está en el subdocumento del psicólogo
          if (data.rol === 'paciente' && data.psicologoId) {
             const subDocRef = doc(db, "users", data.psicologoId, "pacientes", currentUser.uid);
             const subSnap = await getDoc(subDocRef);
             if (subSnap.exists()) {
                setUserData({ ...subSnap.data(), psicologoId: data.psicologoId }); // Combinamos data
             } else {
                setUserData(data); // Fallback
             }
          } else {
             setUserData(data); // Es admin o psicologo o registro incompleto
          }
        } else {
          setUserData(null); // No existe registro, mostrar pantalla de selección
        }
      } else {
        setUser(null); setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="loading">Cargando...</div>;
  
  // Si está logueado en Google pero no tiene registro en BD -> REGISTRO
  if (user && !userData) return <RegistroScreen user={user} />;
  
  // Si no está logueado -> LOGIN
  if (!user) return <LoginScreen />;

  // --- RUTEO SEGÚN ROL Y ESTADO ---

  const Header = () => (
    <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 20px'}}>
      <h2 style={{margin:0}}>Hola, {userData.displayName} 👋</h2>
      <button onClick={() => signOut(auth)} className="btn-small">Salir</button>
    </header>
  );

  // 1. ADMIN + PSICÓLOGO (TÚ)
  // Asumimos que tú te pondrás manualmente rol:'admin' y rol:'psicologo' o un flag especial
  // Para simplificar, si tienes rol 'psicologo' y un flag isAdmin: true
  if (userData.rol === 'psicologo' && userData.isAdmin) {
    return (
      <div className="container" style={{maxWidth: '1200px'}}>
        <Header />
        <div style={{display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #eee'}}>
            <button onClick={() => setActiveTab('consultorio')} style={{padding: '10px', borderBottom: activeTab==='consultorio'?'2px solid blue':'none'}}>Consultorio</button>
            <button onClick={() => setActiveTab('admin')} style={{padding: '10px', borderBottom: activeTab==='admin'?'2px solid blue':'none'}}>Admin</button>
        </div>
        {activeTab === 'consultorio' ? <PanelPsicologo userData={userData} userUid={user.uid} /> : <PanelAdmin />}
      </div>
    );
  }

  // 2. SOLO PSICÓLOGO
  if (userData.rol === 'psicologo') {
    if (!userData.isAuthorized) return <PantallaEspera mensaje="Esperando aprobación del Administrador." />;
    return <div className="container"><Header /><PanelPsicologo userData={userData} userUid={user.uid} /></div>;
  }

  // 3. PACIENTE
  if (userData.rol === 'paciente') {
    if (!userData.isAuthorized) return <PantallaEspera mensaje="Esperando que tu Psicólogo te autorice." />;
    return <div className="container"><Header /><PanelPaciente userUid={user.uid} psicologoId={userData.psicologoId} /></div>;
  }

  // 4. ADMIN PURO
  if (userData.isAdmin) {
    return <div className="container"><Header /><PanelAdmin /></div>;
  }

  return <div className="container">Error: Rol no identificado.</div>;
}