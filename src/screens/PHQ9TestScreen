import React, { useState } from 'react';
import './ClinicalTests.css'; // Asegúrate de que este archivo exista o usa el mismo de Beck

interface Props {
  onFinish: (data: any) => void;
  onCancel: () => void;
}

const PHQ9_QUESTIONS = [
  "Tener poco interés o placer en hacer las cosas",
  "Sentirse desanimado/a, deprimido/a o sin esperanza",
  "Problemas para dormir, mantenerse dormido/a, o dormir demasiado",
  "Sentirse cansado/a o con poca energía",
  "Tener poco apetito o comer en exceso",
  "Sentirse mal con usted mismo/a (que es un fracaso o ha decepcionado a su familia)",
  "Dificultad para concentrarse en cosas (leer el periódico, ver TV)",
  "Moverse/hablar tan despacio que otros lo notan, o estar tan inquieto que se mueve más",
  "Pensamientos de que sería mejor estar muerto/a o de lastimarse de alguna manera"
];

const OPTIONS = [
  { valor: 0, label: "Nunca" },
  { valor: 1, label: "Varios días" },
  { valor: 2, label: "Más de la mitad de los días" },
  { valor: 3, label: "Casi todos los días" }
];

export const PHQ9TestScreen: React.FC<Props> = ({ onFinish, onCancel }) => {
  const [answers, setAnswers] = useState<number[]>(Array(9).fill(-1));

  const handleSelect = (index: number, value: number) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const calcularResultado = () => {
    // 1. Validar
    if (answers.includes(-1)) {
      alert("Por favor responde todos los reactivos para continuar.");
      return;
    }

    // 2. Calcular Puntaje
    const totalScore = answers.reduce((a, b) => a + b, 0);

    // 3. Interpretar Severidad
    let severidad = "";
    if (totalScore <= 4) severidad = "Mínima / Ninguna";
    else if (totalScore <= 9) severidad = "Leve";
    else if (totalScore <= 14) severidad = "Moderada";
    else if (totalScore <= 19) severidad = "Moderadamente Severa";
    else severidad = "Severa";

    // 4. Generar Informe
    const informe = `📋 PROTOCOLO PHQ-9 (DEPRESIÓN)
----------------------------------------
🔹 PUNTAJE TOTAL: ${totalScore} / 27
⚠️ NIVEL DETECTADO: ${severidad.toUpperCase()}

INTERPRETACIÓN:
El paciente presenta sintomatología compatible con un cuadro depresivo de intensidad ${severidad}.

${answers[8] > 0 ? "⚠️ ALERTA CRÍTICA: El ítem 9 (Ideación autolítica/muerte) fue positivo. Se requiere evaluación de riesgo inmediata." : "Nota: No se reportó ideación suicida o de autolesión en el ítem 9."}
`;

    // 5. Enviar datos
    onFinish({
      textoInforme: informe,
      raw: answers, // Enviamos el array crudo para el visor
      resumen: { puntaje: totalScore, nivel: severidad },
      titulo: 'Resultados PHQ-9 (Depresión)'
    });
  };

  const progress = Math.round((answers.filter(a => a !== -1).length / 9) * 100);

  return (
    <div style={{animation: 'fadeIn 0.5s', maxWidth: '800px', margin: '0 auto'}}>
      {/* HEADER */}
      <div style={{marginBottom: '30px', textAlign: 'center'}}>
        <h2 style={{color: '#8b5cf6', fontFamily: 'Rajdhani', fontSize: '2rem', margin: 0}}>PROTOCOLO PHQ-9</h2>
        <div style={{color: '#94a3b8', fontSize: '0.9rem'}}>CUESTIONARIO DE SALUD DEL PACIENTE</div>
      </div>

      {/* BARRA PROGRESO */}
      <div style={{width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', marginBottom: '30px', borderRadius: '2px'}}>
         <div style={{width: `${progress}%`, height: '100%', background: '#8b5cf6', transition: 'width 0.3s ease', borderRadius: '2px'}}></div>
      </div>

      {/* LISTA PREGUNTAS */}
      <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
        {PHQ9_QUESTIONS.map((q, idx) => (
          <div key={idx} style={{
              background: 'rgba(30, 41, 59, 0.6)', 
              padding: '20px', 
              borderRadius: '12px',
              borderLeft: answers[idx] !== -1 ? '4px solid #8b5cf6' : '4px solid transparent',
              border: '1px solid rgba(148, 163, 184, 0.1)'
          }}>
            <p style={{color: '#e2e8f0', margin: '0 0 15px 0', fontSize: '1.1rem'}}>
               <span style={{color: '#8b5cf6', fontWeight: 'bold'}}>{idx + 1}.</span> {q}
            </p>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px'}}>
              {OPTIONS.map((opt) => (
                <button
                  key={opt.valor}
                  onClick={() => handleSelect(idx, opt.valor)}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: answers[idx] === opt.valor ? '1px solid #8b5cf6' : '1px solid rgba(148, 163, 184, 0.2)',
                    background: answers[idx] === opt.valor ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                    color: answers[idx] === opt.valor ? 'white' : '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div style={{display: 'flex', gap: '20px', marginTop: '40px', justifyContent: 'flex-end'}}>
        <button onClick={onCancel} style={{background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'}}>
            CANCELAR
        </button>
        <button 
          onClick={calcularResultado} 
          disabled={progress < 100}
          style={{
            background: progress < 100 ? 'gray' : '#8b5cf6',
            border: 'none',
            color: 'white',
            padding: '12px 30px',
            borderRadius: '8px',
            cursor: progress < 100 ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            boxShadow: progress === 100 ? '0 0 20px rgba(139, 92, 246, 0.4)' : 'none'
          }}
        >
          {progress < 100 ? 'FALTAN RESPUESTAS' : 'FINALIZAR'}
        </button>
      </div>
    </div>
  );
};