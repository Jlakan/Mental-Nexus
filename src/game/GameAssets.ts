// src/game/GameAssets.ts

// ==========================================
// 1. CONFIGURACIÓN MATEMÁTICA (NIVELES)
// ==========================================

// Cuánta XP da completar 1 hábito
export const XP_POR_HABITO = 10;

// Tabla de XP acumulada necesaria para llegar al Nivel X
// Index 0 = Nivel 1, Index 1 = Nivel 2, etc.
export const TABLA_NIVELES = [
  0,      // Nivel 1 (Inicio)
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

// Función: Calcula nivel actual basado en XP total
export const obtenerNivel = (xp: number) => {
  for (let i = TABLA_NIVELES.length - 1; i >= 0; i--) {
    if (xp >= TABLA_NIVELES[i]) {
      return i + 1; 
    }
  }
  return 1;
};

// Función: Calcula meta del siguiente nivel
export const obtenerMetaSiguiente = (nivelActual: number) => {
  if (nivelActual >= TABLA_NIVELES.length) {
    // Niveles infinitos: +2500 XP por cada nivel extra después del 25
    return TABLA_NIVELES[TABLA_NIVELES.length - 1] + ((nivelActual - TABLA_NIVELES.length + 1) * 2500);
  }
  return TABLA_NIVELES[nivelActual];
};

// ==========================================
// 2. TIPOS DE DATOS (INTERFACES)
// ==========================================

export type PersonajeTipo = 'atlas' | 'explorador_demo'; 
export type StatTipo = 'vitalidad' | 'sabiduria' | 'carisma';

export interface GameItem {
  id: string;
  nombre: string;
  precio: number;      // Costo en Oro
  emoji: string;       // Icono visual (o url de imagen)
  tipo: 'arma' | 'ropa' | 'accesorio' | 'mascota';
  descripcion: string;
  reqStat?: {          // Requisito para comprar (Desbloqueo)
      tipo: StatTipo; 
      valor: number 
  }; 
}

export interface EtapaEvolucion {
    nivelMinimo: number;
    nombreClase: string;
    lema: string;
    descripcionVisual: string;
    imagen: string; // Ruta al archivo en /public
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

// Helper para obtener la etapa visual según el nivel
export const obtenerEtapaActual = (personaje: AvatarDef, nivelPaciente: number) => {
    const etapasDesbloqueadas = personaje.etapas.filter(e => nivelPaciente >= e.nivelMinimo);
    return etapasDesbloqueadas[etapasDesbloqueadas.length - 1] || personaje.etapas[0];
};

// ==========================================
// 3. CATÁLOGO DE PERSONAJES
// ==========================================

export const PERSONAJES: Record<PersonajeTipo, AvatarDef> = {
  atlas: {
    id: 'atlas',
    nombre: 'Atlas Vance',
    lemaPrincipal: 'El Auditor del Caos',
    descripcion: '¿Por qué ensuciarse las manos cuando puedes reprogramar la realidad? Atlas realiza una auditoría hostil a las fuerzas del mal.',
    // Atlas es cerebro y dinero (Sabiduría + Carisma)
    statsBase: { vitalidad: 1, sabiduria: 3, carisma: 3 },
    
    etapas: [
        {
            nivelMinimo: 1,
            nombreClase: "Consultor Táctico",
            lema: "Mis tarifas son altas, pero el costo del fracaso es mayor.",
            descripcionVisual: "Traje sastre oscuro impecable. Maletín Aegis en mano.",
            imagen: "/atlas_1.mp4" // Requiere archivo en public
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
      // TIENDA DE ATLAS (Items Tecnológicos y Corporativos)
      
      // TIER 1: Consultor
      { id: 'stylus_basico', nombre: 'Stylus de Mando', precio: 50, emoji: '🖊️', tipo: 'arma', descripcion: 'Para dar órdenes básicas al sistema.' },
      { id: 'traje_sastre', nombre: 'Traje Sastre Oscuro', precio: 100, emoji: '👔', tipo: 'ropa', descripcion: 'Impecable, aunque seas un novato.', reqStat: { tipo: 'carisma', valor: 5 } },
      
      // TIER 2: Director
      { id: 'lentes_hud', nombre: 'Lentes HUD', precio: 300, emoji: '👓', tipo: 'accesorio', descripcion: 'Visualización de datos en tiempo real.', reqStat: { tipo: 'sabiduria', valor: 10 } },
      { id: 'maletin_autonomo', nombre: 'Upgrade: Maletín Flotante', precio: 800, emoji: '🧳', tipo: 'arma', descripcion: 'Ya no necesitas cargarlo. Flota a tu lado.', reqStat: { tipo: 'sabiduria', valor: 15 } },
      
      // TIER 3: CEO
      { id: 'traje_blanco', nombre: 'Traje "Artemis" Blanco', precio: 2000, emoji: '🧥', tipo: 'ropa', descripcion: 'La máxima señal de arrogancia y poder.', reqStat: { tipo: 'carisma', valor: 20 } },
      { id: 'androide_butler', nombre: 'Androide Guardaespaldas', precio: 5000, emoji: '🦾', tipo: 'mascota', descripcion: 'Hace el trabajo sucio por ti de forma elegante.', reqStat: { tipo: 'carisma', valor: 25 } },

      // TIER 4: Arquitecto
      { id: 'botas_grav', nombre: 'Zapatos Antigravitacionales', precio: 10000, emoji: '🛸', tipo: 'ropa', descripcion: 'El suelo es para la gente común.', reqStat: { tipo: 'sabiduria', valor: 30 } },
      { id: 'enjambre_drones', nombre: 'Enjambre Orbital', precio: 50000, emoji: '✨', tipo: 'arma', descripcion: 'Control total del campo de batalla con la mente.', reqStat: { tipo: 'sabiduria', valor: 50 } }
    ]
  },

  // Placeholder para otros personajes
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