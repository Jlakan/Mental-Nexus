import React, { useState, useEffect } from 'react';
import '../screens/ClinicalTests.css';

export type ResultadoDiva = {
  cumple: boolean | null;
  evidencias: string[];
};

interface Props {
  titulo: string;
  pregunta: string;
  ejemplosAdulto: string[];
  ejemplosInfancia: string[];
  onChangeAdultez: (res: ResultadoDiva) => void;
  onChangeInfancia: (res: ResultadoDiva) => void;
}

export const DivaCriterio: React.FC<Props> = ({ 
  titulo, 
  pregunta,
  ejemplosAdulto,
  ejemplosInfancia,
  onChangeAdultez, 
  onChangeInfancia 
}) => {
  const [checksAdulto, setChecksAdulto] = useState<string[]>([]);
  const [ningunoAdulto, setNingunoAdulto] = useState(false);
  const [checksInfancia, setChecksInfancia] = useState<string[]>([]);
  const [ningunoInfancia, setNingunoInfancia] = useState(false);

  useEffect(() => {
    setChecksAdulto([]); setNingunoAdulto(false);
    setChecksInfancia([]); setNingunoInfancia(false);
  }, [titulo]);

  useEffect(() => {
    let cumple: boolean | null = null;
    if (ningunoAdulto) cumple = false;
    else if (checksAdulto.length > 0) cumple = true;
    onChangeAdultez({ cumple, evidencias: checksAdulto });
  }, [checksAdulto, ningunoAdulto]);

  useEffect(() => {
    let cumple: boolean | null = null;
    if (ningunoInfancia) cumple = false;
    else if (checksInfancia.length > 0) cumple = true;
    onChangeInfancia({ cumple, evidencias: checksInfancia });
  }, [checksInfancia, ningunoInfancia]);

  const toggleSintoma = (texto: string, etapa: 'adulto' | 'infancia') => {
    if (etapa === 'adulto') {
      setNingunoAdulto(false);
      setChecksAdulto(prev => prev.includes(texto) ? prev.filter(t => t !== texto) : [...prev, texto]);
    } else {
      setNingunoInfancia(false);
      setChecksInfancia(prev => prev.includes(texto) ? prev.filter(t => t !== texto) : [...prev, texto]);
    }
  };

  const toggleNinguno = (etapa: 'adulto' | 'infancia') => {
    if (etapa === 'adulto') {
      const v = !ningunoAdulto; setNingunoAdulto(v); if(v) setChecksAdulto([]);
    } else {
      const v = !ningunoInfancia; setNingunoInfancia(v); if(v) setChecksInfancia([]);
    }
  };

  const renderColumna = (
    tituloCol: string, 
    items: string[], 
    seleccionados: string[], 
    esNinguno: boolean, 
    etapa: 'adulto'|'infancia'
  ) => {
    const estado = esNinguno ? 'negativo' : (seleccionados.length > 0 ? 'positivo' : 'neutro');
    const claseEtapa = etapa === 'adulto' ? 'stage-adulto' : 'stage-infancia';
    
    return (
      <div className={`stage-card ${claseEtapa}`}>
        <div className="stage-header">
          <span className="stage-title" style={{ color: etapa==='adulto' ? '#f59e0b' : '#3b82f6' }}>
            {tituloCol}
          </span>
          {estado === 'positivo' && <span className="status-badge status-yes">PRESENTE</span>}
          {estado === 'negativo' && <span className="status-badge status-no">AUSENTE</span>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
          {items.map((item, i) => {
            const isActive = seleccionados.includes(item);
            return (
              <div 
                key={i} 
                className={`option-row ${isActive ? 'active' : ''}`}
                onClick={() => !esNinguno && toggleSintoma(item, etapa)}
                style={{ opacity: esNinguno ? 0.5 : 1, cursor: esNinguno ? 'not-allowed' : 'pointer' }}
              >
                <div className="checkbox-box">{isActive && "✓"}</div>
                <span style={{ fontSize: '0.95rem', lineHeight: '1.4' }}>{item}</span>
              </div>
            );
          })}
        </div>

        {/* Opción Ninguno */}
        <div 
          className={`option-row is-none ${esNinguno ? 'active' : ''}`} 
          onClick={() => toggleNinguno(etapa)}
        >
           <div className="checkbox-box">{esNinguno && "✕"}</div>
           <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>NINGUNO / NO PRESENTA</span>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-panel">
      {/* HEADER TIPO PANEL */}
      <div className="panel-header">
        <div className="panel-title">MÓDULO DE DIAGNÓSTICO // {titulo}</div>
        <h2 className="question-text">{pregunta}</h2>
      </div>

      {/* GRID DE COLUMNAS (Siempre 2 columnas gracias al CSS Grid) */}
      <div className="columns-grid">
        {renderColumna("VIDA ADULTA", ejemplosAdulto, checksAdulto, ningunoAdulto, 'adulto')}
        {renderColumna("INFANCIA", ejemplosInfancia, checksInfancia, ningunoInfancia, 'infancia')}
      </div>
    </div>
  );
};