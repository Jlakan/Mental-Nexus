import { useState, useEffect } from 'react';
import { auth, googleProvider, db } from './services/firebaseConfig';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  doc, setDoc, updateDoc, addDoc, deleteDoc, 
  collection, query, where, getDocs, onSnapshot, getDoc
} from 'firebase/firestore';
import './style.css';

// --- IMPORTAMOS LOS COMPONENTES NUEVOS ---
import { Header } from './components/Header';
import { PanelPaciente } from './screens/PanelPaciente';

// ==========================================
// PANTALLAS AUXILIARES (Pronto irán a su archivo)
// ==========================================
function LoginScreen() {
  const handleGoogleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } 
    catch (error: any) { alert("Error: " + error.message); }
  };
  return (
    <div className="container login-container">
      <h1>Mental Nexus 2.0 🧠</h1>
      <p style={{fontSize: '1.1rem', marginBottom: '2rem'}}>Gestión Profesional de Terapia.</p>
      <button className="btn-google" onClick={handleGoogleLogin}>Ingresar con Google</button>
    </div>
  );
}

function PantallaEspera({ mensaje }: { mensaje?: string }) {
  return (
    <div className="container" style={{textAlign: 'center'}}>
      <h2 style={{color: '#F59E0B'}}>⏳ Cuenta en Revisión</h2>
      <div style={{padding: '20px', background: '#FFFBEB', borderRadius: '12px', margin: '20px 0', color: '#B45309', border: '1px solid #FCD34D'}}>
        <p style={{margin: 0, fontWeight: 'bold'}}>{mensaje || "Tu cuenta está pendiente de autorización."}</p>
      </div>
      <button onClick={() => signOut(auth)} className="btn-link">Cerrar Sesión</button>
    </div>
  );
}

