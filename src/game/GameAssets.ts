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

// Actualizamos los tipos para incluir a Atlas
export type PersonajeTipo = 'atlas' | 'explorador_demo'; 
export type StatTipo = 'vitalidad' | 'sabiduria' | 'carisma';

export interface GameItem {
  id: string;
  nombre: string;
  precio: number;
  emoji: string;
  tipo: 'arma' | 'ropa' | 'accesorio' | 'mascota';
  descripcion: string;
  reqStat?: { tipo: StatTipo; valor: number }; 
}

// Nueva interfaz para las etapas de evolución
export interface EtapaEvolucion {
    nivelMinimo: number;
    nombreClase: string; // Ej: "Director de Operaciones"
    lema: string;
    descripcionVisual: string;
    emoji: string; // Placeholder hasta tener la imagen
}

export interface AvatarDef {
  id: PersonajeTipo;
  nombre: string;
  lemaPrincipal: string;
  descripcion: string;
  statsBase: { vitalidad: number; sabiduria: number; carisma: number };
  etapas: EtapaEvolucion[]; // Lista de evoluciones
  tiendaExclusiva: GameItem[];
}

// Helper para obtener la etapa actual según el nivel del paciente
export const obtenerEtapaActual = (personaje: AvatarDef, nivelPaciente: number) => {
    // Buscamos la etapa más alta posible para el nivel actual
    const etapasDesbloqueadas = personaje.etapas.filter(e => nivelPaciente >= e.nivelMinimo);
    return etapasDesbloqueadas[etapasDesbloqueadas.length - 1] || personaje.etapas[0];
};

// ==========================================
// 3. CATÁLOGO: ATLAS VANCE
// ==========================================

export const PERSONAJES: Record<PersonajeTipo, AvatarDef> = {
  atlas: {
    id: 'atlas',
    nombre: 'Atlas Vance',
    lemaPrincipal: 'El Auditor del Caos',
    descripcion: '¿Por qué ensuciarse las manos cuando puedes reprogramar la realidad? Atlas realiza una auditoría hostil a las fuerzas del mal.',
    // Atlas es cerebro y dinero (Sabiduría + Carisma), baja fuerza física directa
    statsBase: { vitalidad: 1, sabiduria: 3, carisma: 3 },
    
    etapas: [
        {
            nivelMinimo: 1,
            nombreClase: "Consultor Táctico",
            lema: "Mis tarifas son altas, pero el costo del fracaso es mayor.",
            descripcionVisual: "Traje sastre oscuro impecable. Maletín Aegis en mano.",
            emoji: "💼" // Imagen: atlas_tier1.png
        },
        {
            nivelMinimo: 5,
            nombreClase: "Director de Operaciones",
            lema: "Estoy reestructurando este conflicto. Ustedes son personal redundante.",
            descripcionVisual: "Chaleco ejecutivo. Maletín flotante con holomapa.",
            emoji: "📡" // Imagen: atlas_tier2.png
        },
        {
            nivelMinimo: 12,
            nombreClase: "CEO Ejecutivo",
            lema: "Su existencia es un pasivo en mi balance general. Procedo a la liquidación.",
            descripcionVisual: "Traje blanco inmaculado. Androide guardaespaldas.",
            emoji: "🤖" // Imagen: atlas_tier3.png
        },
        {
            nivelMinimo: 20,
            nombreClase: "Arquitecto del Sistema Ápex",
            lema: "La realidad ha sido optimizada. La resistencia es irrelevante.",
            descripcionVisual: "Traje con circuitos de luz. Flotando en enjambre de drones.",
            emoji: "💠" // Imagen: atlas_tier4.png
        }
    ],

    tiendaExclusiva: [
      // Tier 1
      { id: 'stylus_basico', nombre: 'Stylus de Mando', precio: 50, emoji: '🖊️', tipo: 'arma', descripcion: 'Para dar órdenes básicas al sistema.' },
      { id: 'traje_sastre', nombre: 'Traje Sastre Oscuro', precio: 100, emoji: '👔', tipo: 'ropa', descripcion: 'Impecable, aunque seas un novato.', reqStat: { tipo: 'carisma', valor: 5 } },
      
      // Tier 2
      { id: 'lentes_hud', nombre: 'Lentes HUD', precio: 300, emoji: '👓', tipo: 'accesorio', descripcion: 'Visualización de datos en tiempo real.', reqStat: { tipo: 'sabiduria', valor: 10 } },
      { id: 'maletin_autonomo', nombre: 'Upgrade: Maletín Flotante', precio: 800, emoji: '🧳', tipo: 'arma', descripcion: 'Ya no necesitas cargarlo.', reqStat: { tipo: 'sabiduria', valor: 15 } },
      
      // Tier 3
      { id: 'traje_blanco', nombre: 'Traje "Artemis" Blanco', precio: 2000, emoji: '🧥', tipo: 'ropa', descripcion: 'La máxima señal de arrogancia y poder.', reqStat: { tipo: 'carisma', valor: 20 } },
      { id: 'androide_butler', nombre: 'Androide Guardaespaldas', precio: 5000, emoji: '🦾', tipo: 'mascota', descripcion: 'Hace el trabajo sucio por ti.', reqStat: { tipo: 'carisma', valor: 25 } },

      // Tier 4
      { id: 'botas_grav', nombre: 'Zapatos Antigravitacionales', precio: 10000, emoji: '🛸', tipo: 'ropa', descripcion: 'El suelo es para la gente común.', reqStat: { tipo: 'sabiduria', valor: 30 } },
      { id: 'enjambre_drones', nombre: 'Enjambre Orbital', precio: 50000, emoji: '✨', tipo: 'arma', descripcion: 'Control total del campo de batalla.', reqStat: { tipo: 'sabiduria', valor: 50 } }
    ]
  },

  // Relleno por si acaso (puedes borrarlo después)
  explorador_demo: {
    id: 'explorador_demo',
    nombre: 'Explorador (Demo)',
    lemaPrincipal: 'Siempre adelante',
    descripcion: 'Personaje de prueba.',
    statsBase: { vitalidad: 1, sabiduria: 1, carisma: 1 },
    etapas: [{ nivelMinimo: 1, nombreClase: "Caminante", lema: "Hola", descripcionVisual: "Normal", emoji: "🚶" }],
    tiendaExclusiva: []
  }
};