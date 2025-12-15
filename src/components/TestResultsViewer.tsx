import React from 'react';

// INTERFAZ DE PROPS
interface Props {
  nota: any; 
  onClose: () => void;
}

export const TestResultsViewer: React.FC<Props> = ({ nota, onClose }) => {
  const datos = nota.datosBrutos;
  
  // DETECCIÓN DE TIPO DE TEST
  const esBeck = nota.tipo === 'evaluacion_beck' || Array.isArray(datos);
  const esDiva = !esBeck;

  // --- RENDERIZADOR DIVA-5 ---
  const renderDivaDetails = () => {
    if (Array.isArray(datos)) return null;

    const keys = Object.keys(datos || {}).filter(k => k !== 'resumen' && k !== 'textoInforme').sort();

    return (
      <div style={{ marginTop: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', color: '#cbd5e1' }}>
          <thead>
            <tr style={{ background: 'rgba(30, 41, 59, 0.8)', borderBottom: '2px solid #475569' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Criterio</th>
              <th style={{ padding: '10px', textAlign: 'center', color: '#fbbf24' }}>Adulto</th>
              <th style={{ padding: '10px', textAlign: 'center', color: '#38bdf8' }}>Infancia</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => {
              const item = datos[key];
              if (!item?.adultez) return null;
              
              const cumpleA = item.adultez.cumple;
              const cumpleI = item.infancia.cumple;

              return (
                <tr key={key} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>{key}</td>
                  <td style={{ padding: '10px', textAlign: 'center', background: cumpleA ? 'rgba(251, 191, 36, 0.1)' : 'transparent' }}>
                    {cumpleA ? '✅' : '·'}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center', background: cumpleI ? 'rgba(56, 189, 248, 0.1)' : 'transparent' }}>
                    {cumpleI ? '✅' : '·'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // --- RENDERIZADOR BECK (BAI) ---
  const renderBeckDetails = () => {
    if (!Array.isArray(datos)) return <div style={{padding:'20px', color:'orange'}}>⚠️ Datos no válidos</div>;

    const BAI_QUESTIONS = [
      "Torpeza/Entumecimiento", "Acaloramiento", "Temblor piernas", "Incapacidad relajarse", 
      "Miedo a lo peor", "Mareo", "Palpitaciones", "Inestabilidad", "Terror", "Nerviosismo", 
      "Sensación ahogo", "Temblores manos", "Temblor general", "Miedo perder control", 
      "Dificultad respirar", "Miedo a morir", "Sobresaltos", "Molestias digestivas", 
      "Desvanecimiento", "Rubor facial", "Sudoración"
    ];

    const labels = ["0 - Nada", "1 - Leve", "2 - Moderado", "3 - Severo"];
    const colors = ["#64748b", "#22d3ee", "#facc15", "#ef4444"];

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginTop: '20px' }}>
        {datos.map((val: number, index: number) => (
          <div key={index} style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '10px', borderRadius: '8px', borderLeft: `4px solid ${colors[val]}` }}>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{index + 1}. {BAI_QUESTIONS[index]}</div>
            <div style={{ fontWeight: 'bold', color: colors[val] }}>{labels[val]}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, width: '100vw', height: '100vh', background: '#0f172a', overflowY: 'auto' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
             <h2 style={{ margin: 0, color: 'white', fontFamily: 'Rajdhani' }}>
               {esBeck ? 'RESULTADOS: BAI' : 'RESULTADOS: DIVA-5'}
             </h2>
             <div style={{ color: '#64748b' }}>Informe detallado</div>
          </div>
          <button onClick={onClose} style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            CERRAR ✕
          </button>
        </div>

        {/* CONTENIDO TEXTO */}
        <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
           <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: '#e2e8f0', margin: 0 }}>{nota.contenido}</pre>
        </div>

        {/* TABLAS DETALLADAS */}
        {esDiva && renderDivaDetails()}
        {esBeck && renderBeckDetails()}

      </div>
    </div>
  );
};