// src/game/GameAssets.ts

// ... (Las constantes matemáticas siguen igual) ...
export const XP_POR_HABITO = 10;
export const TABLA_NIVELES = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3300, 4000, 4800, 5700, 6700, 7800, 9000, 10300, 11700, 13200, 14800, 16500, 18300, 20200, 22200];
export const obtenerNivel = (xp: number) => { for (let i = TABLA_NIVELES.length - 1; i >= 0; i--) { if (xp >= TABLA_NIVELES[i]) return i + 1; } return 1; };
export const obtenerMetaSiguiente = (n: number) => (n >= TABLA_NIVELES.length) ? TABLA_NIVELES[TABLA_NIVELES.length - 1] + ((n - TABLA_NIVELES.length + 1) * 2500) : TABLA_NIVELES[n];

// ... (Tipos) ...
export type PersonajeTipo = 'atlas' | 'explorador_demo'; 
export type StatTipo = 'vitalidad' | 'sabiduria' | 'carisma';

export interface GameItem {
  id: string; nombre: string; precio: number; emoji: string; tipo: 'arma' | 'ropa' | 'accesorio' | 'mascota'; descripcion: string; reqStat?: { tipo: StatTipo; valor: number }; 
}

export interface EtapaEvolucion {
    nivelMinimo: number;
    nombreClase: string;
    lema: string;
    descripcionVisual: string;
    // CAMBIO AQUÍ: Dos archivos
    imagenEstatica: string; 
    videoLoop: string;
}

export interface AvatarDef {
  id: PersonajeTipo; nombre: string; lemaPrincipal: string; descripcion: string; statsBase: { vitalidad: number; sabiduria: number; carisma: number };
  etapas: EtapaEvolucion[]; tiendaExclusiva: GameItem[];
}

export const obtenerEtapaActual = (p: AvatarDef, n: number) => { const e = p.etapas.filter(x => n >= x.nivelMinimo); return e[e.length - 1] || p.etapas[0]; };

// ... (Catálogo) ...
export const PERSONAJES: Record<PersonajeTipo, AvatarDef> = {
  atlas: {
    id: 'atlas',
    nombre: 'Atlas Vance',
    lemaPrincipal: 'El Auditor del Caos',
    descripcion: '¿Por qué ensuciarse las manos cuando puedes reprogramar la realidad?',
    statsBase: { vitalidad: 1, sabiduria: 3, carisma: 3 },
    
    etapas: [
        {
            nivelMinimo: 1,
            nombreClase: "Consultor Táctico",
            lema: "Mis tarifas son altas.",
            descripcionVisual: "Traje sastre oscuro.",
            imagenEstatica: "/atlas_1.png", // La foto
            videoLoop: "/atlas_1.mp4"       // El video
        },
        {
            nivelMinimo: 5,
            nombreClase: "Director de Operaciones",
            lema: "Estoy reestructurando este conflicto.",
            descripcionVisual: "Chaleco ejecutivo.",
            imagenEstatica: "/atlas_2.png",
            videoLoop: "/atlas_2.mp4"
        },
        {
            nivelMinimo: 12,
            nombreClase: "CEO Ejecutivo",
            lema: "Su existencia es un pasivo.",
            descripcionVisual: "Traje blanco inmaculado.",
            imagenEstatica: "/atlas_3.png",
            videoLoop: "/atlas_3.mp4"
        },
        {
            nivelMinimo: 20,
            nombreClase: "Arquitecto del Sistema Ápex",
            lema: "La realidad ha sido optimizada.",
            descripcionVisual: "Traje con circuitos de luz.",
            imagenEstatica: "/atlas_4.png",
            videoLoop: "/atlas_4.mp4"
        }
    ],
    // ... (Mantén la tienda que ya tenías, la omito aquí para ahorrar espacio pero NO LA BORRES) ...
    tiendaExclusiva: [
      { id: 'stylus_basico', nombre: 'Stylus de Mando', precio: 50, emoji: '🖊️', tipo: 'arma', descripcion: 'Para dar órdenes básicas.' },
      // ... resto de items ...
    ]
  },

  explorador_demo: {
    id: 'explorador_demo',
    nombre: 'Explorador',
    lemaPrincipal: 'Demo',
    descripcion: 'Test.',
    statsBase: { vitalidad: 1, sabiduria: 1, carisma: 1 },
    etapas: [{ nivelMinimo: 1, nombreClase: "Caminante", lema: "Hola", descripcionVisual: "Normal", imagenEstatica: "/logo.jpg", videoLoop: "/intro.mp4" }],
    tiendaExclusiva: []
  }
};