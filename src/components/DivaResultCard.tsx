import React, { useState } from 'react';
import '../screens/PanelPsicologo.css'; // Usamos los mismos estilos

interface Props {
  datos: any; // El objeto JSON completo guardado en Firebase
}

export const DivaResultCard: React.FC<Props> = ({ datos }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Filtramos solo las claves que son preguntas (A1...A9, HI1...HI9, D1...D5)
  const keys = Object.keys(datos).filter(k => k !== 'resumen' && k !== 'textoInforme').sort();

  return (
    <div style={{ background: 'rgba(15, 23, 42, 0.5)', borderRadius: '12px', border: '1px solid rgba(34, 211, 238, 0.2)', overflow: 'hidden' }}>
      
      {/* HEADER DE LA TARJETA */}
      <div style={{ padding: '20px', background: 'rgba(34, 211, 238, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, color: '#22d3ee' }}>🔬 ANÁLISIS DETALLADO DIVA-5</h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>Desglose de síntomas por etapa de vida</p>
        </div>
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="btn-ghost"
          style={{ fontSize: '0.9rem' }}
        >
          {showDetails ? 'OCULTAR DETALLES' : 'VER TABLA COMPLETA'}
        </button>
      </div>

      {/* TABLA DE DETALLES (PLEGABLE) */}
      {showDetails && (
        <div style={{ padding: '20px' }}>
          <table className="detail-table">
            <thead>
              <tr>
                <th style={{ width: '10%' }}>ID</th>
                <th style={{ width: '45%', color: '#fbbf24' }}>VIDA ADULTA</th>
                <th style={{ width: '45%', color: '#38bdf8' }}>INFANCIA</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => {
                const item = datos[key];
                if (!item || !item.adultez) return null;

                // Verificamos si cumple el criterio general
                const cumpleAdulto = item.adultez.cumple;
                const cumpleInfancia = item.infancia.cumple;

                return (
                  <tr key={key}>
                    <td style={{ fontWeight: 'bold', color: '#94a3b8' }}>{key}</td>
                    
                    {/* COLUMNA ADULTO */}
                    <td style={{ background: cumpleAdulto ? 'rgba(251, 191, 36, 0.05)' : 'transparent' }}>
                      <div style={{ marginBottom: '5px' }}>
                        {cumpleAdulto ? <span className="check-green">✓ PRESENTE</span> : <span className="check-red">✕ AUSENTE</span>}
                      </div>
                      {item.adultez.evidencias && item.adultez.evidencias.length > 0 && (
                        <div style={{ paddingLeft: '10px', borderLeft: '2px solid #fbbf24' }}>
                          {item.adultez.evidencias.map((ev: string, i: number) => (
                            <span key={i} className="sintoma-tag">{ev}</span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* COLUMNA INFANCIA */}
                    <td style={{ background: cumpleInfancia ? 'rgba(56, 189, 248, 0.05)' : 'transparent' }}>
                      <div style={{ marginBottom: '5px' }}>
                        {cumpleInfancia ? <span className="check-green">✓ PRESENTE</span> : <span className="check-red">✕ AUSENTE</span>}
                      </div>
                      {item.infancia.evidencias && item.infancia.evidencias.length > 0 && (
                        <div style={{ paddingLeft: '10px', borderLeft: '2px solid #38bdf8' }}>
                          {item.infancia.evidencias.map((ev: string, i: number) => (
                            <span key={i} className="sintoma-tag">{ev}</span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};