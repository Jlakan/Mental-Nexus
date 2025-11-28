// src/game/GameAssets.ts

// ==========================================
// 1. CONFIGURACIÓN MATEMÁTICA (NIVEL DE JUGADOR)
// ==========================================
export const XP_POR_HABITO = 10;

// Tabla de Nivel Global (Jugador)
export const TABLA_NIVELES = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3300, 4000, 4800, 5700, 6700, 7800, 9000, 10300, 11700, 13200, 14800, 16500, 18300, 20200, 22200];

export const obtenerNivel = (xp: number) => {
  for (let i = TABLA_NIVELES.length - 1; i >= 0; i--) if (xp >= TABLA_NIVELES[i]) return i + 1;
  return 1;
};
export const obtenerMetaSiguiente = (nivelActual: number) => {
  if (nivelActual >= TABLA_NIVELES.length) return TABLA_NIVELES[TABLA_NIVELES.length - 1] + ((nivelActual - TABLA_NIVELES.length + 1) * 2500);
  return TABLA_NIVELES[nivelActual];
};

// ==========================================
// 2. NUEVA MATEMÁTICA PARA STATS (MAESTRÍA)
// ==========================================
export const MAESTRIA_POR_HABITO = 15; // 15% de un nivel básico

// Calcula el Nivel del Stat y el progreso actual basado en puntos totales de maestría
export const calcularDetalleStat = (puntosTotales: number) => {
    let nivel = 0;
    let costoSiguiente = 100; // Costo inicial (Niveles 0-5)
    let puntosRestantes = puntosTotales;

    // Bucle para "gastar" los puntos y subir de nivel
    while (true) {
        // Definir la curva de dificultad
        if (nivel < 5) costoSiguiente = 100;        // Principiante (7 hábitos)
        else if (nivel < 10) costoSiguiente = 200;  // Intermedio (14 hábitos)
        else if (nivel < 20) costoSiguiente = 400;  // Experto
        else costoSiguiente = 800;                  // Maestro

        if (puntosRestantes >= costoSiguiente) {
            puntosRestantes -= costoSiguiente;
            nivel++;
        } else {
            break; // No alcanza para subir más
        }
    }

    // Calculamos porcentaje de la barra actual
    const porcentaje = Math.floor((puntosRestantes / costoSiguiente) * 100);

    return {
        nivel: nivel,            // El número grande (Ej: 5)
        progreso: porcentaje,    // La barrita (Ej: 45%)
        actual: puntosRestantes, // Texto pequeño (45/100)
        meta: costoSiguiente
    };
};

// ==========================================
// 3. TIPOS DE DATOS
// ==========================================
export type PersonajeTipo = 'atlas' | 'explorador_demo'; 
export type StatTipo = 'vitalidad' | 'sabiduria' | 'vinculacion' | 'gold' | 'nexo';

export interface GameItem {
  id: string; nombre: string; precio: number; emoji: string; tipo: 'arma' | 'ropa' | 'accesorio' | 'mascota'; descripcion: string;
  reqStat?: { type: StatTipo; valor: number }; 
}

export interface EtapaEvolucion {
    nivelMinimo: number; nombreClase: string; lema: string; descripcionVisual: string; imagen: string; 
}

export interface AvatarDef {
  id: PersonajeTipo; nombre: string; lemaPrincipal: string; descripcion: string;
  statsBase: { vitalidad: number; sabiduria: number; vinculacion: number };
  etapas: EtapaEvolucion[];
  tiendaExclusiva: GameItem[];
}

export const obtenerEtapaActual = (personaje: AvatarDef, nivelPaciente: number) => {
    const etapasDesbloqueadas = personaje.etapas.filter(e => nivelPaciente >= e.nivelMinimo);
    return etapasDesbloqueadas[etapasDesbloqueadas.length - 1] || personaje.etapas[0];
};

// ==========================================
// 4. CONFIGURACIÓN VISUAL
// ==========================================
export const STATS_CONFIG = {
  vitalidad: { label: "Integridad del Sistema", icon: "/vitalidad.png", desc: "Mantenimiento del motor biológico.", color: "#EF4444" },
  sabiduria: { label: "Capital de I+D", icon: "/desarrollo.png", desc: "Inversión en capacidades intelectuales.", color: "#3B82F6" },
  vinculacion: { label: "Vinculación de Red", icon: "/socializacion.png", desc: "Gestión de activos humanos.", color: "#F59E0B" },
  gold: { label: "Fondos Operativos", icon: "/recursos.png", desc: "Liquidez para el mercado.", color: "#FBBF24" },
  nexo: { label: "Nexo de Sincronización", icon: "/nexo.png", desc: "Vínculo terapéutico de alto valor.", color: "#8B5CF6" }
};

// ==========================================
// 5. PERSONAJES
// ==========================================
export const PERSONAJES: Record<PersonajeTipo, AvatarDef> = {
  atlas: {
    id: 'atlas', nombre: 'Atlas Vance', lemaPrincipal: 'El Auditor del Caos',
    descripcion: 'Atlas realiza una auditoría hostil a las fuerzas del mal.',
    // Stats Base (Niveles iniciales)
    statsBase: { vitalidad: 1, sabiduria: 3, vinculacion: 3 },
    etapas: [
        { nivelMinimo: 1, nombreClase: "Consultor Táctico", lema: "Mis tarifas son altas.", descripcionVisual: "Traje sastre oscuro.", imagen: "/atlas_1.mp4" },
        { nivelMinimo: 5, nombreClase: "Director de Operaciones", lema: "Reestructurando conflicto.", descripcionVisual: "Chaleco ejecutivo.", imagen: "/atlas_2.mp4" },
        { nivelMinimo: 12, nombreClase: "CEO Ejecutivo", lema: "Liquidación de pasivos.", descripcionVisual: "Traje blanco.", imagen: "/atlas_3.mp4" },
        { nivelMinimo: 20, nombreClase: "Arquitecto del Sistema", lema: "Realidad optimizada.", descripcionVisual: "Traje de luz.", imagen: "/atlas_4.mp4" }
    ],
    tiendaExclusiva: [
      { id: 'stylus', nombre: 'Stylus de Mando', precio: 50, emoji: '🖊️', tipo: 'arma', descripcion: 'Órdenes básicas.' },
      { id: 'traje', nombre: 'Traje Sastre', precio: 100, emoji: '👔', tipo: 'ropa', descripcion: 'Impecable.', reqStat: { type: 'vinculacion', valor: 5 } }
    ]
  },
  explorador_demo: {
    id: 'explorador_demo', nombre: 'Explorador', lemaPrincipal: 'Siempre adelante', descripcion: 'Demo.',
    statsBase: { vitalidad: 1, sabiduria: 1, vinculacion: 1 },
    etapas: [{ nivelMinimo: 1, nombreClase: "Caminante", lema: "Hola", descripcionVisual: "Normal", imagen: "/logo.jpg" }],
    tiendaExclusiva: []
  }
};