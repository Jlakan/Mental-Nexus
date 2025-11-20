import { useState, useEffect } from 'react';
import { auth, googleProvider, db } from './firebaseConfig';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  doc, setDoc, updateDoc, addDoc, deleteDoc, 
  collection, query, where, getDocs, onSnapshot, getDoc
} from 'firebase/firestore';
import './style.css';

// ==========================================
// 1. LOGIN
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
      <p style={{fontSize: '1.1rem', marginBottom: '2rem'}}>Gestión Profesional de Terapia.</p>
      <button className="btn-google" onClick={handleGoogleLogin}>
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" width="20" />
        Ingresar con Google
      </button>
    </div>
  );
}

// ==========================================
// 2. REGISTRO (SELECCIÓN DE ROL)
// ==========================================
function RegistroScreen({ user }: any) {
  const [modo, setModo] = useState<'seleccion' | 'paciente' | 'terapeuta'>('seleccion');
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [loadingReg, setLoadingReg] = useState(false);

  // Estado para el nombre personalizado en el registro
  const [nombrePersonalizado, setNombrePersonalizado] = useState(user.displayName || "");

  const registrarTerapeuta = async () => {
    setLoadingReg(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: nombrePersonalizado, // Usamos el nombre editado
        photoURL: user.photoURL,
        rol: 'psicologo',
        isAdmin: false,
        isAuthorized: false,
        codigoVinculacion: "PSI-" + Math.floor(1000 + Math.random() * 9000),
        createdAt: new Date()
      });
      window.location.reload();
    } catch (err) {
      console.error(err);
      setError("Error al registrar.");
      setLoadingReg(false);
    }
  };

  const registrarPaciente = async () => {
    if (!codigo) return setError("Ingresa el código de tu terapeuta.");
    setLoadingReg(true);
    
    try {
      const q = query(collection(db, "users"), where("codigoVinculacion", "==", codigo));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setLoadingReg(false);
        return setError("Código no válido.");
      }
      const psicologoDoc = querySnapshot.docs[0];
      const psicologoId = psicologoDoc.id;

      await setDoc(doc(db, "users", user.uid), {
        rol: 'paciente',
        psicologoId: psicologoId, 
        email: user.email
      });

      await setDoc(doc(db, "users", psicologoId, "pacientes", user.uid), {
        uid: user.uid,
        displayName: nombrePersonalizado, // Usamos el nombre editado
        email: user.email,
        photoURL: user.photoURL,
        rol: 'paciente',
        isAuthorized: false,
        createdAt: new Date()
      });

      window.location.reload();
    } catch (err) {
      console.error(err);
      setError("Error técnico al registrar.");
      setLoadingReg(false);
    }
  };

  // Input para el nombre (Componente reutilizable)
  const InputNombre = () => (
    <div style={{marginBottom: '20px', textAlign: 'left'}}>
        <label style={{display:'block', marginBottom:'5px', fontWeight:'bold', fontSize:'0.9rem'}}>¿Cómo quieres llamarte?</label>
        <input 
            type="text" 
            value={nombrePersonalizado} 
            onChange={(e) => setNombrePersonalizado(e.target.value)}
            style={{padding: '10px', width: '100%'}}
        />
    </div>
  );

  if (modo === 'seleccion') {
    return (
      <div className="container" style={{textAlign: 'center'}}>
        <h2>Bienvenido</h2>
        <p>Configura tu perfil inicial.</p>
        
        <InputNombre />

        <p>Selecciona tu rol:</p>
        <div style={{display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px', flexWrap: 'wrap'}}>
          <button className="btn-primary" onClick={() => setModo('paciente')} style={{background: '#10B981', flex: 1, minWidth: '150px'}}>
            Soy Paciente 👤
          </button>
          <button className="btn-primary" onClick={() => setModo('terapeuta')} style={{flex: 1, minWidth: '150px'}}>
            Soy Terapeuta 👨‍⚕️
          </button>
        </div>
        <button onClick={() => signOut(auth)} className="btn-link" style={{marginTop: '20px'}}>Cancelar</button>
      </div>
    );
  }

  if (modo === 'terapeuta') {
    return (
      <div className="container" style={{textAlign: 'center'}}>
        <h2>Registro de Terapeuta</h2>
        <p>Nombre visible: <strong>{nombrePersonalizado}</strong></p>
        {error && <p style={{color: 'red'}}>{error}</p>}
        <button onClick={registrarTerapeuta} className="btn-primary" disabled={loadingReg}>
          {loadingReg ? "Registrando..." : "Confirmar Registro"}
        </button>
        <button onClick={() => setModo('seleccion')} className="btn-link" style={{marginTop: '15px'}}>Volver</button>
      </div>
    );
  }

  return ( // Modo Paciente
    <div className="container" style={{textAlign: 'center'}}>
      <h2>Registro de Paciente</h2>
      <p>Nombre visible: <strong>{nombrePersonalizado}</strong></p>
      <p>Ingresa el código de tu Psicólogo:</p>
      <div style={{margin: '20px 0'}}>
        <input 
          type="text" placeholder="EJ: PSI-1234" 
          className="input-code"
          value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())}
        />
      </div>
      {error && <p style={{color: 'red'}}>{error}</p>}
      <button onClick={registrarPaciente} className="btn-primary" disabled={loadingReg}>
         {loadingReg ? "Vinculando..." : "Completar Registro"}
      </button>
      <button onClick={() => setModo('seleccion')} className="btn-link" style={{marginTop: '15px'}}>Volver</button>
    </div>
  );
}

