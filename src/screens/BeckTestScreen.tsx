import React, { useState } from 'react';
import './ClinicalTests.css'; // Reutilizamos el CSS base

// --- DATOS DEL BAI (21 Ítems) ---
const BAI_QUESTIONS = [
  "Torpeza o entumecimiento (Hormigueo)",
  "Acaloramiento (Sofocos)",
  "Temblor en las piernas",
  "Incapacidad de relajarse",
  "Miedo a que suceda lo peor",
  "Mareo o aturdimiento",
  "Palpitaciones o taquicardia",
  "Inestabilidad",
  "Terror o miedo intenso",
  "Nerviosismo",
  "Sensación de ahogo",
  "Temblores de manos",
  "Temblor generalizado",
  "Miedo a perder el control",
  "Dificultad para respirar",
  "Miedo a morir",
  "Sobresaltos",
  "Molestias digestivas o abdominales",
  "Desvanecimiento",
  "Rubor facial",
  "Sudoración (no debida al calor)"
];

const OPTIONS = [
  { value: 0, label: "En absoluto", color: "#94a3b8" },
  { value: 1, label: "Levemente (No me molesta mucho)", color: "#22d3ee" },
  { value: 2, label: "Moderadamente (Fue muy desagradable)", color: "#facc15" },
  { value: 3, label: "Severamente (Casi no podía soportarlo)", color: "#ef4444" }
];

interface Props {
  onFinish: (resultado: any) => void;
  onCancel: () => void;
}

export const BeckTestScreen: React.FC<Props> = ({ onFinish, onCancel }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]); // Guardamos las puntuaciones (0-3)

  // --- LÓGICA DE FINALIZACIÓN ---
  const finalizarTest = (respuestasFinales: number[]) => {
    const totalScore = respuestasFinales.reduce((a, b) => a + b, 0);
    
    // Interpretación Clínica Estándar BAI
    let severidad = "Ansiedad Mínima";
    let colorSeveridad = "#10b981"; // Verde

    if (totalScore >= 8 && totalScore <= 15) {
        severidad = "Ansiedad Leve";
        colorSeveridad = "#22d3ee"; // Azul
    } else if (totalScore >= 16 && totalScore <= 25) {
        severidad = "Ansiedad Moderada";
        colorSeveridad = "#facc15"; // Amarillo
    } else if (totalScore >= 26) {
        severidad = "Ansiedad Severa";
        colorSeveridad = "#ef4444"; // Rojo
    }

    const informe = {
        raw: respuestasFinales,
        resumen: { puntaje: totalScore, interpretacion: severidad },
        textoInforme: `
📋 RESULTADOS INVENTARIO DE BECK (BAI)
---------------------------------------
🔹 PUNTAJE TOTAL: ${totalScore} / 63
⚠️ NIVEL: ${severidad.toUpperCase()}

Nota: Basado en la escala estándar (0-21 ítems).
        `.trim()
    };

    onFinish(informe);
  };

  const handleOptionClick = (valor: number) => {
    const nuevasRespuestas = [...answers, valor];
    setAnswers(nuevasRespuestas);

    if (currentIndex < BAI_QUESTIONS.length - 1) {
      // Siguiente pregunta
      setCurrentIndex(prev => prev + 1);
    } else {
      // Finalizar
      finalizarTest(nuevasRespuestas);
    }
  };

  const progreso = ((currentIndex + 1) / BAI_QUESTIONS.length) * 100;

  return (
    <div className="diva-container">
      {/* HEADER */}
      <div style={{ width: '100%', maxWidth: '800px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '10px' }}>
          <span style={{ fontFamily: 'Rajdhani', fontWeight: 'bold', letterSpacing: '1px' }}>PROTOCOLO BAI</span>
          <span>{currentIndex + 1} / {BAI_QUESTIONS.length}</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progreso}%`, background: '#8b5cf6', boxShadow: '0 0 10px #8b5cf6', transition: 'width 0.3s ease' }}></div>
        </div>
      </div>

      {/* TARJETA DE PREGUNTA */}
      <div className="glass-panel" style={{ maxWidth: '800px', padding: '40px', alignItems: 'center', textAlign: 'center' }}>
        <h3 style={{ color: '#8b5cf6', letterSpacing: '2px', marginBottom: '10px', fontSize: '1rem' }}>SÍNTOMA EVALUADO</h3>
        <h1 style={{ fontSize: '2.5rem', margin: '0 0 40px 0', color: '#f8fafc', lineHeight: '1.2' }}>
          "{BAI_QUESTIONS[currentIndex]}"
        </h1>
        
        <p style={{ color: '#94a3b8', marginBottom: '30px' }}>¿Cuánto le ha molestado este síntoma durante la última semana?</p>

        {/* GRID DE OPCIONES */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '100%' }}>
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleOptionClick(opt.value)}
              className="option-btn" // Definiremos esta clase abajo en estilo inline para rapidez o en CSS
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: `1px solid ${opt.color}`,
                padding: '20px',
                borderRadius: '12px',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '5px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = opt.color;
                e.currentTarget.style.color = '#000';
                e.currentTarget.style.boxShadow = `0 0 20px ${opt.color}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{opt.value}</span>
              <span style={{ fontSize: '0.9rem', fontFamily: 'Rajdhani', fontWeight: '600' }}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <button onClick={onCancel} style={{ marginTop: '30px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', textDecoration: 'underline' }}>
        Cancelar Evaluación
      </button>
    </div>
  );
};