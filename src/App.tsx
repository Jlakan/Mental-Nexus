import { useState, useEffect } from 'react';
import { auth, googleProvider, db } from './services/firebaseConfig';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  doc, setDoc, updateDoc, collection, query, where, getDocs, getDoc 
} from 'firebase/firestore';
import './style.css';

// --- IMPORTACIÓN DE MÓDULOS ---
import { Header } from './components/Header';
import { IntroScreen } from './components/IntroScreen';
import { PanelPaciente } from './screens/PanelPaciente';
import { PanelPsicologo } from './screens/PanelPsicologo';
import { PanelAdmin } from './screens/PanelAdmin';
import { CharacterSelect } from './screens/CharacterSelect';

// ==========================================
// PANTALLAS AUXILIARES (Login, Registro, Espera)
// ==========================================

function LoginScreen() {
  const handleGoogleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } 
    catch (error: any) { alert("Error: " + error.message); }
  };
  return (
    <div className="container" style={{textAlign: 'center', maxWidth: '400px'}}>
      <h1 style={{fontSize: '2.5rem', marginBottom: '10px'}}>MENTAL NEXUS</h1>
      <p style={{color: 'var(--text-muted)', marginBottom: '2rem'}}>Mind. Connected. Evolve.</p>
      <button className="btn-google" onClick={handleGoogleLogin}>
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" width="20" />
        Iniciar Sesión
      </button>
    </div>
  );
}

