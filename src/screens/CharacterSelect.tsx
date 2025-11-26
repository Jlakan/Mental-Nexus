import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { PERSONAJES, PersonajeTipo } from '../game/GameAssets';

interface Props {
  userUid: string;
  psicologoId?: string;
  onSelect: () => void; 
}

export function CharacterSelect({ userUid, psicologoId, onSelect }: Props) {
  const [selected, setSelected] = useState<PersonajeTipo | null>(null);
  const [loading, setLoading] = useState(false);

  const confirmarPersonaje = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const updates = {
        avatarKey: selected,
        gold: 0,
        inventory: [],
        equippedItems: [],
        stats: PERSONAJES[selected].statsBase,
        nivel: 1,
        xp: 0
      };

      // 1. Actualizar perfil raíz
      await updateDoc(doc(db, "users", userUid), updates);

      // 2. Actualizar en subcolección del psicólogo (si existe)
      if (psicologoId) {
        await updateDoc(doc(db, "users", psicologoId, "pacientes", userUid), updates);
      }
      
      onSelect(); 
      window.location.reload();
    } catch (error) {
      console.error("Error guardando personaje:", error);
      alert("Error al guardar selección.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{maxWidth: '1000px', textAlign: 'center'}}>
      <h2 style={{color: 'var(--primary)', fontSize: '2.5rem', marginBottom:'10px', fontFamily: 'Rajdhani, sans-serif'}}>ELIGE TU CAMINO</h2>
      <p style={{color: 'var(--text-muted)', marginBottom: '40px', fontSize: '1.1rem'}}>Tu especialidad determinará tus habilidades y recompensas.</p>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px'}}>
        {Object.values(PERSONAJES).map((p) => {
          // LÓGICA DE DETECCIÓN DE MEDIOS
          const mediaUrl = p.etapas[0].imagen;
          const isVideo = mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm');

          return (
            <div 
              key={p.id}
              onClick={() => setSelected(p.id)}
              style={{
                background: selected === p.id ? 'rgba(6, 182, 212, 0.1)' : 'var(--bg-card)',
                border: selected === p.id ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px', padding: '25px', cursor: 'pointer', transition: 'all 0.2s',
                transform: selected === p.id ? 'scale(1.05)' : 'scale(1)',
                boxShadow: selected === p.id ? '0 0 30px rgba(6, 182, 212, 0.2)' : 'none',
                position: 'relative', overflow: 'hidden'
              }}
            >
              {/* VISUALIZADOR DE AVATAR */}
              <div style={{
                  width: '100%', height: '200px', marginBottom: '15px', borderRadius: '10px', overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.1)', background: 'black', position: 'relative'
              }}>
                  {isVideo ? (
                    <video 
                        src={mediaUrl} 
                        autoPlay loop muted playsInline 
                        style={{width: '100%', height: '100%', objectFit: 'cover'}}
                    />
                  ) : (
                    <img 
                        src={mediaUrl} 
                        alt={p.nombre}
                        style={{width: '100%', height: '100%', objectFit: 'cover'}}
                    />
                  )}
              </div>
              
              <h3 style={{fontSize: '1.3rem', margin: '0 0 5px 0', color: 'white', fontFamily: 'Rajdhani, sans-serif'}}>{p.nombre}</h3>
              
              {/* LEMA */}
              <p style={{fontSize: '0.8rem', color: 'var(--secondary)', fontStyle:'italic', marginBottom:'10px'}}>"{p.lemaPrincipal}"</p>
              
              <p style={{fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '15px'}}>{p.descripcion}</p>
              
              {/* Stats iniciales */}
              <div style={{display:'flex', justifyContent:'center', gap:'10px', fontSize:'0.8rem', opacity: 0.8}}>
                  {p.statsBase.vitalidad > 0 && <span title="Vitalidad">❤️ +{p.statsBase.vitalidad}</span>}
                  {p.statsBase.sabiduria > 0 && <span title="Sabiduría">🧠 +{p.statsBase.sabiduria}</span>}
                  {p.statsBase.carisma > 0 && <span title="Carisma">🤝 +{p.statsBase.carisma}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div style={{animation: 'fadeIn 0.5s'}}>
            <button onClick={confirmarPersonaje} className="btn-primary" disabled={loading} style={{fontSize: '1.2rem', padding: '15px 50px', letterSpacing: '2px'}}>
            {loading ? "INICIANDO..." : `COMENZAR COMO ${PERSONAJES[selected].nombre.toUpperCase()}`}
            </button>
        </div>
      )}
    </div>
  );
}