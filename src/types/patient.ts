import { Timestamp } from 'firebase/firestore';

// Tipos de Motores y Proveedores
export type TherapyMode = 'tcc' | 'act'; 
export type ProviderType = 'psicologo' | 'nutriologo' | 'entrenador' | 'medico' | 'maestro';

// 📊 LOS ATRIBUTOS DEL HÉROE (Stats)
// Aquí definimos todas las habilidades posibles del paciente
export interface HeroStats {
  // Los 3 pilares del Psicólogo
  autocuidado: number;
  desarrollo: number;
  vinculacion: number;

  // Stats RPG clásicos (para compatibilidad futura con otros profesionales)
  vitality: number;
  wisdom: number;
  social: number;
  resilience: number;
  strength: number;
}

// 📜 DEFINICIÓN DE LA TAREA (QUEST)
export interface Quest {
  id: string;
  title: string;           
  description: string;
  statReward: 'autocuidado' | 'desarrollo' | 'vinculacion'; // ¿Qué sube al completarla?
  xpReward: number;        
  goldReward: number;      
  frequency: 'diario' | 'semanal' | 'unico';
  
  // Tiempos
  assignedAt: Timestamp;
  expiresAt: Timestamp;    // El "Soft Lock" (Fecha de caducidad)
  
  // Estado
  completed: boolean;      
  streak: number;          
}

// 🧬 EL PACIENTE COMPLETO
export interface Patient {
  id: string; 
  
  // Datos Personales
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  avatarUrl?: string; 
  
  // 🔗 CONEXIÓN CON EL ECOSISTEMA
  linkedUserUid?: string; // Si ya tiene usuario real en la App
  
  // 🏥 Datos Administrativos
  therapistId: string; 
  providerType: ProviderType; 
  therapyMode: TherapyMode; 
  active: boolean;

  // 🎮 GAMIFICACIÓN
  level: number;
  currentXP: number;
  nextLevelXP: number;
  
  // 💰 ECONOMÍA
  nexos: number; // Moneda Premium
  gold: number;  // Moneda Común
  
  // 📈 ESTADÍSTICAS (El Radar)
  stats: HeroStats; 

  // ⚔️ MISIONES ACTIVAS
  activeQuests: Quest[];

  // 🎒 INVENTARIO
  inventory: string[]; 

  createdAt: Timestamp;
  updatedAt: Timestamp;
}