function PantallaEspera({ mensaje }: { mensaje?: string }) {
  return (
    <div className="container" style={{textAlign: 'center', maxWidth: '500px'}}>
      <h2 style={{color: 'var(--primary)'}}>⏳ Cuenta en Revisión</h2>
      <div style={{padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', margin: '20px 0', border: '1px solid var(--primary)'}}>
        <p style={{margin: 0, fontWeight: 'bold', color: 'var(--text-main)'}}>{mensaje || "Tu cuenta está pendiente de autorización."}</p>
      </div>
      <button onClick={() => signOut(auth)} className="btn-link" style={{color: 'var(--secondary)'}}>Cerrar Sesión</button>
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
      <div className="container" style={{textAlign: 'center', maxWidth: '600px'}}>
        <h2>Bienvenido</h2> <p>Configura tu perfil inicial.</p>
        <div style={{marginBottom: '20px', textAlign: 'left'}}>
            <label style={{display:'block', marginBottom:'5px', fontWeight:'bold', fontSize:'0.9rem', color: 'var(--primary)'}}>NOMBRE VISIBLE:</label>
            <input type="text" value={nombrePersonalizado} onChange={(e) => setNombrePersonalizado(e.target.value)} />
        </div>
        <div style={{display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '30px'}}>
          <button className="btn-primary" onClick={() => setModo('paciente')} style={{background: 'var(--secondary)', color: 'black', flex: 1}}>Soy Paciente</button>
          <button className="btn-primary" onClick={() => setModo('terapeuta')} style={{flex: 1}}>Soy Terapeuta</button>
        </div>
        <button onClick={() => signOut(auth)} className="btn-link" style={{marginTop: '20px'}}>Cancelar</button>
      </div>
    );
  }
  
  if (modo === 'terapeuta') {
      return (
        <div className="container" style={{textAlign:'center', maxWidth: '500px'}}>
            <h2>Registro Terapeuta</h2>
            <p>Se creará tu perfil profesional.</p>
            <button onClick={registrarTerapeuta} className="btn-primary" disabled={loadingReg}>Confirmar</button>
            <button onClick={() => setModo('seleccion')} className="btn-link" style={{marginTop:'15px'}}>Volver</button>
        </div>
      );
  }
  return (
      <div className="container" style={{textAlign:'center', maxWidth: '500px'}}>
          <h2>Registro Paciente</h2>
          <p>Ingresa el código de tu especialista</p>
          <div style={{margin:'20px 0'}}>
            <input type="text" placeholder="EJ: PSI-1234" className="input-code" value={codigo} onChange={(e)=>setCodigo(e.target.value.toUpperCase())} />
          </div>
          {error && <p style={{color:'#EF4444'}}>{error}</p>}
          <button onClick={registrarPaciente} className="btn-primary" style={{marginTop:'10px'}} disabled={loadingReg}>Confirmar</button>
          <button onClick={() => setModo('seleccion')} className="btn-link" style={{marginTop:'15px'}}>Volver</button>
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
  
  // Estado del Video Intro
  const [showIntro, setShowIntro] = useState(true); 
  
  // Estado de Pestañas (Admin)
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

  // 1. INTRO (Splash Screen)
  if (showIntro) {
      return <IntroScreen onFinish={() => setShowIntro(false)} />;
  }

  // 2. CARGA
  if (loading) return <div className="loading">MENTAL NEXUS<br/><small style={{fontSize:'0.8rem', marginTop:'10px'}}>SYSTEM LOADING...</small></div>;
  
  // 3. REGISTRO (Si existe en Auth pero no en Firestore)
  if (user && (!userData || !userData.rol)) return <RegistroScreen user={user} />;
  
  // 4. LOGIN
  if (!user) return <LoginScreen />;

  // --- RUTAS DE LA APP ---

  // VISTA HYBRIDA: ADMIN + PSICÓLOGO (TÚ)
  if (userData.rol === 'psicologo' && userData.isAdmin) {
    return (
      <div style={{width: '100%', maxWidth: '1200px'}}>
        <Header userData={userData} setUserData={setUserData} user={user} />
        <div className="container" style={{marginTop: '20px', background: 'rgba(30, 41, 59, 0.4)'}}>
            <div style={{display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
                <button onClick={() => setActiveTab('consultorio')} style={{padding: '10px 20px', background:'none', border:'none', color: activeTab==='consultorio' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab==='consultorio'?'2px solid var(--primary)':'none', cursor:'pointer', fontWeight:'bold', fontSize:'1.1rem'}}>Consultorio</button>
                <button onClick={() => setActiveTab('admin')} style={{padding: '10px 20px', background:'none', border:'none', color: activeTab==='admin' ? 'var(--secondary)' : 'var(--text-muted)', borderBottom: activeTab==='admin'?'2px solid var(--secondary)':'none', cursor:'pointer', fontWeight:'bold', fontSize:'1.1rem'}}>Admin Global</button>
            </div>
            {activeTab === 'consultorio' ? <PanelPsicologo userData={userData} userUid={user.uid} /> : <PanelAdmin />}
        </div>
      </div>
    );
  }

  // VISTA SOLO PSICÓLOGO
  if (userData.rol === 'psicologo') {
    if (!userData.isAuthorized) return <PantallaEspera mensaje="Esperando aprobación del Administrador del Sistema." />;
    return (
        <div style={{width: '100%', maxWidth: '1200px'}}>
            <Header userData={userData} setUserData={setUserData} user={user} />
            <div className="container" style={{marginTop: '20px'}}>
                <PanelPsicologo userData={userData} userUid={user.uid} />
            </div>
        </div>
    );
  }

  // VISTA PACIENTE
  if (userData.rol === 'paciente') {
    if (!userData.isAuthorized) return <PantallaEspera mensaje="Conectando con el servidor del Terapeuta... (Espera autorización)" />;
    
    // CHECK DE AVATAR: Si no tiene personaje, mostramos selección
    if (!userData.avatarKey) {
        return (
            <CharacterSelect 
                userUid={user.uid} 
                psicologoId={userData.psicologoId} 
                onSelect={() => window.location.reload()} 
            />
        );
    }

    // Si ya tiene personaje, entramos al panel
    return (
        <div style={{width: '100%', maxWidth: '800px'}}>
            <Header userData={userData} setUserData={setUserData} user={user} />
            <div className="container" style={{marginTop: '20px'}}>
                {/* AQUÍ ESTÁ LA CORRECCIÓN: Pasamos userData */}
                <PanelPaciente userUid={user.uid} psicologoId={userData.psicologoId} userData={userData} />
            </div>
        </div>
    );
  }

  // VISTA ADMIN PURO
  if (userData.isAdmin) {
    return (
        <div style={{width: '100%', maxWidth: '1200px'}}>
            <Header userData={userData} setUserData={setUserData} user={user} />
            <div className="container" style={{marginTop: '20px'}}>
                <PanelAdmin />
            </div>
        </div>
    );
  }

  return <div className="container">Error de Sistema: Rol no identificado.</div>;
}