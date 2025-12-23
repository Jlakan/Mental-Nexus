import { collection, getDocs } from "firebase/firestore";

// Definición de tipos
export interface GamificationProfile {
    xp: number;
    level: number;
    rank: string;
    wallet: {
        nexus: number;
    };
    stats: {
        tasksCompleted: number;
        streakDays: number;
    };
}

// ESTA ES LA CONSTANTE QUE TU ARCHIVO DE REGISTRO ESTÁ BUSCANDO
export const INITIAL_PLAYER_PROFILE: GamificationProfile = {
    xp: 0,
    level: 1,
    rank: "Novato",
    wallet: {
        nexus: 0 
    },
    stats: {
        tasksCompleted: 0,
        streakDays: 0
    }
};

// Función auxiliar para calcular nivel
export const calculateLevel = (xp: number): number => {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
};