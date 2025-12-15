// src/shared/types/core.ts

// 1. ROLES DEL SISTEMA (Seguridad)
export type UserRole = 'admin' | 'psicologo' | 'paciente';

// 2. ECONOMÍA GAMIFICADA (Protocolo Artemisa)
export interface EconomyProfile {
    nexos: number;       // Moneda Premium (Obtenida por asistencia)
    gold: number;        // Moneda Gratuita (Obtenida por tareas diarias)
    xp: number;          // Puntos de Experiencia
    level: number;       // Nivel del usuario (Calculado por XP)
}

// 3. ESTADÍSTICAS DE SALUD MENTAL (Modelo ACT/Hexaflex)
export interface PatientStats {
    autocuidado: number; // Ej: Dormir, comer bien
    crecimiento: number; // Ej: Leer, aprender
    vinculacion: number; // Ej: Socializar
}

// 4. ESTADO DE SUSCRIPCIÓN (La Regla del 41 - Finanzas)
// active: Todo normal.
// soft-lock: Excedió citas contratadas (Modo lectura).
// hard-lock: Falta de pago (Acceso denegado).
export type SubscriptionStatus = 'active' | 'soft-lock' | 'hard-lock';

// 5. PERFIL DE USUARIO MAESTRO
export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role: UserRole;
    
    // --- CAMPOS ESPECÍFICOS DE PSICÓLOGO ---
    professionalLicense?: string; // Cédula (Requerido por Legal)
    subscriptionTier?: 'basic' | 'pro' | 'enterprise';
    maxPatients?: number;         // Límite del plan
    subscriptionStatus?: SubscriptionStatus;
    
    // --- CAMPOS ESPECÍFICOS DE PACIENTE ---
    psychologistId?: string;      // Vinculación con su terapeuta
    stats?: PatientStats;
    economy?: EconomyProfile;
    
    // --- METADATOS ---
    createdAt: number; // Timestamp
    isActive: boolean;
}