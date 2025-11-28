import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { PERSONAJES, PersonajeTipo, STATS_CONFIG, AvatarDef } from '../game/GameAssets';

interface Props {
  userUid: string;
  psicologoId?: string;
  onSelect: () => void; 
}

export function CharacterSelect({ userUid, psicologoId, onSelect }: Props) {
  const [previewChar, setPreviewChar] = useState<AvatarDef | null>(null);
  const [loading, setLoading] = useState(false);

  const confirmarPersonaje = async () => {
    if (!previewChar) return;
    setLoading(true);
    try {
      const updates = {
        avatarKey: previewChar.id,
        gold: 0,
        inventory: [],
        equippedItems: [],
        stats: previewChar.statsBase,
        nivel: 1,
        xp: 0
      };

      await updateDoc(doc(db, "users", userUid), updates);
      if (psicologoId) {
        await updateDoc(doc(db, "users", psicologoId, "pacientes", userUid), updates);
      }
      
      onSelect(); 
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Error al guardar selección.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{maxWidth: '1000px', textAlign: 'center'}}>
      <h2 style={{color: 'var(--primary)', fontSize: '2.5rem', marginBottom:'10px', fontFamily: 'Rajdhani, sans-serif'}}>ELIGE TU CAMINO</h2>
      <p style={{color: 'var(--text-muted)', marginBottom: '40px', fontSize: '1.1rem'}}>Tu especialidad determinará tus habilidades y recompensas.</p>

      {/* LISTA DE TARJETAS */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px'}}>
        {Object.values(PERSONAJES).map((p) => {
          const mediaUrl = p.etapas[0].imagen;
          const isVideo = mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm');

          return (
            <div 
              key={p.id}
              onClick={() => setPreviewChar(p)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px', padding: '25px', cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                position: 'relative', overflow: 'hidden'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{width: '100%', height: '200px', marginBottom: '15px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: 'black'}}>
                  {isVideo ? (
                    <video src={mediaUrl} autoPlay loop muted playsInline style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  ) : (
                    <img src={mediaUrl} alt={p.nombre} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  )}
              </div>
              
              <h3 style={{fontSize: '1.3rem', margin: '0 0 5px 0', color: 'white', fontFamily: 'Rajdhani, sans-serif'}}>{p.nombre}</h3>
              <p style={{fontSize: '0.8rem', color: 'var(--secondary)', fontStyle:'italic', marginBottom:'15px'}}>"{p.arquetipo}"</p>
              
              {/* Stats con Iconos PNG */}
              <div style={{display:'flex', justifyContent:'center', gap:'15px', marginTop:'10px', background:'rgba(0,0,0,0.3)', padding:'10px', borderRadius:'10px'}}>
                  {p.statsBase.vitalidad > 0 && (
                      <div style={{display:'flex', alignItems:'center', gap:'5px', color:'white', fontSize:'0.9rem'}}>
                          <img src={STATS_CONFIG.vitalidad.icon} width="20" /> +{p.statsBase.vitalidad}
                      </div>
                  )}
                  {p.statsBase.sabiduria > 0 && (
                      <div style={{display:'flex', alignItems:'center', gap:'5px', color:'white', fontSize:'0.9rem'}}>
                          <img src={STATS_CONFIG.sabiduria.icon} width="20" /> +{p.statsBase.sabiduria}
                      </div>
                  )}
                  {p.statsBase.vinculacion > 0 && (
                      <div style={{display:'flex', alignItems:'center', gap:'5px', color:'white', fontSize:'0.9rem'}}>
                          <img src={STATS_CONFIG.vinculacion.icon} width="20" /> +{p.statsBase.vinculacion}
                      </div>
                  )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE DETALLE (EXPEDIENTE) */}
      {previewChar && (
        <div style={{
            position:'fixed', top:0, left:0, width:'100vw', height:'100vh', zIndex:9999,
            background:'rgba(0,0,0,0.9)', backdropFilter:'blur(15px)',
            display:'flex', justifyContent:'center', alignItems:'center', padding:'20px', overflowY:'auto'
        }} onClick={() => setPreviewChar(null)}>
            
            <div style={{
                width:'100%', maxWidth:'900px', background:'var(--bg-card)', border:'var(--glass-border)', 
                borderRadius:'20px', padding:'40px', textAlign:'left', boxShadow:'0 0 80px rgba(6, 182, 212, 0.2)',
                display:'flex', gap:'40px', flexWrap:'wrap', maxHeight:'90vh', overflowY:'auto'
            }} onClick={e => e.stopPropagation()}>
                
                {/* Columna Izquierda: Visual */}
                <div style={{flex: 1, minWidth:'300px', display:'flex', flexDirection:'column', gap:'20px'}}>
                    <div style={{width:'100%', aspectRatio:'1/1', borderRadius:'15px', overflow:'hidden', border:'2px solid var(--primary)', background:'black', boxShadow:'0 0 30px rgba(6, 182, 212, 0.2)'}}>
                        <video src={previewChar.etapas[0].imagen} autoPlay loop muted playsInline style={{width:'100%', height:'100%', objectFit:'cover'}} />
                    </div>
                    <div style={{background:'rgba(255,255,255,0.05)', padding:'15px', borderRadius:'12px', textAlign:'center'}}>
                        <h4 style={{color:'var(--primary)', margin:0}}>ATRIBUTOS BASE</h4>
                        <div style={{display:'flex', justifyContent:'center', gap:'20px', marginTop:'10px'}}>
                             <div style={{textAlign:'center'}}><img src={STATS_CONFIG.vitalidad.icon} width="30"/><div style={{fontWeight:'bold', color:'white'}}>{previewChar.statsBase.vitalidad}</div></div>
                             <div style={{textAlign:'center'}}><img src={STATS_CONFIG.sabiduria.icon} width="30"/><div style={{fontWeight:'bold', color:'white'}}>{previewChar.statsBase.sabiduria}</div></div>
                             <div style={{textAlign:'center'}}><img src={STATS_CONFIG.vinculacion.icon} width="30"/><div style={{fontWeight:'bold', color:'white'}}>{previewChar.statsBase.vinculacion}</div></div>
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Info */}
                <div style={{flex: 1.5, minWidth:'300px'}}>
                    <h2 style={{fontSize:'3rem', fontFamily:'Rajdhani', color:'white', lineHeight:1, margin:0}}>{previewChar.nombre}</h2>
                    <h3 style={{color:'var(--secondary)', fontSize:'1.2rem', fontStyle:'italic', marginTop:'5px'}}>"{previewChar.arquetipo}"</h3>
                    <p style={{color:'var(--primary)', fontWeight:'bold', marginTop:'20px', borderLeft:'3px solid var(--primary)', paddingLeft:'15px'}}>"{previewChar.lemaPrincipal}"</p>
                    
                    <div style={{margin:'30px 0'}}>
                        <h4 style={{color:'white', borderBottom:'1px solid rgba(255,255,255,0.1)', paddingBottom:'5px'}}>PERFIL PSICOLÓGICO</h4>
                        <p style={{color:'var(--text-muted)', lineHeight:'1.6', fontSize:'0.95rem'}}>{previewChar.bio}</p>
                    </div>

                    <div style={{margin:'30px 0'}}>
                        <h4 style={{color:'white', borderBottom:'1px solid rgba(255,255,255,0.1)', paddingBottom:'5px'}}>RUTA DE EVOLUCIÓN</h4>
                        <div style={{display:'flex', flexDirection:'column', gap:'15px', marginTop:'15px'}}>
                            {previewChar.etapas.map((etapa, index) => (
                                <div key={index} style={{display:'flex', gap:'15px', opacity: 0.8}}>
                                    <div style={{background:'rgba(255,255,255,0.1)', width:'30px', height:'30px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', color:'white', fontSize:'0.8rem'}}>{index+1}</div>
                                    <div>
                                        <div style={{color:'white', fontWeight:'bold'}}>{etapa.nombreClase}</div>
                                        <div style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>{etapa.descripcionNarrativa}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{display:'flex', gap:'20px', marginTop:'40px'}}>
                        <button onClick={() => setPreviewChar(null)} style={{background:'transparent', border:'1px solid rgba(255,255,255,0.3)', color:'white', padding:'15px 30px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', flex:1}}>VOLVER</button>
                        <button onClick={confirmarPersonaje} className="btn-primary" disabled={loading} style={{flex:2, fontSize:'1.1rem'}}>
                            {loading ? "INICIALIZANDO..." : "CONFIRMAR SELECCIÓN"}
                        </button>
                    </div>
                </div>

            </div>
        </div>
      )}
    </div>
  );
}