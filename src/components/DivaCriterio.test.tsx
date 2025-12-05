import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DivaCriterio } from './DivaCriterio';

describe('DivaCriterio', () => {
  const propsPrueba = {
    titulo: "Criterio A1",
    pregunta: "¿A menudo comete errores por descuido en las tareas?",
    // NUEVO: Agregamos una lista de ejemplos
    ejemplos: [
        "Comete errores por falta de atención",
        "Deja el trabajo sin revisar",
        "Necesita mucho tiempo para los detalles"
    ],
    onRespuestaAdultez: vi.fn(), 
    onRespuestaInfancia: vi.fn()
  };

  it('debe mostrar el título y la pregunta', () => {
    render(<DivaCriterio {...propsPrueba} />);
    expect(screen.getByText(propsPrueba.titulo)).toBeInTheDocument();
    expect(screen.getByText(propsPrueba.pregunta)).toBeInTheDocument();
  });

  // NUEVO TEST: Verificamos que los ejemplos aparecen
  it('debe renderizar la lista de ejemplos', () => {
    render(<DivaCriterio {...propsPrueba} />);
    
    // Verificamos que cada ejemplo esté en el documento
    propsPrueba.ejemplos.forEach(ejemplo => {
        expect(screen.getByText(ejemplo)).toBeInTheDocument();
    });
  });

  it('debe permitir responder para Vida Adulta', () => {
    render(<DivaCriterio {...propsPrueba} />);
    const botonSiAdulto = screen.getByLabelText('Sí en Vida Adulta');
    fireEvent.click(botonSiAdulto);
    expect(propsPrueba.onRespuestaAdultez).toHaveBeenCalledWith(true);
  });

  it('debe permitir responder para Infancia', () => {
    render(<DivaCriterio {...propsPrueba} />);
    const botonNoInfancia = screen.getByLabelText('No en Infancia');
    fireEvent.click(botonNoInfancia);
    expect(propsPrueba.onRespuestaInfancia).toHaveBeenCalledWith(false);
  });
});