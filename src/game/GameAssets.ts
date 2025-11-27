// src/game/GameAssets.ts

// ==========================================
// 1. CONFIGURACIÓN MATEMÁTICA
// ==========================================
export const XP_POR_HABITO = 10;
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
// 2. TIPOS DE DATOS
// ==========================================
export type PersonajeTipo = 'atlas' | 'explorador_demo'; 
export type StatTipo = 'vitalidad' | 'sabiduria' | 'vinculacion' | 'gold' | 'nexo'; // Cambio carisma -> vinculacion

export interface GameItem {
  id: string;
  nombre: string;
  precio: number;
  emoji: string;
  tipo: 'arma' | 'ropa' | 'accesorio' | 'mascota';
  descripcion: string;
  reqStat?: { type: StatTipo; valor: number }; 
}

export interface EtapaEvolucion {
    nivelMinimo: number;
    nombreClase: string;
    lema: string;
    descripcionVisual: string;
    imagen: string; 
}

export interface AvatarDef {
  id: PersonajeTipo;
  nombre: string;
  lemaPrincipal: string;
  descripcion: string;
  statsBase: { vitalidad: number; sabiduria: number; vinculacion: number };
  etapas: EtapaEvolucion[];
  tiendaExclusiva: GameItem[];
}

export const obtenerEtapaActual = (personaje: AvatarDef, nivelPaciente: number) => {
    const etapasDesbloqueadas = personaje.etapas.filter(e => nivelPaciente >= e.nivelMinimo);
    return etapasDesbloqueadas[etapasDesbloqueadas.length - 1] || personaje.etapas[0];
};

// ==========================================
// 3. CONFIGURACIÓN DE STATS
// ==========================================
export const STATS_CONFIG = {
  vitalidad: {
    label: "Integridad del Sistema",
    icon: "/vitalidad.png",
    desc: "Un corazón biomecánico. Mantenimiento del motor biológico.",
    color: "#EF4444" // Rojo neón
  },
  sabiduria: {
    label: "Capital de I+D",
    icon: "/desarrollo.png",
    desc: "Inversión en nuevas capacidades intelectuales.",
    color: "#3B82F6" // Azul neón
  },
  vinculacion: { // CAMBIO DE NOMBRE
    label: "Vinculación de Red",
    icon: "/socializacion.png",
    desc: "Conexiones estratégicas y gestión de activos humanos.",
    color: "#F59E0B" // Ámbar neón
  },
  gold: {
    label: "Fondos Operativos",
    icon: "/recursos.png",
    desc: "Liquidez necesaria para adquirir activos.",
    color: "#FBBF24" // Dorado
  },
  nexo: {
    label: "Nexo de Sincronización",
    icon: "/nexo.png",
    desc: "Unidad de vínculo terapéutico de alto valor.",
    color: "#8B5CF6" // Violeta
  }
};

// ==========================================
// 4. CATÁLOGO DE PERSONAJES
// ==========================================
export const PERSONAJES: Record<PersonajeTipo, AvatarDef> = {
  atlas: {
    id: 'atlas',
    nombre: 'Atlas Vance',
    lemaPrincipal: 'El Auditor del Caos',
    descripcion: '¿Por qué ensuciarse las manos cuando puedes reprogramar la realidad?',
    statsBase: { vitalidad: 1, sabiduria: 3, vinculacion: 3 }, // carisma -> vinculacion
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
    id: 'explorador_demo',
    nombre: 'Explorador',
    lemaPrincipal: 'Siempre adelante',
    descripcion: 'Demo.',
    statsBase: { vitalidad: 1, sabiduria: 1, vinculacion: 1 },
    etapas: [{ nivelMinimo: 1, nombreClase: "Caminante", lema: "Hola", descripcionVisual: "Normal", imagen: "/logo.jpg" }],
    tiendaExclusiva: []
  }
};