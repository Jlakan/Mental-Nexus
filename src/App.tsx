import { useState, useEffect } from 'react'; // Quitamos 'React' que no se usaba
import { auth, googleProvider, db } from './firebaseConfig';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot 
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
      console.error("Error completo:", error);
      alert("Error al iniciar sesión: " + error.message);
    }
  };

  return (
    <div className="container login-container">
      <h1>Bienvenido al Tracker 🧠</h1>
      <p>Inicia sesión para gestionar tus hábitos.</p>
      <button className="btn-google" onClick={handleGoogleLogin}>
        Ingresar con Google
      </button>
    </div>
  );
}

// ==========================================
// 2. PANTALLA DE VINCULACIÓN
// ==========================================
function VinculacionScreen({ userUid }: any) { // Agregado ': any' para evitar error TS
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");

  const validarCodigo = async () => {
    if (!codigo) return;

    try {
      const q = query(collection(db, "users"), where("codigoVinculacion", "==", codigo));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("Código no válido. Verifica con tu especialista.");
        return;
      }

      const psicologoDoc = querySnapshot.docs[0];
      const psicologoId = psicologoDoc.id;
      const psicologoNombre = psicologoDoc.data().displayName;

      const pacienteRef = doc(db, "users", userUid);
      await updateDoc(pacienteRef, {
        psicologoId: psicologoId,
        estatus: "activo",
        asignadoEl: new Date()
      });
      
      alert(`¡Vinculado con éxito al Dr/a. ${psicologoNombre}!`);
      window.location.reload(); 

    } catch (err) {
      console.error(err);
      setError("Error de conexión.");
    }
  };

  return (
    <div className="container">
      <h2>🔐 Código de Acceso</h2>
      <p>Ingresa el código que te dio tu psicólogo.</p>
      <input 
        type="text" 
        placeholder="Ej: PSI-2024" 
        value={codigo}
        onChange={(e) => setCodigo(e.target.value.toUpperCase())}
        className="input-code"
      />
      {error && <p style={{color: 'red'}}>{error}</p>}
      <button onClick={validarCodigo} className="btn-primary">Validar y Entrar</button>
      <button onClick={() => auth.signOut()} className="btn-link">Cancelar / Salir</button>
    </div>
  );
}

