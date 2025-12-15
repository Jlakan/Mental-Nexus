import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebaseConfig';

export function LoginScreen() {
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      alert("Error al entrar: " + error.message);
    }
  };

  return (
    <div style={{
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      background: '#111', 
      color: 'white'
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>MENTAL NEXUS</h1>
      <p style={{ color: '#888', marginBottom: '2rem' }}>Mind. Connected. Evolve.</p>
      
      <button 
        onClick={handleGoogleLogin}
        style={{
          padding: '10px 20px',
          fontSize: '1rem',
          cursor: 'pointer',
          background: 'white',
          color: 'black',
          border: 'none',
          borderRadius: '5px',
          fontWeight: 'bold'
        }}
      >
        🔵 Iniciar con Google
      </button>
    </div>
  );
}