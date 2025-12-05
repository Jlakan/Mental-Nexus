import React, { useState } from 'react';
// Importamos el componente que acabamos de revisar
import { ClinicalTestsScreen } from '../screens/ClinicalTestsScreen';

export const DivaLab = () => {
  const [showTest, setShowTest] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: 'white', padding: '40px' }}>
      <h1>🧪 Laboratorio DIVA-5</h1>
      
      {!showTest ? (
        <button 
          onClick={() => setShowTest(true)}
          style={{ padding: '15px 30px', fontSize: '1.2rem', cursor: 'pointer', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px' }}
        >
          INICIAR TEST
        </button>
      ) : (
        <ClinicalTestsScreen 
          onFinish={() => alert("¡Funcionó!")} 
          onCancel={() => setShowTest(false)} 
        />
      )}
    </div>
  );
};