function RegistroScreen({ user }: any) {
  const [modo, setModo] = useState<'seleccion' | 'paciente' | 'terapeuta'>('seleccion');
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [loadingReg, setLoadingReg] = useState(false);
  const [nombrePersonalizado, setNombrePersonalizado] = useState(user.displayName || "");

  const registrarTerapeuta = async () => {
    setLoadingReg(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid, email: user.email, displayName: nombrePersonalizado, photoURL: user.photoURL,
        rol: 'psicologo', isAdmin: false, isAuthorized: false,
        codigoVinculacion: "PSI-" + Math.floor(1000 + Math.random() * 9000), createdAt: new Date()
      });
      window.location.reload();
    } catch (err) { console.error(err); setError("Error al registrar."); setLoadingReg(false); }
  };

  const registrarPaciente = async () => {
    if (!codigo) return setError("Ingresa el código de tu terapeuta.");
    setLoadingReg(true);
    try {
      const q = query(collection(db, "users"), where("codigoVinculacion", "==", codigo));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) { setLoadingReg(false); return setError("Código no válido."); }
      
      const psicologoDoc = querySnapshot.docs[0];
      const psicologoId = psicologoDoc.id;

      await setDoc(doc(db, "users", user.uid), { rol: 'paciente', psicologoId: psicologoId, email: user.email });
      await setDoc(doc(db, "users", psicologoId, "pacientes", user.uid), {
        uid: user.uid, displayName: nombrePersonalizado, email: user.email, photoURL: user.photoURL,
        rol: 'paciente', isAuthorized: false, createdAt: new Date()
      });
      window.location.reload();
    } catch (err) { console.error(err); setError("Error técnico."); setLoadingReg(false); }
  };

  if (modo === 'seleccion') {
    return (
      <div className="container" style={{textAlign: 'center'}}>
        <h2>Bienvenido</h2> <p>Configura tu perfil inicial.</p>
        <div style={{marginBottom: '20px', textAlign: 'left'}}>
            <label style={{display:'block', marginBottom:'5px', fontWeight:'bold', fontSize:'0.9rem'}}>¿Cómo quieres llamarte?</label>
            <input type="text" value={nombrePersonalizado} onChange={(e) => setNombrePersonalizado(e.target.value)} style={{padding: '10px', width: '100%'}} />
        </div>
        <div style={{display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px'}}>
          <button className="btn-primary" onClick={() => setModo('paciente')} style={{background: '#10B981', flex: 1}}>Soy Paciente 👤</button>
          <button className="btn-primary" onClick={() => setModo('terapeuta')} style={{flex: 1}}>Soy Terapeuta 👨‍⚕️</button>
        </div>
        <button onClick={() => signOut(auth)} className="btn-link" style={{marginTop: '20px'}}>Cancelar</button>
      </div>
    );
  }
  
  // Renderizados simplificados para terapeuta/paciente en registro...
  if (modo === 'terapeuta') {
      return <div className="container" style={{textAlign:'center'}}><h2>Registro Terapeuta</h2><button onClick={registrarTerapeuta} className="btn-primary">Confirmar</button></div>
  }
  return (
      <div className="container" style={{textAlign:'center'}}>
          <h2>Registro Paciente</h2>
          <input type="text" placeholder="Código PSI" className="input-code" value={codigo} onChange={(e)=>setCodigo(e.target.value.toUpperCase())} />
          <button onClick={registrarPaciente} className="btn-primary" style={{marginTop:'10px'}}>Confirmar</button>
      </div>
  );
}

// ==========================================
// PANELES QUE FALTAN MOVER (LOS DEJAMOS AQUÍ POR AHORA)
// ==========================================
function PanelPsicologo({ userData, userUid }: any) {
  // ... (Lógica del psicólogo idéntica a la anterior, resumida para no llenar el chat)
  // Si quieres, crea src/screens/PanelPsicologo.tsx y muévelo ahí también
  const [pacientes, setPacientes] = useState<any[]>([]); 
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);
  const [habitosPaciente, setHabitosPaciente] = useState<any[]>([]);
  const [tituloHabito, setTituloHabito] = useState("");
  const [metaSemanal, setMetaSemanal] = useState(80);

  useEffect(() => {
    const colRef = collection(db, "users", userUid, "pacientes");
    const unsubscribe = onSnapshot(colRef, (snap) => setPacientes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsubscribe();
  }, [userUid]);

  useEffect(() => {
    if (!pacienteSeleccionado) { setHabitosPaciente([]); return; }
    const q = query(collection(db, "habitos"), where("pacienteId", "==", pacienteSeleccionado.id));
    const unsubscribe = onSnapshot(q, (snap) => setHabitosPaciente(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsubscribe();
  }, [pacienteSeleccionado]);

  const autorizar = async (id: string, estado: boolean) => await updateDoc(doc(db, "users", userUid, "pacientes", id), { isAuthorized: !estado });
  const crear = async () => {
      if(!tituloHabito) return;
      await addDoc(collection(db, "habitos"), { titulo: tituloHabito, pacienteId: pacienteSeleccionado.id, asignadoPor: userUid, metaSemanal: metaSemanal, createdAt: new Date(), registro: { L: false, M: false, X: false, J: false, V: false, S: false, D: false } });
      setTituloHabito("");
  };
  const eliminar = async (id: string) => { if(confirm("¿Borrar?")) await deleteDoc(doc(db, "habitos", id)); };
  const calcular = (reg: any) => Math.round((Object.values(reg).filter(v => v === true).length / 7) * 100);

  return (
    <div style={{textAlign: 'left'}}>
      <div style={{background: 'white', padding: '20px', borderRadius: '16px', marginBottom: '20px'}}>
        <h3 style={{margin:0, color: '#4F46E5'}}>👨‍⚕️ Consultorio</h3>
        <p style={{margin:0}}>Código: <strong>{userData.codigoVinculacion}</strong></p>
      </div>
      <div style={{display: 'flex', gap: '30px'}}>
        <div style={{flex: 1}}>
            <h4>Pacientes</h4>
            {pacientes.map(p => (
                <div key={p.id} style={{padding:'10px', border:'1px solid #eee', margin:'5px 0', borderRadius:'8px', cursor:'pointer', background: pacienteSeleccionado?.id===p.id?'#EEF2FF':'white'}} onClick={()=>p.isAuthorized && setPacienteSeleccionado(p)}>
                    {p.displayName} 
                    <button onClick={(e)=>{e.stopPropagation(); autorizar(p.id, p.isAuthorized)}} style={{float:'right', fontSize:'0.7rem'}}>{p.isAuthorized?"Activo":"Aprobar"}</button>
                </div>
            ))}
        </div>
        <div style={{flex: 2}}>
            {pacienteSeleccionado ? (
                <div>
                    <h4>{pacienteSeleccionado.displayName}</h4>
                    <div style={{display:'flex', gap:'10px'}}>
                        <input value={tituloHabito} onChange={e=>setTituloHabito(e.target.value)} placeholder="Nuevo hábito" />
                        <button onClick={crear} className="btn-primary">Agregar</button>
                    </div>
                    <div style={{marginTop:'20px'}}>
                        {habitosPaciente.map(h => (
                            <div key={h.id} style={{padding:'10px', border:'1px solid #eee', marginBottom:'10px', borderRadius:'8px'}}>
                                <strong>{h.titulo}</strong> ({calcular(h.registro)}%)
                                <button onClick={()=>eliminar(h.id)} style={{float:'right'}}>🗑️</button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : <p>Selecciona un paciente</p>}
        </div>
      </div>
    </div>
  );
}

function PanelAdmin() {
    return <div className="container"><h2>Panel Admin</h2><p>(Código pendiente de mover a archivo propio)</p></div>
}

// ==========================================
// APP PRINCIPAL
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
             if (subSnap.exists()) setUserData({ ...subSnap.data(), psicologoId: data.psicologoId }); 
             else setUserData(data); 
          } else setUserData(data); 
        } else setUserData(null);
      } else { setUser(null); setUserData(null); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="loading">Cargando...</div>;
  if (user && (!userData || !userData.rol)) return <RegistroScreen user={user} />;
  if (!user) return <LoginScreen />;

  // VISTA ADMIN + PSICÓLOGO
  if (userData.rol === 'psicologo' && userData.isAdmin) {
    return (
      <div className="container" style={{maxWidth: '1200px'}}>
        <Header userData={userData} setUserData={setUserData} user={user} />
        <div style={{display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #eee'}}>
            <button onClick={() => setActiveTab('consultorio')} style={{padding: '10px', fontWeight: activeTab==='consultorio'?'bold':'normal'}}>Consultorio</button>
            <button onClick={() => setActiveTab('admin')} style={{padding: '10px', fontWeight: activeTab==='admin'?'bold':'normal'}}>Admin</button>
        </div>
        {activeTab === 'consultorio' ? <PanelPsicologo userData={userData} userUid={user.uid} /> : <PanelAdmin />}
      </div>
    );
  }

  if (userData.rol === 'psicologo') {
    if (!userData.isAuthorized) return <PantallaEspera mensaje="Esperando aprobación del Administrador." />;
    return <div className="container"><Header userData={userData} setUserData={setUserData} user={user} /><PanelPsicologo userData={userData} userUid={user.uid} /></div>;
  }

  if (userData.rol === 'paciente') {
    if (!userData.isAuthorized) return <PantallaEspera mensaje="Esperando que tu Psicólogo te autorice." />;
    return <div className="container"><Header userData={userData} setUserData={setUserData} user={user} /><PanelPaciente userUid={user.uid} psicologoId={userData.psicologoId} /></div>;
  }

  if (userData.isAdmin) {
    return <div className="container"><Header userData={userData} setUserData={setUserData} user={user} /><PanelAdmin /></div>;
  }

  return <div className="container">Error: Rol no identificado.</div>;
}