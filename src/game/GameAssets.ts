// src/game/GameAssets.ts

// ==========================================
// 1. CONFIGURACIÓN MATEMÁTICA (NIVELES)
// ==========================================

// Cuánta XP da completar 1 hábito
export const XP_POR_HABITO = 10;

// Tabla de XP acumulada necesaria para llegar al Nivel X
export const TABLA_NIVELES = [
  0,      // Nivel 1
  100,    // Nivel 2
  250,    // Nivel 3
  450,    // Nivel 4
  700,    // Nivel 5
  1000,   // Nivel 6
  1350,   // Nivel 7
  1750,   // Nivel 8
  2200,   // Nivel 9
  2700,   // Nivel 10
  3300,   // Nivel 11
  4000,   // Nivel 12
  4800,   // Nivel 13
  5700,   // Nivel 14
  6700,   // Nivel 15
  7800,   // Nivel 16
  9000,   // Nivel 17
  10300,  // Nivel 18
  11700,  // Nivel 19
  13200,  // Nivel 20
  14800,  // Nivel 21
  16500,  // Nivel 22
  18300,  // Nivel 23
  20200,  // Nivel 24
  22200   // Nivel 25
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
// 2. TIPOS DE DATOS (INTERFACES)
// ==========================================

export type PersonajeTipo = 'atlas' | 'explorador_demo'; 
export type StatTipo = 'vitalidad' | 'sabiduria' | 'carisma' | 'gold' | 'nexo';

export interface GameItem {
  id: string;
  nombre: string;
  precio: number;
  emoji: string;
  tipo: 'arma' | 'ropa' | 'accesorio' | 'mascota';
  descripcion: string;
  reqStat?: {          
      type: StatTipo; // CORREGIDO: Usamos 'type' aquí
      valor: number 
  }; 
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
// 3. CONFIGURACIÓN DE STATS
// ==========================================
export const STATS_CONFIG = {
  vitalidad: {
    label: "Integridad del Sistema",
    icon: "/vitalidad.png",
    desc: "Un corazón biomecánico. Atlas no tiene sentimientos, tiene un 'motor biológico' que requiere mantenimiento."
  },
  sabiduria: {
    label: "Capital de I+D",
    icon: "/desarrollo.png",
    desc: "Un cerebro de circuitos. Atlas invierte en Investigación y Desarrollo de nuevas capacidades intelectuales."
  },
  carisma: {
    label: "Apalancamiento de Red",
    icon: "/socializacion.png",
    desc: "Nodos conectados. Atlas gestiona una red de contactos estratégicos y activos humanos externos."
  },
  gold: {
    label: "Fondos Operativos",
    icon: "/recursos.png",
    desc: "Liquidez necesaria para adquirir activos y mejoras en el mercado negro."
  },
  nexo: {
    label: "Nexo de Sincronización",
    icon: "/nexo.png",
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
      { 
          id: 'traje_sastre', 
          nombre: 'Traje Sastre Oscuro', 
          precio: 100, 
          emoji: '👔', 
          tipo: 'ropa', 
          descripcion: 'Impecable.', 
          reqStat: { type: 'carisma', valor: 5 } // CORREGIDO: 'type' en lugar de 'tipo'
      },
      
      // TIER 2
      { 
          id: 'lentes_hud', 
          nombre: 'Lentes HUD', 
          precio: 300, 
          emoji: '👓', 
          tipo: 'accesorio', 
          descripcion: 'Visualización de datos en tiempo real.', 
          reqStat: { type: 'sabiduria', valor: 10 } // CORREGIDO
      },
      { 
          id: 'maletin_autonomo', 
          nombre: 'Upgrade: Maletín Flotante', 
          precio: 800, 
          emoji: '🧳', 
          tipo: 'arma', 
          descripcion: 'Ya no necesitas cargarlo. Flota a tu lado.', 
          reqStat: { type: 'sabiduria', valor: 15 } // CORREGIDO
      },
      
      // TIER 3
      { 
          id: 'traje_blanco', 
          nombre: 'Traje "Artemis" Blanco', 
          precio: 2000, 
          emoji: '🧥', 
          tipo: 'ropa', 
          descripcion: 'La máxima señal de arrogancia.', 
          reqStat: { type: 'carisma', valor: 20 } // CORREGIDO
      },
      { 
          id: 'androide_butler', 
          nombre: 'Androide Guardaespaldas', 
          precio: 5000, 
          emoji: '🦾', 
          tipo: 'mascota', 
          descripcion: 'Hace el trabajo sucio por ti.', 
          reqStat: { type: 'carisma', valor: 25 } // CORREGIDO
      },

      // TIER 4
      { 
          id: 'botas_grav', 
          nombre: 'Zapatos Antigravitacionales', 
          precio: 10000, 
          emoji: '🛸', 
          tipo: 'ropa', 
          descripcion: 'El suelo es para la gente común.', 
          reqStat: { type: 'sabiduria', valor: 30 } // CORREGIDO
      },
      { 
          id: 'enjambre_drones', 
          nombre: 'Enjambre Orbital', 
          precio: 50000, 
          emoji: '✨', 
          tipo: 'arma', 
          descripcion: 'Control total.', 
          reqStat: { type: 'sabiduria', valor: 50 } // CORREGIDO
      }
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