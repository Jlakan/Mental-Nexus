import { useState, useRef } from 'react';

export function IntroScreen({ onFinish }: { onFinish: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [opacity, setOpacity] = useState(1);

  const handleEnded = () => {
    setOpacity(0);
    setTimeout(() => {
      onFinish();
    }, 500);
  };

  return (
    <div className="intro-container" style={{ opacity: opacity }}>
      
      <video 
        ref={videoRef}
        src="/intro.mp4" 
        autoPlay 
        muted 
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
          boxShadow: '0 0 10px rgba(6, 182, 212, 0.3)'
        }}
      >
        {/* CORRECCIÓN: Usamos el código HTML para evitar errores */}
        SALTAR &gt;&gt;
      </button>
    </div>
  );
}