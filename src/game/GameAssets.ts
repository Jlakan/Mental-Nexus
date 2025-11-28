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
export type StatTipo = 'vitalidad' | 'sabiduria' | 'vinculacion' | 'gold' | 'nexo';

export interface GameItem {
  id: string; nombre: string; precio: number; emoji: string; tipo: 'arma' | 'ropa' | 'accesorio' | 'mascota'; descripcion: string;
  reqStat?: { type: StatTipo; valor: number }; 
}

export interface EtapaEvolucion {
    nivelMinimo: number;
    nombreClase: string;
    lema: string;
    descripcionVisual: string;
    descripcionNarrativa: string; // NUEVO: Historia de la etapa
    imagen: string; 
}

export interface AvatarDef {
  id: PersonajeTipo;
  nombre: string;
  arquetipo: string; // NUEVO
  lemaPrincipal: string;
  bio: string; // NUEVO: Historia completa
  descripcion: string; // Breve para la tarjeta
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
  vitalidad: { label: "Integridad del Sistema", icon: "/vitalidad.png", desc: "Mantenimiento del motor biológico.", color: "#EF4444" },
  sabiduria: { label: "Capital de I+D", icon: "/desarrollo.png", desc: "Inversión en capacidades intelectuales.", color: "#3B82F6" },
  vinculacion: { label: "Vinculación de Red", icon: "/socializacion.png", desc: "Gestión de activos humanos.", color: "#F59E0B" },
  gold: { label: "Fondos Operativos", icon: "/recursos.png", desc: "Liquidez para el mercado.", color: "#FBBF24" },
  nexo: { label: "Nexo de Sincronización", icon: "/nexo.png", desc: "Vínculo terapéutico de alto valor.", color: "#8B5CF6" }
};

// ==========================================
// 4. CATÁLOGO DE PERSONAJES
// ==========================================
export const PERSONAJES: Record<PersonajeTipo, AvatarDef> = {
  atlas: {
    id: 'atlas',
    nombre: 'Atlas Vance',
    arquetipo: 'El Estratega Analítico',
    lemaPrincipal: 'El caos es solo un problema de diseño esperando ser resuelto.',
    descripcion: '¿Por qué ensuciarse las manos cuando puedes reprogramar la realidad? Atlas realiza una auditoría hostil a las fuerzas del mal.',
    bio: 'Atlas no cree en la suerte ni en esperar a que las cosas mejoren por sí solas. Para él, la mente y la vida son sistemas complejos que pueden ser entendidos, optimizados y dominados. Su superpoder no es la fuerza bruta, sino la capacidad de analizar sus emociones, trazar un plan de acción y ejecutarlo con la precisión de un ingeniero. Al elegir a Atlas, eliges tomar el control, diseñar tus propias soluciones y convertir los obstáculos en datos útiles para tu crecimiento.',
    statsBase: { vitalidad: 1, sabiduria: 3, vinculacion: 3 },
    
    etapas: [
        {
            nivelMinimo: 1,
            nombreClase: "Consultor Táctico",
            lema: "Primero observamos. Luego actuamos.",
            descripcionVisual: "Traje sastre oscuro. Maletín Aegis.",
            descripcionNarrativa: "El punto de partida. Representa la etapa de autoconocimiento. Identificamos patrones, recolectamos datos sobre lo que sentimos y preparamos las herramientas básicas para el cambio. No hay movimientos bruscos todavía, solo un análisis brillante del terreno.",
            imagen: "/atlas_1.mp4"
        },
        {
            nivelMinimo: 5,
            nombreClase: "Director de Operaciones",
            lema: "La teoría se convierte en práctica. Ejecutando protocolos.",
            descripcionVisual: "Chaleco ejecutivo. Maletín flotante.",
            descripcionNarrativa: "Representa la toma de acción. Ya no solo observamos los problemas; estamos interviniendo activamente en ellos. Es la etapa de aplicar estrategias de afrontamiento y gestionar el día a día con eficiencia.",
            imagen: "/atlas_2.mp4"
        },
        {
            nivelMinimo: 12,
            nombreClase: "CEO Ejecutivo",
            lema: "El control no se pide, se establece.",
            descripcionVisual: "Traje blanco inmaculado. Androide guardián.",
            descripcionNarrativa: "La cima del liderazgo personal. Has establecido límites saludables (el guardián) y tienes la confianza para delegar y gestionar tus recursos emocionales sin desgastarte. Eres el dueño de tu propia narrativa.",
            imagen: "/atlas_3.mp4"
        },
        {
            nivelMinimo: 20,
            nombreClase: "Arquitecto del Sistema Ápex",
            lema: "Más allá de los límites. Fusión total.",
            descripcionVisual: "Traje de luz. Enjambre de drones.",
            descripcionNarrativa: "La evolución final. Representa la integración total y la resiliencia. Las herramientas ya no son externas; las has interiorizado. Eres capaz de adaptarte a cualquier situación en tiempo real, transformando el entorno.",
            imagen: "/atlas_4.mp4"
        }
    ],

    tiendaExclusiva: [
      { id: 'stylus', nombre: 'Stylus de Mando', precio: 50, emoji: '🖊️', tipo: 'arma', descripcion: 'Órdenes básicas.' },
      { id: 'traje', nombre: 'Traje Sastre', precio: 100, emoji: '👔', tipo: 'ropa', descripcion: 'Impecable.', reqStat: { type: 'vinculacion', valor: 5 } }
    ]
  },

  explorador_demo: {
    id: 'explorador_demo',
    nombre: 'Explorador (Demo)',
    arquetipo: 'El Viajero',
    lemaPrincipal: 'Siempre adelante',
    bio: 'Texto de relleno.',
    descripcion: 'Personaje de prueba.',
    statsBase: { vitalidad: 1, sabiduria: 1, vinculacion: 1 },
    etapas: [{ nivelMinimo: 1, nombreClase: "Caminante", lema: "Hola", descripcionVisual: "Normal", descripcionNarrativa: "...", imagen: "/logo.jpg" }],
    tiendaExclusiva: []
  }
};