import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig'; // Ajusta la ruta según donde esté tu services

export const Header = ({ userData, setUserData, user }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(userData.displayName || "");

    const guardarNombre = async () => {
        if(!tempName.trim()) return setIsEditing(false);
        try {
            await updateDoc(doc(db, "users", user.uid), { displayName: tempName });
            if(userData.rol === 'paciente' && userData.psicologoId) {
                await updateDoc(doc(db, "users", userData.psicologoId, "pacientes", user.uid), { displayName: tempName });
            }
            setUserData({...userData, displayName: tempName});
            setIsEditing(false);
        } catch(e) { console.error(e); }
    };

    return (
        <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', padding: '0 10px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                <div style={{width: '40px', height: '40px', background: '#4F46E5', borderRadius: '10px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem'}}>
                    {userData.displayName ? userData.displayName.charAt(0).toUpperCase() : "?"}
                </div>
                <div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        {isEditing ? (
                            <div style={{display: 'flex', gap: '5px'}}>
                                <input 
                                    type="text" 
                                    value={tempName} 
                                    onChange={(e) => setTempName(e.target.value)} 
                                    style={{padding: '5px', fontSize: '1rem', width: '200px'}} 
                                    autoFocus
                                />
                                <button onClick={guardarNombre} style={{background:'#10B981', color:'white', border:'none', borderRadius:'5px', cursor:'pointer', padding:'0 10px'}}>OK</button>
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