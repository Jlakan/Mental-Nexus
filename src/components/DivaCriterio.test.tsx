import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DivaCriterio } from './DivaCriterio';

describe('DivaCriterio', () => {
  // Datos de prueba actualizados a la nueva estructura (Adultez + Infancia)
  const propsPrueba = {
    titulo: "Criterio A1",
    pregunta: "¿A menudo comete errores?",
    ejemplosAdulto: ["Ejemplo Adulto 1", "Ejemplo Adulto 2"],
    ejemplosInfancia: ["Ejemplo Infancia 1", "Ejemplo Infancia 2"],
    onChangeAdultez: vi.fn(),
    onChangeInfancia: vi.fn()
  };

  it('debe renderizar el título y la pregunta', () => {
    render(<DivaCriterio {...propsPrueba} />);
    
    expect(screen.getByText(propsPrueba.titulo)).toBeInTheDocument();
    expect(screen.getByText(propsPrueba.pregunta)).toBeInTheDocument();
  });

  it('debe mostrar las secciones de Vida Adulta e Infancia', () => {
    render(<DivaCriterio {...propsPrueba} />);

    // Verificamos que los textos de las columnas aparezcan
    expect(screen.getByText(/VIDA ADULTA/i)).toBeInTheDocument();
    expect(screen.getByText(/INFANCIA/i)).toBeInTheDocument();
  });

  it('debe renderizar los ejemplos correctamente', () => {
    render(<DivaCriterio {...propsPrueba} />);

    expect(screen.getByText("Ejemplo Adulto 1")).toBeInTheDocument();
    expect(screen.getByText("Ejemplo Infancia 1")).toBeInTheDocument();
  });
});