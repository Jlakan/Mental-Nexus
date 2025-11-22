import { useState, useEffect } from 'react';
import { auth, googleProvider, db } from './services/firebaseConfig';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  doc, setDoc, updateDoc, collection, query, where, getDocs, getDoc
} from 'firebase/firestore';
import './style.css';

// --- IMPORTACIÓN DE MÓDULOS ---
import { Header } from './components/Header';
import { PanelPaciente } from './screens/PanelPaciente';
import { PanelAdmin } from './screens/PanelAdmin';
import { PanelPsicologo } from './screens/PanelPsicologo';

// ==========================================
// PANTALLAS DE FLUJO (LOGIN/REGISTRO/ESPERA)
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
      <button className="btn-google" onClick={handleGoogleLogin}>
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" width="20" />
        Ingresar con Google
      </button>
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

function VinculacionScreen({ userUid }: any) {
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");

  const validarCodigo = async () => {
    if (!codigo) return;
    try {
      const q = query(collection(db, "users"), where("codigoVinculacion", "==", codigo));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) { setError("Código no válido."); return; }
      
      const psicologoDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, "users", userUid), {
        psicologoId: psicologoDoc.id, estatus: "activo", asignadoEl: new Date()
      });
      window.location.reload(); 
    } catch (err) { console.error(err); setError("Error de conexión."); }
  };

  return (
    <div className="container" style={{textAlign:'center'}}>
      <h2>🔑 Vincular con Especialista</h2>
      <p>Tu cuenta fue aprobada. Ingresa el código de tu terapeuta:</p>
      <input type="text" placeholder="Ej: PSI-1234" className="input-code" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} />
      {error && <p style={{color: 'red'}}>{error}</p>}
      <button onClick={validarCodigo} className="btn-primary">Entrar</button>
      <button onClick={() => signOut(auth)} className="btn-link">Salir</button>
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
// APP PRINCIPAL (CONTROLADOR DE VISTAS)
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
            <button onClick={() => setActiveTab('consultorio')} style={{padding: '10px', borderBottom: activeTab==='consultorio'?'2px solid #4F46E5':'none', background:'none', border:'none', cursor:'pointer', fontWeight:'bold'}}>Consultorio</button>
            <button onClick={() => setActiveTab('admin')} style={{padding: '10px', borderBottom: activeTab==='admin'?'2px solid #1F2937':'none', background:'none', border:'none', cursor:'pointer', fontWeight:'bold'}}>Admin</button>
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