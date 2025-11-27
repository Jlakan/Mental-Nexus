// src/game/GameAssets.ts

// ==========================================
// 1. CONFIGURACIÓN MATEMÁTICA
// ==========================================
export const XP_POR_HABITO = 10;

export const TABLA_NIVELES = [
  0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 
  3300, 4000, 4800, 5700, 6700, 7800, 9000, 10300, 11700, 13200, 
  14800, 16500, 18300, 20200, 22200
];

export const obtenerNivel = (xp: number) => {
  for (let i = TABLA_NIVELES.length - 1; i >= 0; i--) {
    if (xp >= TABLA_NIVELES[i]) return i + 1;
  }
  return 1;
};

export const obtenerMetaSiguiente = (nivelActual: number) => {
  if (nivelActual >= TABLA_NIVELES.length) {
    return TABLA_NIVELES[TABLA_NIVELES.length - 1] + ((nivelActual - TABLA_NIVELES.length + 1) * 2500);
  }
  return TABLA_NIVELES[nivelActual];
};

// ==========================================
// 2. TIPOS DE DATOS
// ==========================================

export type PersonajeTipo = 'atlas' | 'explorador_demo'; 
// Agregamos 'nexo' a los tipos de stats
export type StatTipo = 'vitalidad' | 'sabiduria' | 'carisma' | 'gold' | 'nexo';

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
  statsBase: { vitalidad: number; sabiduria: number; carisma: number };
  etapas: EtapaEvolucion[];
  tiendaExclusiva: GameItem[];
}

export const obtenerEtapaActual = (personaje: AvatarDef, nivelPaciente: number) => {
    const etapasDesbloqueadas = personaje.etapas.filter(e => nivelPaciente >= e.nivelMinimo);
    return etapasDesbloqueadas[etapasDesbloqueadas.length - 1] || personaje.etapas[0];
};

// ==========================================
// 3. CONFIGURACIÓN DE STATS (ICONOS Y TEXTOS)
// ==========================================
export const STATS_CONFIG = {
  vitalidad: {
    label: "Integridad del Sistema",
    icon: "/vitalidad.png", // Corazón biomecánico
    desc: "Un corazón biomecánico. Atlas no tiene sentimientos, tiene un 'motor biológico' que requiere mantenimiento."
  },
  sabiduria: {
    label: "Capital de I+D",
    icon: "/desarrollo.png", // Cerebro circuitos
    desc: "Un cerebro de circuitos. Atlas invierte en Investigación y Desarrollo de nuevas capacidades intelectuales."
  },
  carisma: {
    label: "Apalancamiento de Red",
    icon: "/socializacion.png", // Nodos red
    desc: "Nodos conectados. Atlas gestiona una red de contactos estratégicos y activos humanos externos."
  },
  gold: {
    label: "Fondos Operativos",
    icon: "/recursos.png", // Moneda hexagonal
    desc: "Liquidez necesaria para adquirir activos y mejoras en el mercado negro."
  },
  nexo: {
    label: "Nexo de Sincronización",
    icon: "/nexo.png", // Cristal/Átomo
    desc: "Unidad de vínculo terapéutico de alto valor. Se obtiene mediante la asistencia a sesiones y el cumplimiento de hitos semanales."
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
    descripcion: '¿Por qué ensuciarse las manos cuando puedes reprogramar la realidad? Atlas realiza una auditoría hostil a las fuerzas del mal.',
    statsBase: { vitalidad: 1, sabiduria: 3, carisma: 3 },
    
    etapas: [
        {
            nivelMinimo: 1,
            nombreClase: "Consultor Táctico",
            lema: "Mis tarifas son altas, pero el costo del fracaso es mayor.",
            descripcionVisual: "Traje sastre oscuro impecable. Maletín Aegis en mano.",
            imagen: "/atlas_1.mp4"
        },
        {
            nivelMinimo: 5,
            nombreClase: "Director de Operaciones",
            lema: "Estoy reestructurando este conflicto. Ustedes son personal redundante.",
            descripcionVisual: "Chaleco ejecutivo. Maletín flotante con holomapa.",
            imagen: "/atlas_2.mp4"
        },
        {
            nivelMinimo: 12,
            nombreClase: "CEO Ejecutivo",
            lema: "Su existencia es un pasivo en mi balance general. Procedo a la liquidación.",
            descripcionVisual: "Traje blanco inmaculado. Androide guardaespaldas.",
            imagen: "/atlas_3.mp4"
        },
        {
            nivelMinimo: 20,
            nombreClase: "Arquitecto del Sistema Ápex",
            lema: "La realidad ha sido optimizada. La resistencia es irrelevante.",
            descripcionVisual: "Traje con circuitos de luz. Flotando en enjambre de drones.",
            imagen: "/atlas_4.mp4"
        }
    ],

    tiendaExclusiva: [
      // TIER 1
      { id: 'stylus_basico', nombre: 'Stylus de Mando', precio: 50, emoji: '🖊️', tipo: 'arma', descripcion: 'Para dar órdenes básicas al sistema.' },
      { id: 'traje_sastre', nombre: 'Traje Sastre Oscuro', precio: 100, emoji: '👔', tipo: 'ropa', descripcion: 'Impecable.', reqStat: { tipo: 'carisma', valor: 5 } },
      
      // TIER 2
      { id: 'lentes_hud', nombre: 'Lentes HUD', precio: 300, emoji: '👓', tipo: 'accesorio', descripcion: 'Visualización de datos en tiempo real.', reqStat: { tipo: 'sabiduria', valor: 10 } },
      { id: 'maletin_autonomo', nombre: 'Upgrade: Maletín Flotante', precio: 800, emoji: '🧳', tipo: 'arma', descripcion: 'Ya no necesitas cargarlo.', reqStat: { tipo: 'sabiduria', valor: 15 } },
      
      // TIER 3
      { id: 'traje_blanco', nombre: 'Traje "Artemis" Blanco', precio: 2000, emoji: '🧥', tipo: 'ropa', descripcion: 'La máxima señal de arrogancia.', reqStat: { tipo: 'carisma', valor: 20 } },
      { id: 'androide_butler', nombre: 'Androide Guardaespaldas', precio: 5000, emoji: '🦾', tipo: 'mascota', descripcion: 'Hace el trabajo sucio por ti.', reqStat: { tipo: 'carisma', valor: 25 } },

      // TIER 4
      { id: 'botas_grav', nombre: 'Zapatos Antigravitacionales', precio: 10000, emoji: '🛸', tipo: 'ropa', descripcion: 'El suelo es para la gente común.', reqStat: { tipo: 'sabiduria', valor: 30 } },
      { id: 'enjambre_drones', nombre: 'Enjambre Orbital', precio: 50000, emoji: '✨', tipo: 'arma', descripcion: 'Control total.', reqStat: { tipo: 'sabiduria', valor: 50 } }
    ]
  },

  explorador_demo: {
    id: 'explorador_demo',
    nombre: 'Explorador (Demo)',
    lemaPrincipal: 'Siempre adelante',
    descripcion: 'Personaje de prueba.',
    statsBase: { vitalidad: 1, sabiduria: 1, carisma: 1 },
    etapas: [{ nivelMinimo: 1, nombreClase: "Caminante", lema: "Hola", descripcionVisual: "Normal", imagen: "/logo.jpg" }],
    tiendaExclusiva: []
  }
};