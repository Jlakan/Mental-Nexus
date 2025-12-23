// --- CONSTANTES ---

export const INITIAL_PLAYER_PROFILE = {
    level: 1,
    currentXP: 0,
    nextLevelXP: 100, // XP necesaria para el nivel 2
    wallet: {
      nexus: 0, // Moneda principal (asistencia)
      gems: 0   // Moneda premium (logros especiales)
    },
    streak: {
      current: 0,
      max: 0,
      lastLogin: null
    },
    badges: [], // Medallas ganadas
    inventory: [] // Items comprados
  };
  
  // --- FUNCIONES MATEMÁTICAS ---
  
  export const calculateLevel = (xp: number): number => {
    if (xp === 0) return 1;
    // Fórmula simple: Nivel = 1 + Raíz cuadrada de (XP * factor)
    // Ajusta el 0.1 si quieres que suban más rápido o lento
    return Math.floor(1 + Math.sqrt(xp) * 0.1);
  };
  
  export const xpForNextLevel = (currentLevel: number): number => {
    // Fórmula inversa para saber cuánta XP total necesitas para el siguiente nivel
    return Math.pow((currentLevel) / 0.1, 2);
  };