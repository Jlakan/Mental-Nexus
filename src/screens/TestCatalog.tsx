import React from 'react';
import './ClinicalTests.css'; // Asegúrate de que los estilos existan

const AVAILABLE_TESTS = [
  {
    id: 'diva5',
    title: 'ENTREVISTA DIVA-5',
    subtitle: 'Diagnóstico TDAH Adultos',
    description: 'Protocolo estructurado oficial para la evaluación del TDAH en adultos según criterios DSM-5. Evalúa infancia y adultez.',
    duration: '60-90 min',
    tags: ['TDAH', 'DSM-5', 'Oficial'],
    active: true
  },
  {
    id: 'beck_anxiety',
    title: 'INVENTARIO DE BECK (BAI)',
    subtitle: 'Evaluación de Ansiedad',
    description: 'Cuestionario de auto-reporte para medir la severidad de la ansiedad en adultos y adolescentes (21 ítems).',
    duration: '10-15 min',
    tags: ['Ansiedad', 'Screening'],
    active: true
  },
  {
    id: 'phq9',
    title: 'CUESTIONARIO PHQ-9',
    subtitle: 'Depresión',
    description: 'Instrumento para evaluar el grado de depresión y monitorear la severidad de los síntomas.',
    duration: '5-10 min',
    tags: ['Depresión', 'Seguimiento'],
    active: false // Aún no disponible
  }
];

interface Props {
  onSelectTest: (testId: string) => void;
  onCancel: () => void;
}

export const TestCatalog: React.FC<Props> = ({ onSelectTest, onCancel }) => {
  return (
    <div className="diva-container">
      {/* HEADER */}
      <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', lineHeight: 1, letterSpacing: '2px', color: '#f8fafc' }}>BIBLIOTECA DE PRUEBAS</h1>
          <span style={{ color: '#22d3ee', fontSize: '1rem', letterSpacing: '3px', fontWeight: 'bold' }}>SELECCIÓN DE PROTOCOLO</span>
        </div>
        <button onClick={onCancel} className="btn-text" style={{ fontSize: '1.2rem' }}>
          VOLVER AL EXPEDIENTE
        </button>
      </div>

      {/* GRID DE TARJETAS */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
        gap: '30px', 
        width: '100%', 
        maxWidth: '1400px' 
      }}>
        {AVAILABLE_TESTS.map((test) => (
          <div 
            key={test.id} 
            className="glass-panel" 
            style={{ 
              height: '100%', 
              opacity: test.active ? 1 : 0.6, 
              border: test.active ? '1px solid rgba(34, 211, 238, 0.3)' : '1px dashed #475569',
              transition: 'transform 0.3s, box-shadow 0.3s'
            }}
          >
            <div className="panel-header" style={{ background: test.active ? 'rgba(6, 182, 212, 0.1)' : 'rgba(0,0,0,0.2)' }}>
              <div className="panel-title" style={{ color: test.active ? '#22d3ee' : '#94a3b8' }}>{test.subtitle}</div>
              <h2 className="question-text" style={{ fontSize: '1.4rem' }}>{test.title}</h2>
            </div>

            <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: '1.6', flex: 1 }}>
                {test.description}
              </p>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                {test.tags.map(tag => (
                  <span key={tag} style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', color: '#94a3b8' }}>
                    #{tag}
                  </span>
                ))}
                <span style={{ marginLeft: 'auto', color: '#fcd34d', fontWeight: 'bold', fontSize: '0.9rem' }}>⏱ {test.duration}</span>
              </div>

              <div style={{ marginTop: '30px' }}>
                {test.active ? (
                  <button 
                    onClick={() => onSelectTest(test.id)}
                    className="btn-primary" 
                    style={{ width: '100%', padding: '15px' }}
                  >
                    INICIAR EVALUACIÓN
                  </button>
                ) : (
                  <button 
                    disabled
                    style={{ 
                      width: '100%', 
                      padding: '15px', 
                      background: 'transparent', 
                      border: '1px solid #475569', 
                      color: '#64748b', 
                      borderRadius: '6px',
                      cursor: 'not-allowed',
                      fontFamily: 'Rajdhani',
                      fontWeight: 'bold',
                      letterSpacing: '1px'
                    }}
                  >
                    PRÓXIMAMENTE
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};