import React, { useState, useEffect } from 'react';
import { auth, googleProvider, db } from './firebaseConfig';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc, 
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
// 2. SALA DE ESPERA (SIN ROL)
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
// 3. PANTALLA DE VINCULACIÓN (PACIENTES)
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
      <p>Felicidades, tu cuenta de paciente fue aprobada.</p>
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
// 4. PANEL DEL PACIENTE (TRACKER)
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
// 5. PANEL DE PSICÓLOGO (CONSULTORIO)
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
      <div style={{background: '#e3f2fd', padding: '20px