// ==========================================
// 3. PANTALLA DE ESPERA
// ==========================================
function PantallaEspera({ mensaje }: { mensaje?: string }) {
  return (
    <div className="container" style={{textAlign: 'center'}}>
      <h2 style={{color: '#F59E0B'}}>⏳ Cuenta en Revisión</h2>
      <div style={{padding: '20px', background: '#FFFBEB', borderRadius: '12px', margin: '20px 0', color: '#B45309', border: '1px solid #FCD34D'}}>
        <p style={{margin: 0, fontWeight: 'bold'}}>
          {mensaje || "Tu cuenta está pendiente de autorización."}
        </p>
      </div>
      <button onClick={() => signOut(auth)} className="btn-link">Cerrar Sesión</button>
    </div>
  );
}

// ==========================================
// 4. PANEL PACIENTE
// ==========================================
function PanelPaciente({ userUid, psicologoId }: any) {
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
              <div style={{width: '100%', background: '#F3F4F6', height: '10px', borderRadius: '5px', marginBottom: '20px', overflow: 'hidden'}}>
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
// 5. PANEL PSICÓLOGO
// ==========================================
function PanelPsicologo({ userData, userUid }: any) {
  const [pacientes, setPacientes] = useState<any[]>([]); 
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);
  const [habitosPaciente, setHabitosPaciente] = useState<any[]>([]);
  const [tituloHabito, setTituloHabito] = useState("");
  const [metaSemanal, setMetaSemanal] = useState(80);

  // Cargar pacientes desde subcolección
  useEffect(() => {
    const colRef = collection(db, "users", userUid, "pacientes");
    const unsubscribe = onSnapshot(colRef, (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPacientes(lista);
    });
    return () => unsubscribe();
  }, [userUid]);

  // Cargar hábitos
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

// ==========================================
// 6. PANEL ADMIN
// ==========================================
function PanelAdmin() {
  const [terapeutas, setTerapeutas] = useState<any[]>([]);

  useEffect(() => {
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
        let docRef = doc(db, "users", currentUser.uid);
        let docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.rol === 'paciente' && data.psicologoId) {
             const subDocRef = doc(db, "users", data.psicologoId, "pacientes", currentUser.uid);
             const subSnap = await getDoc(subDocRef);
             if (subSnap.exists()) {
                setUserData({ ...subSnap.data(), psicologoId: data.psicologoId }); 
             } else {
                setUserData(data); 
             }
          } else {
             setUserData(data); 
          }
        } else {
          setUserData(null);
        }
      } else {
        setUser(null); setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="loading">Cargando...</div>;
  if (user && (!userData || !userData.rol)) return <RegistroScreen user={user} />;
  if (!user) return <LoginScreen />;

  // HEADER CON FUNCIÓN DE EDITAR NOMBRE
  const Header = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(userData.displayName);

    const guardarNombre = async () => {
        if(!tempName.trim()) return setIsEditing(false);
        try {
            // 1. Actualizar en raíz
            await updateDoc(doc(db, "users", user.uid), { displayName: tempName });
            
            // 2. Si es paciente, actualizar en la subcolección del psicólogo
            if(userData.rol === 'paciente' && userData.psicologoId) {
                await updateDoc(doc(db, "users", userData.psicologoId, "pacientes", user.uid), { displayName: tempName });
            }
            
            // Actualizar estado local visualmente
            setUserData({...userData, displayName: tempName});
            setIsEditing(false);
        } catch(e) { console.error(e); }
    };

    return (
        <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', padding: '0 10px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                <div style={{width: '40px', height: '40px', background: '#4F46E5', borderRadius: '10px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem'}}>
                    {userData.displayName ? userData.displayName.charAt(0) : "?"}
                </div>
                <div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        {isEditing ? (
                            <div style={{display: 'flex', gap: '5px'}}>
                                <input 
                                    type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} 
                                    style={{padding: '5px', fontSize: '1rem', width: '200px'}} autoFocus
                                />
                                <button onClick={guardarNombre} style={{background:'#10B981', color:'white', border:'none', borderRadius:'5px', cursor:'pointer'}}>OK</button>
                            </div>
                        ) : (
                            <>
                                <h2 style={{margin: 0, fontSize: '1.2rem'}}>{userData.displayName}</h2>
                                <button onClick={() => setIsEditing(true)} style={{background:'none', border:'none', cursor:'pointer', fontSize:'1rem', opacity: 0.5}} title="Editar nombre">✏️</button>
                            </>
                        )}
                    </div>
                    <div style={{fontSize: '0.8rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                        {userData.isAdmin && "Administrador • "}{userData.rol === 'psicologo' && "Terapeuta"}{userData.rol === 'paciente' && "Paciente"}
                    </div>
                </div>
            </div>
            <button onClick={() => signOut(auth)} className="btn-small" style={{color: '#EF4444', fontWeight: 'bold'}}>Cerrar Sesión</button>
        </header>
    );
  };

  if (userData.rol === 'psicologo' && userData.isAdmin) {
    return (
      <div className="container" style={{maxWidth: '1200px'}}>
        <Header />
        <div style={{display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #eee'}}>
            <button onClick={() => setActiveTab('consultorio')} style={{padding: '10px', borderBottom: activeTab==='consultorio'?'2px solid #4F46E5':'none', background:'none', border:'none', cursor:'pointer', fontWeight:'bold'}}>Consultorio</button>
            <button onClick={() => setActiveTab('admin')} style={{padding: '10px', borderBottom: activeTab==='admin'?'2px solid #1F2937':'none', background:'none', border:'none', cursor:'pointer', fontWeight:'bold'}}>Admin</button>
        </div>
        {activeTab === 'consultorio' ? <PanelPsicologo userData={userData} userUid={user.uid} /> : <PanelAdmin />}
      </div>
    );
  }

  if (userData.rol === 'psicologo') {
    if (!userData.isAuthorized) return <PantallaEspera mensaje="Esperando aprobación del Administrador." />;
    return <div className="container"><Header /><PanelPsicologo userData={userData} userUid={user.uid} /></div>;
  }

  if (userData.rol === 'paciente') {
    if (!userData.isAuthorized) return <PantallaEspera mensaje="Esperando que tu Psicólogo te autorice." />;
    return <div className="container"><Header /><PanelPaciente userUid={user.uid} psicologoId={userData.psicologoId} /></div>;
  }

  if (userData.isAdmin) {
    return <div className="container"><Header /><PanelAdmin /></div>;
  }

  return <div className="container">Error: Rol no identificado.</div>;
}