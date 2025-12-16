// src/types/index.ts

import { Timestamp } from "firebase/firestore"; // Asegúrate de importar Timestamp si lo necesitas para otros tipos

// =================================================================
// INTERFAZ DE PERFIL DE USUARIO (Estructura Canónica)
// =================================================================
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  
  // Campo clave: 'rol' para mantener la compatibilidad con el código existente.
  rol: 'admin' | 'psicologo' | 'paciente'; 
  
  // Banderas de Seguridad y Flujo
  isAuthorized?: boolean; // false por defecto en la BD
  
  // Vinculación
  codigoVinculacion?: string; // Usado solo por 'psicologo' (u otro profesional)
  psicologoId?: string;       // Usado solo por 'paciente' (ID del terapeuta)
  
  // Campos de Trazabilidad
  createdAt: Timestamp | any; // Usamos Timestamp o 'any' para compatibilidad con la DB
}

// =================================================================
// DEJA OTRAS INTERFACES (Habito, HistorialSemanal, etc.) ABAJO:
// =================================================================

// export interface Habito { 
//   // ... tus campos existentes 
// } 

// export interface HistorialSemanal {
//   // ... tus campos existentes
// }