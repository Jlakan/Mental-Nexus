import { useState, useEffect } from 'react';

interface Props {
  imgSrc: string;
  videoSrc: string;
  delaySeconds?: number;
  style?: React.CSSProperties;
}

export function AvatarPortrait({ imgSrc, videoSrc, delaySeconds = 30, style }: Props) {
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    setShowVideo(false);
    const timer = setTimeout(() => {
      setShowVideo(true);
    }, delaySeconds * 1000);

    return () => clearTimeout(timer); 
  }, [imgSrc, videoSrc, delaySeconds]);

  return (
    // CAMBIO CLAVE: width y height al 100% para llenar el contenedor padre
    <div style={{ position: 'relative', overflow: 'hidden', width: '100%', height: '100%', ...style }}>
      {showVideo ? (
        <video 
          src={videoSrc} 
          autoPlay loop muted playsInline 
          // objectFit: 'cover' es lo que hace que no queden bordes negros
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