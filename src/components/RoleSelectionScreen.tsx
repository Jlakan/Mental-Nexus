// src/components/RoleSelectionScreen.tsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Ajusta la ruta si es necesario

// Definiciones de Tipos (Replicamos los tipos para claridad, o los importarías de un archivo de tipos)
type HighLevelRoleType = 'profesional' | 'paciente';
type ProfessionalType = 'psicologo' | 'nutriologo' | 'psiquiatra' | 'otro';

const professionalOptions: ProfessionalType[] = ['psicologo', 'nutriologo', 'psiquiatra', 'otro'];

const RoleSelectionScreen: React.FC = () => {
  const { currentUser, loading, completeRegistrationWithRole } = useAuth();
  
  // Estados para la selección
  const [selectedRole, setSelectedRole] = useState<HighLevelRoleType | null>(null);
  const [selectedProfessionalType, setSelectedProfessionalType] = useState<ProfessionalType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading || !currentUser) {
    // Esto se maneja mejor en el router, pero es un buen fallback.
    return <div>Cargando...</div>; 
  }

  const handleSubmit = async () => {
    if (!selectedRole) {
      setError("Por favor, selecciona tu rol principal (Profesional o Paciente).");
      return;
    }
    
    if (selectedRole === 'profesional' && !selectedProfessionalType) {
      setError("Por favor, selecciona tu tipo de profesional.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      await completeRegistrationWithRole(selectedRole, selectedProfessionalType || undefined);
      // Redirección ocurrirá automáticamente porque isProfileSetupRequired cambiará a false
      
    } catch (e) {
      setError("Fallo al completar el registro. Inténtalo de nuevo.");
      console.error(e);
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
      <h2>¡Bienvenido, {currentUser.displayName || 'nuevo usuario'}!</h2>
      <p>Antes de continuar, por favor dinos si eres un profesional o un paciente.</p>

      {/* Selector de Rol Principal */}
      <fieldset style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '15px' }}>
        <legend>Soy:</legend>
        <label style={{ display: 'block', marginBottom: '8px' }}>
          <input 
            type="radio" 
            name="role" 
            value="profesional" 
            checked={selectedRole === 'profesional'}
            onChange={() => {
              setSelectedRole('profesional');
              setSelectedProfessionalType(null); // Resetear sub-rol
              setError(null);
            }} 
            disabled={isSubmitting}
          /> Profesional
        </label>
        <label style={{ display: 'block' }}>
          <input 
            type="radio" 
            name="role" 
            value="paciente" 
            checked={selectedRole === 'paciente'}
            onChange={() => {
              setSelectedRole('paciente');
              setSelectedProfessionalType(null); // Asegurar que no se selecciona un sub-rol
              setError(null);
            }} 
            disabled={isSubmitting}
          /> Paciente
        </label>
      </fieldset>

      {/* Selector de Tipo de Profesional (Condicional) */}
      {selectedRole === 'profesional' && (
        <fieldset style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '15px' }}>
          <legend>Mi especialidad es:</legend>
          <select 
            value={selectedProfessionalType || ''}
            onChange={(e) => setSelectedProfessionalType(e.target.value as ProfessionalType)}
            disabled={isSubmitting}
            style={{ width: '100%', padding: '8px' }}
          >
            <option value="">-- Seleccionar --</option>
            {professionalOptions.map(type => (
              <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
            ))}
          </select>
        </fieldset>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button 
        onClick={handleSubmit} 
        disabled={isSubmitting || !selectedRole || (selectedRole === 'profesional' && !selectedProfessionalType)}
        style={{ padding: '10px 20px', backgroundColor: isSubmitting ? '#aaa' : '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}
      >
        {isSubmitting ? 'Registrando...' : 'Completar Registro'}
      </button>
    </div>
  );
};

export default RoleSelectionScreen;