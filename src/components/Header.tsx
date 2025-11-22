import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig'; 

export const Header = ({ userData, setUserData, user }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(userData.displayName || "");

    const guardarNombre = async () => {
        if(!tempName.trim()) return setIsEditing(false);
        try {
            // Actualizar en raíz
            await updateDoc(doc(db, "users", user.uid), { displayName: tempName });
            
            // Si es paciente, actualizar en la subcolección del psicólogo
            if(userData.rol === 'paciente' && userData.psicologoId) {
                await updateDoc(doc(db, "users", userData.psicologoId, "pacientes", user.uid), { displayName: tempName });
            }
            
            setUserData({...userData, displayName: tempName});
            setIsEditing(false);
        } catch(e) { console.error(e); }
    };

    return (
        <header style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', 
            padding: '15px 20px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', 
            border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)'
        }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                {/* LOGO DE LA APP */}
                <div style={{
                    width: '50px', height: '50px', borderRadius: '12px', overflow: 'hidden', 
                    border: '1px solid rgba(6, 182, 212, 0.5)', boxShadow: '0 0 15px rgba(6, 182, 212, 0.2)',
                    background: 'black'
                }}>
                    <img src="/logo.jpg" alt="Logo" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                </div>
                
                <div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        {isEditing ? (
                            <div style={{display: 'flex', gap: '5px'}}>
                                <input 
                                    type="text" 
                                    value={tempName} 
                                    onChange={(e) => setTempName(e.target.value)} 
                                    style={{width: '200px', padding:'5px', fontSize:'1rem', background:'rgba(0,0,0,0.5)', color:'white', border:'1px solid #06b6d4'}} 
                                    autoFocus 
                                />
                                <button onClick={guardarNombre} style={{background:'var(--secondary)', color:'black', border:'none', borderRadius:'5px', cursor:'pointer', padding:'0 10px', fontWeight:'bold'}}>OK</button>
                            </div>
                        ) : (
                            <>
                                <h2 style={{margin: 0, fontSize: '1.4rem', fontFamily: 'Rajdhani, sans-serif', color: 'white', letterSpacing:'1px'}}>
                                    {userData.displayName}
                                </h2>
                                <button onClick={() => setIsEditing(true)} style={{background:'none', border:'none', cursor:'pointer', fontSize:'1rem', opacity: 0.7, color: 'var(--primary)'}} title="Editar nombre">✏️</button>
                            </>
                        )}
                    </div>
                    <div style={{fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight:'600'}}>
                        {userData.isAdmin && "Admin • "}{userData.rol === 'psicologo' && "Terapeuta"}{userData.rol === 'paciente' && "Paciente"}
                    </div>
                </div>
            </div>
            
            <button onClick={() => signOut(auth)} className="btn-small" style={{
                color: '#f87171', fontWeight: 'bold', border: '1px solid rgba(248, 113, 113, 0.3)', 
                padding: '8px 20px', borderRadius: '20px', background: 'rgba(248, 113, 113, 0.1)',
                textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px'
            }}>
                Salir
            </button>
        </header>
    );
};