// src/utils/GamificationUtils.ts

// 1. Perfil Inicial del Jugador
export const INITIAL_PLAYER_PROFILE = {
    level: 1,
    currentXp: 0, // Nota: En PatientDashboard usas 'currentXp' (camelCase), asegurémonos que coincida.
    nextLevelXP: 100, 
    wallet: {
      nexus: 0, // Moneda principal (asistencia)
      gold: 0,  // Oro (recompensas)
      gems: 0   // Moneda premium
    },
    streak: {
      current: 0,
      max: 0,
      lastLogin: null
    },
    stats: {
      str: 0, // Fuerza (Voluntad)
      int: 0, // Intelecto (Cognición)
      sta: 0, // Resistencia (Emocional)
      cha: 0  // Carisma (Social)
    },
    badges: [], 
    inventory: [] 
  };
  
  // 2. Calcular Nivel Actual basado en XP Total
  export const calculateLevel = (xp: number): number => {
    if (!xp || xp === 0) return 1;
    // Fórmula simple: Nivel = 1 + Raíz cuadrada de (XP * factor)
    // Math.floor redondea hacia abajo (ej: 1.9 -> Nivel 1)
    return Math.floor(1 + Math.sqrt(xp) * 0.1);
  };
  
  // 3. Calcular XP necesaria para el Siguiente Nivel
  export const xpForNextLevel = (currentLevel: number): number => {
    // Fórmula inversa para saber cuánta XP total necesitas para el nivel X
    // Si estoy en nivel 1, quiero saber la meta para el 2 (por eso se pasa el nivel actual para calcular el tope de ese nivel o el inicio del siguiente)
    // Ajuste: Para llegar al nivel 2, necesito la XP de nivel 1? No, necesito el techo.
    // Usamos el nivel actual como base para calcular el techo del siguiente.
    return Math.pow((currentLevel) / 0.1, 2);
  };