// ==========================================
// 3. PANEL DEL PSICÓLOGO
// ==========================================
function PanelPsicologo({ userData, userUid }: any) {
  // CORRECCIÓN IMPORTANTE: <any[]> permite que la lista reciba datos
  const [pacientes, setPacientes] = useState<any[]>([]); 
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);
  
  const [tituloHabito, setTituloHabito] = useState("");
  const [metaSemanal, setMetaSemanal] = useState(80);
  const [miCodigo, setMiCodigo] = useState(userData.codigoVinculacion || "");

  useEffect(() => {
    const q = query(collection(db, "users"), where("psicologoId", "==", userUid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPacientes(lista);
    });
    return () => unsubscribe();
  }, [userUid]);

  const generarCodigo = async () => {
    const nuevoCodigo = "PSI-" + Math.floor(1000 + Math.random() * 9000);
    try {
      const userRef = doc(db, "users", userUid);
      await updateDoc(userRef, { codigoVinculacion: nuevoCodigo });
      setMiCodigo(nuevoCodigo);
      alert(`¡Código generado! Compártelo: ${nuevoCodigo}`);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar código");
    }
  };

  const crearHabito = async () => {
    if (!tituloHabito || !pacienteSeleccionado) return;

    try {
      await addDoc(collection(db, "habitos"), {
        titulo: tituloHabito,
        pacienteId: pacienteSeleccionado.id,
        asignadoPor: userUid,
        metaSemanal: metaSemanal,
        createdAt: new Date(),
        registro: { L: false, M: false, X: false, J: false, V: false, S: false, D: false }
      });
      alert(`Hábito asignado a ${pacienteSeleccionado.displayName}`);
      setTituloHabito("");
    } catch (error) {
      console.error("Error:", error);
      alert("No se pudo guardar el hábito");
    }
  };

  return (
    <div style={{textAlign: 'left'}}>
      <div style={{background: '#e3f2fd', padding: '15px', borderRadius: '8px', marginBottom: '20px'}}>
        <h3>👨‍⚕️ Panel de Gestión</h3>
        {miCodigo ? (
          <p style={{fontSize: '18px'}}>
            Código para pacientes: <strong style={{background: 'white', padding: '5px 10px', borderRadius: '5px', border: '1px dashed #333'}}>{miCodigo}</strong>
          </p>
        ) : (
          <button onClick={generarCodigo} className="btn-primary" style={{width: 'auto'}}>Generar Código Ahora 🎲</button>
        )}
      </div>

      <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
        <div style={{flex: 1, minWidth: '250px', borderRight: '1px solid #eee'}}>
          <h4>Mis Pacientes ({pacientes.length})</h4>
          {pacientes.length === 0 && <p style={{color: '#999'}}>Sin pacientes aún.</p>}
          <ul style={{listStyle: 'none', padding: 0}}>
            {pacientes.map(paciente => (
              <li key={paciente.id} style={{marginBottom: '10px'}}>
                <button 
                  onClick={() => setPacienteSeleccionado(paciente)}
                  style={{
                    width: '100%', padding: '10px', 
                    background: pacienteSeleccionado?.id === paciente.id ? '#007bff' : 'white',
                    color: pacienteSeleccionado?.id === paciente.id ? 'white' : 'black',
                    border: '1px solid #ccc', borderRadius: '5px', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <div>
                    <span style={{fontWeight: 'bold'}}>{paciente.displayName}</span><br/>
                    <small style={{opacity: 0.8}}>{paciente.email}</small>
                  </div>
                  <span style={{fontSize: '20px'}}>👤</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div style={{flex: 1, minWidth: '250px'}}>
          {pacienteSeleccionado ? (
            <div style={{background: '#f9f9f9', padding: '15px', borderRadius: '8px'}}>
              <h4>Nuevo hábito para: {pacienteSeleccionado.displayName}</h4>
              <label>Hábito:</label>
              <input 
                type="text" 
                value={tituloHabito}
                onChange={(e) => setTituloHabito(e.target.value)}
                placeholder="Ej: Leer 20 min"
                style={{width: '100%', padding: '8px', marginBottom: '10px'}}
              />
              <label>Meta de éxito (%):</label>
              <input 
                type="number" 
                value={metaSemanal}
                onChange={(e) => setMetaSemanal(Number(e.target.value))}
                style={{width: '60px', padding: '8px'}}
              /> %
              <br/>
              <button onClick={crearHabito} className="btn-primary" style={{marginTop: '10px'}}>Guardar</button>
            </div>
          ) : (
            <p style={{color: '#999', marginTop: '20px'}}>Selecciona un paciente &larr;</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. PANEL DEL PACIENTE
// ==========================================
function PanelPaciente({ userUid }: any) {
  const [misHabitos, setMisHabitos] = useState<any[]>([]); // <any[]> corrección

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
    } catch (error) {
      console.error("Error update:", error);
    }
  };

  const calcularProgreso = (registro: any) => {
    const cumplidos = Object.values(registro).filter(val => val === true).length;
    return Math.round((cumplidos / 7) * 100);
  };

  const diasSemana = ["L", "M", "X", "J", "V", "S", "D"];

  return (
    <div style={{textAlign: 'left'}}>
      <h3>🌱 Mis Hábitos Semanales</h3>
      {misHabitos.length === 0 && <p style={{color: '#666'}}>Aún no tienes hábitos asignados.</p>}

      <div style={{display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'}}>
        {misHabitos.map(habito => {
          const porcentaje = calcularProgreso(habito.registro);
          const logrado = porcentaje >= habito.metaSemanal;

          return (
            <div key={habito.id} style={{background: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #eee', boxShadow: '0 2px 5px rgba(0,0,0,0.05)'}}>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <h4 style={{margin: '0 0 10px 0'}}>{habito.titulo}</h4>
                <span style={{color: logrado ? '#28a745' : '#666', fontWeight: 'bold', fontSize: '14px'}}>
                  {porcentaje}% / Meta: {habito.metaSemanal}%
                </span>
              </div>

              <div style={{width: '100%', background: '#eee', height: '8px', borderRadius: '4px', marginBottom: '15px'}}>
                <div style={{width: `${porcentaje}%`, background: logrado ? '#28a745' : '#007bff', height: '100%', borderRadius: '4px', transition: 'width 0.3s ease'}}></div>
              </div>

              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                {diasSemana.map(dia => (
                  <button
                    key={dia}
                    onClick={() => toggleDia(habito.id, dia, habito.registro[dia])}
                    style={{
                      width: '35px', height: '35px', borderRadius: '50%', border: 'none', cursor: 'pointer', fontWeight: 'bold',
                      background: habito.registro[dia] ? '#4CAF50' : '#f0f0f0',
                      color: habito.registro[dia] ? 'white' : '#333', transition: 'all 0.2s'
                    }}
                  >
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
// 5. DASHBOARD GENERAL
// ==========================================
function Dashboard({ userData, userUid }: any) {
  return (
    <div className="container" style={{maxWidth: '900px'}}>
      <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
        <div>
          <h2 style={{margin: 0}}>Hola, {userData.displayName} 👋</h2>
          <small>
            {userData.isPsicologo ? "Psicólogo" : "Paciente"} {userData.isAdmin ? "(Admin)" : ""}
          </small>
        </div>
        <button onClick={() => signOut(auth)} className="btn-small">Cerrar Sesión</button>
      </header>
      <hr />

      {userData.isPsicologo ? (
        <PanelPsicologo userData={userData} userUid={userUid} />
      ) : (
        <PanelPaciente userUid={userUid} />
      )}
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
            const nuevoUsuario = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              isAdmin: false,
              isPsicologo: false,
              isPaciente: true, 
              estatus: "pendiente", 
              createdAt: new Date()
            };
            await setDoc(docRef, nuevoUsuario);
            setUserData(nuevoUsuario);
          }
          setLoading(false);
        });
        return () => unsubUser();

      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="loading">Cargando sistema... ☕</div>;
  if (!user) return <LoginScreen />;
  if (!userData) return <div className="loading">Preparando perfil...</div>;

  if (userData.isPsicologo === true) {
    return <Dashboard userData={userData} userUid={user.uid} />;
  }

  if (userData.isPaciente === true) {
    if (userData.estatus === 'pendiente') {
      return <VinculacionScreen userUid={user.uid} />;
    }
    return <Dashboard userData={userData} userUid={user.uid} />;
  }

  return (
    <div className="container">
      <h2>Cuenta sin Rol</h2>
      <p>Tu usuario no tiene permisos asignados.</p>
      <button onClick={() => signOut(auth)} className="btn-small">Salir</button>
    </div>
  );
}