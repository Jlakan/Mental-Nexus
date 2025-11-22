import { useState, useRef } from 'react';

export function IntroScreen({ onFinish }: { onFinish: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Estados para controlar el flujo
  const [userInteracted, setUserInteracted] = useState(false);
  const [opacity, setOpacity] = useState(1);

  const startExperience = () => {
    setUserInteracted(true);
    // Damos un pequeño delay para asegurar que el renderizado ocurra antes de play
    setTimeout(() => {
        if (videoRef.current) {
            videoRef.current.play().catch(e => console.error("Error al reproducir:", e));
        }
    }, 100);
  };

  const handleEnded = () => {
    setOpacity(0);
    setTimeout(() => {
      onFinish();
    }, 500);
  };

  return (
    <div className="intro-container" style={{ opacity: opacity }}>
      
      {/* FASE 1: BOTÓN DE INICIO (Para activar el sonido) */}
      {!userInteracted && (
        <div style={{zIndex: 10000, textAlign: 'center', animation: 'fadeIn 1s'}}>
            <h1 style={{fontSize: '3rem', marginBottom: '20px', textShadow: '0 0 20px var(--primary)', fontFamily: 'Rajdhani'}}>
                MENTAL NEXUS
            </h1>
            <button 
                onClick={startExperience}
                style={{
                    background: 'transparent',
                    color: 'var(--primary)',
                    border: '2px solid var(--primary)',
                    padding: '15px 40px',
                    fontSize: '1.2rem',
                    fontFamily: 'Rajdhani',
                    fontWeight: 'bold',
                    letterSpacing: '3px',
                    cursor: 'pointer',
                    boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
                    animation: 'pulse 2s infinite',
                    textTransform: 'uppercase'
                }}
            >
                Inicializar Sistema
            </button>
        </div>
      )}

      {/* FASE 2: EL VIDEO (Solo se renderiza tras el clic) */}
      {userInteracted && (
          <>
            <video 
                ref={videoRef}
                src="/intro.mp4" 
                // SIN 'muted' para que se escuche
                // SIN 'autoPlay' (lo manejamos manualmente con el botón)
                playsInline 
                onEnded={handleEnded}
                className="video-responsive"
            />
            
            <button 
                onClick={handleEnded}
                style={{
                position: 'absolute', bottom: '40px', right: '30px',
                background: 'rgba(0, 0, 0, 0.6)', color: '#06b6d4', 
                border: '1px solid #06b6d4',
                padding: '8px 20px', borderRadius: '20px', cursor: 'pointer', 
                backdropFilter: 'blur(4px)', fontSize: '0.7rem', 
                letterSpacing: '2px', textTransform: 'uppercase',
                boxShadow: '0 0 10px rgba(6, 182, 212, 0.3)',
                zIndex: 10001
                }}
            >
                SALTAR &gt;&gt;
            </button>
          </>
      )}
    </div>
  );
}