import { useState, useEffect, useRef } from 'react';

export function IntroScreen({ onFinish }: { onFinish: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [opacity, setOpacity] = useState(1);

  const handleEnded = () => {
    // Efecto de desvanecimiento (fade out)
    setOpacity(0);
    setTimeout(() => {
      onFinish();
    }, 500); // Espera 0.5s a que termine la animación de opacidad
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'black', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center',
      opacity: opacity, transition: 'opacity 0.5s ease-in-out'
    }}>
      {/* Video a pantalla completa */}
      <video 
        ref={videoRef}
        src="/intro.mp4" // Esto busca en la carpeta public
        autoPlay 
        muted 
        playsInline // Importante para celulares
        onEnded={handleEnded}
        style={{width: '100%', height: '100%', objectFit: 'cover'}}
      />
      
      {/* Botón de saltar (por si el usuario tiene prisa) */}
      <button 
        onClick={handleEnded}
        style={{
          position: 'absolute', bottom: '30px', right: '30px',
          background: 'rgba(0, 0, 0, 0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.3)',
          padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', backdropFilter: 'blur(5px)',
          fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase'
        }}
      >
        Saltar Intro ⏭
      </button>
    </div>
  );
}