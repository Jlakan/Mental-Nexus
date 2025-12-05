import React from 'react';
import '../screens/ClinicalTests.css'; // Usamos los estilos Sci-Fi

interface Props {
  nota: any; // El objeto completo de la nota guardada en Firebase
  onClose: () => void;
}

export const TestResultsViewer: React.FC<Props> = ({ nota, onClose }) => {
  const datos = nota.datosBrutos;
  const tipo = nota.tipo;

  // --- RENDERIZADOR ESPECÍFICO PARA DIVA-5 ---
  const renderDivaDetails = () => {
    // Filtramos las claves (A1..A9, HI1..HI9, D1..D5)
    const keys = Object.keys(datos).filter(k => k !== 'resumen' && k !== 'textoInforme').sort();

    return (
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '2px solid #334155' }}>
              <th style={{ padding: '15px', textAlign: 'left', color: '#94a3b8' }}>CRITERIO</th>
              <th style={{ padding: '15px', textAlign: 'left', color: '#fbbf24', width: '40%' }}>VIDA ADULTA</th>
              <th style={{ padding: '15px', textAlign: 'left', color: '#38bdf8', width: '40%' }}>INFANCIA</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => {
              const item = datos[key];
              if (!item || !item.adultez) return null;
              
              const cumpleA = item.adultez.cumple;
              const cumpleI = item.infancia.cumple;

              return (
                <tr key={key} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#e2e8f0' }}>{key}</td>
                  
                  {/* ADULTO */}
                  <td style={{ padding: '15px', background: cumpleA ? 'rgba(251, 191, 36, 0.05)' : 'transparent' }}>
                    <div style={{ marginBottom: '8px', fontSize:'0.8rem' }}>
                      {cumpleA ? <span style={{color:'#34d399'}}>● PRESENTE</span> : <span style={{color:'#64748b', opacity:0.5}}>○ AUSENTE</span>}
                    </div>
                    {item.adultez.evidencias?.map((ev:string, i:number) => (
                      <div key={i} style={{ fontSize:'0.85rem', marginBottom:'4px', color:'#cbd5e1' }}>• {ev}</div>
                    ))}
                  </td>

                  {/* INFANCIA */}
                  <td style={{ padding: '15px', background: cumpleI ? 'rgba(56, 189, 248, 0.05)' : 'transparent' }}>
                    <div style={{ marginBottom: '8px', fontSize:'0.8rem' }}>
                      {cumpleI ? <span style={{color:'#34d399'}}>● PRESENTE</span> : <span style={{color:'#64748b', opacity:0.5}}>○ AUSENTE</span>}
                    </div>
                    {item.infancia.evidencias?.map((ev:string, i:number) => (
                      <div key={i} style={{ fontSize:'0.85rem', marginBottom:'4px', color:'#cbd5e1' }}>• {ev}</div>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // --- RENDERIZADOR ESPECÍFICO PARA BECK (BAI) ---
  const renderBeckDetails = () => {
    // Si no hay datos brutos (array de números), mostramos aviso
    if (!Array.isArray(datos)) return <div>No hay datos detallados disponibles.</div>;

    const BAI_QUESTIONS = [
      "Torpeza/Entumecimiento", "Acaloramiento", "Temblor piernas", "Incapacidad relajarse", 
      "Miedo a lo peor", "Mareo", "Palpitaciones", "Inestabilidad", "Terror", "Nerviosismo", 
      "Sensación ahogo", "Temblores manos", "Temblor general", "Miedo perder control", 
      "Dificultad respirar", "Miedo a morir", "Sobresaltos", "Molestias digestivas", 
      "Desvanecimiento", "Rubor facial", "Sudoración"
    ];

    const labels = ["0 - Nada", "1 - Leve", "2 - Moderado", "3 - Severo"];
    const colors = ["#475569", "#22d3ee", "#facc15", "#ef4444"];

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
        {datos.map((val: number, index: number) => (
          <div key={index} style={{ 
            background: 'rgba(15, 23, 42, 0.6)', 
            padding: '15px', 
            borderRadius: '8px', 
            borderLeft: `4px solid ${colors[val]}` 
          }}>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '5px' }}>Ítem {index + 1}</div>
            <div style={{ color: '#e2e8f0', fontWeight: 'bold', marginBottom: '5px' }}>{BAI_QUESTIONS[index]}</div>
            <div style={{ color: colors[val], fontSize: '0.9rem' }}>{labels[val]}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="diva-container" style={{ position: 'fixed', top: 0, left: 0, zIndex: 10000, height: '100vh', width: '100vw', background: '#020617' }}>
      
      {/* HEADER DE NAVEGACIÓN */}
      <div style={{ width: '100%', maxWidth: '1400px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <div style={{ color: '#22d3ee', letterSpacing: '2px', fontSize: '0.9rem', fontWeight: 'bold' }}>VISOR DE RESULTADOS</div>
          <h1 style={{ margin: 0, color: 'white', fontSize: '2rem' }}>
            {tipo === 'evaluacion_diva' ? 'ENTREVISTA DIVA-5' : 'INVENTARIO BECK'}
          </h1>
          <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '5px' }}>
            Fecha: {new Date(nota.createdAt?.seconds * 1000).toLocaleDateString()} | ID: {nota.id}
          </div>
        </div>
        <button 
          onClick={onClose}
          style={{ 
            background: 'transparent', 
            border: '1px solid #ef4444', 
            color: '#ef4444', 
            padding: '10px 25px', 
            borderRadius: '6px', 
            cursor: 'pointer', 
            fontFamily: 'Rajdhani', 
            fontWeight: 'bold', 
            letterSpacing: '1px' 
          }}
        >
          CERRAR VISOR ✕
        </button>
      </div>

      {/* CUERPO DEL REPORTE */}
      <div style={{ width: '100%', maxWidth: '1400px', flex: 1, overflowY: 'auto', paddingBottom: '50px' }}>
        
        {/* RESUMEN RÁPIDO */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
           <div style={{ flex: 1, background: 'rgba(34, 211, 238, 0.1)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(34, 211, 238, 0.3)' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#22d3ee' }}>RESUMEN AUTOMÁTICO</h4>
              <pre style={{ margin: 0, fontFamily: 'inherit', color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>{nota.contenido}</pre>
           </div>
        </div>

        {/* DETALLE SEGÚN TIPO */}
        <h3 style={{ color: '#94a3b8', borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '20px' }}>
          DESGLOSE DE RESPUESTAS
        </h3>

        {tipo === 'evaluacion_diva' && renderDivaDetails()}
        {(!tipo || tipo === 'evaluacion_beck') && renderBeckDetails()}

      </div>
    </div>
  );
};