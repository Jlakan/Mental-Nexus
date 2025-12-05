import React, { useState } from 'react';
import './ClinicalTests.css';

const BAI_QUESTIONS = [
  "Torpeza o entumecimiento (Hormigueo)", "Acaloramiento (Sofocos)", "Temblor en las piernas",
  "Incapacidad de relajarse", "Miedo a que suceda lo peor", "Mareo o aturdimiento",
  "Palpitaciones o taquicardia", "Inestabilidad", "Terror o miedo intenso",
  "Nerviosismo", "Sensación de ahogo", "Temblores de manos", "Temblor generalizado",
  "Miedo a perder el control", "Dificultad para respirar", "Miedo a morir",
  "Sobresaltos", "Molestias digestivas o abdominales", "Desvanecimiento",
  "Rubor facial", "Sudoración (no debida al calor)"
];

const OPTIONS = [
  { value: 0, label: "En absoluto", color: "#94a3b8" },
  { value: 1, label: "Levemente", color: "#22d3ee" },
  { value: 2, label: "Moderadamente", color: "#facc15" },
  { value: 3, label: "Severamente", color: "#ef4444" }
];

interface Props {
  onFinish: (resultado: any) => void;
  onCancel: () => void;
}

export const BeckTestScreen: React.FC<Props> = ({ onFinish, onCancel }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const finalizarTest = (respuestasFinales: number[]) => {
    const totalScore = respuestasFinales.reduce((a, b) => a + b, 0);
    let severidad = "Ansiedad Mínima", color = "#10b981";
    if (totalScore >= 8 && totalScore <= 15) { severidad = "Ansiedad Leve"; color = "#22d3ee"; }
    else if (totalScore >= 16 && totalScore <= 25) { severidad = "Ansiedad Moderada"; color = "#facc15"; }
    else if (totalScore >= 26) { severidad = "Ansiedad Severa"; color = "#ef4444"; }

    onFinish({
        raw: respuestasFinales,
        resumen: { puntaje: totalScore, interpretacion: severidad },
        textoInforme: `📋 RESULTADOS BAI\n🔹 PUNTAJE: ${totalScore}/63\n⚠️ NIVEL: ${severidad.toUpperCase()}`
    });
  };

  const handleOptionClick = (valor: number) => {
    const nuevas = [...answers, valor];
    setAnswers(nuevas);
    if (currentIndex < BAI_QUESTIONS.length - 1) setCurrentIndex(p => p + 1);
    else finalizarTest(nuevas);
  };

  const progreso = ((currentIndex + 1) / BAI_QUESTIONS.length) * 100;

  return (
    <div className="diva-container">
      <div style={{ width: '100%', maxWidth: '800px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
          <span style={{ fontFamily: 'Rajdhani', fontWeight: 'bold' }}>PROTOCOLO BAI</span>
          <span>{currentIndex + 1} / {BAI_QUESTIONS.length}</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginTop:'10px' }}>
          <div style={{ height: '100%', width: `${progreso}%`, background: '#8b5cf6', boxShadow: '0 0 10px #8b5cf6', transition: 'width 0.3s ease' }}></div>
        </div>
      </div>

      <div className="glass-panel" style={{ maxWidth: '800px', padding: '40px', alignItems: 'center', textAlign: 'center' }}>
        <h3 style={{ color: '#8b5cf6', letterSpacing: '2px', marginBottom: '10px', fontSize: '1rem' }}>SÍNTOMA EVALUADO</h3>
        <h1 style={{ fontSize: '2.5rem', margin: '0 0 40px 0', color: '#f8fafc', lineHeight: '1.2' }}>"{BAI_QUESTIONS[currentIndex]}"</h1>
        <p style={{ color: '#94a3b8', marginBottom: '30px' }}>¿Cuánto le ha molestado este síntoma durante la última semana?</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '100%' }}>
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleOptionClick(opt.value)}
              className="option-btn"
              style={{
                background: 'rgba(15, 23, 42, 0.6)', border: `1px solid ${opt.color}`, padding: '20px', borderRadius: '12px',
                color: 'white', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = opt.color; e.currentTarget.style.color = '#000'; e.currentTarget.style.boxShadow = `0 0 20px ${opt.color}`; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{opt.value}</span>
              <span style={{ fontSize: '0.9rem', fontFamily: 'Rajdhani', fontWeight: '600' }}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
      <button onClick={onCancel} style={{ marginTop: '30px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', textDecoration: 'underline' }}>Cancelar</button>
    </div>
  );
};