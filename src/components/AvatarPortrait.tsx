import { useState, useEffect } from 'react';

interface Props {
  imgSrc: string;
  videoSrc: string;
  delaySeconds?: number; // Opcional, por defecto 30
  style?: React.CSSProperties;
}

export function AvatarPortrait({ imgSrc, videoSrc, delaySeconds = 30, style }: Props) {
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    // Reiniciar el timer si cambian los archivos (ej: subes de nivel)
    setShowVideo(false);
    
    const timer = setTimeout(() => {
      setShowVideo(true);
    }, delaySeconds * 1000); // Convertir a milisegundos

    return () => clearTimeout(timer); // Limpieza si el componente se desmonta
  }, [imgSrc, videoSrc, delaySeconds]);

  return (
    <div style={{ position: 'relative', overflow: 'hidden', ...style }}>
      {showVideo ? (
        <video 
          src={videoSrc} 
          autoPlay loop muted playsInline 
          style={{ width: '100%', height: '100%', objectFit: 'cover', animation: 'fadeIn 1s' }} 
        />
      ) : (
        <img 
          src={imgSrc} 
          alt="Avatar" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
      )}
    </div>
  );
}