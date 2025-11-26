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
  13200,  // Nivel 20 (Gran Hito)
  14800,  // Nivel 21
  16500,  // Nivel 22
  18300,  // Nivel 23
  20200,  // Nivel 24
  22200   // Nivel 25 (Maestría Avanzada)
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

export type PersonajeTipo = 'guerrero' | 'mago' | 'artista' | 'explorador';
export type StatTipo = 'vitalidad' | 'sabiduria' | 'carisma';

export interface GameItem {
  id: string;
  nombre: string;
  precio: number;      // Costo en Oro
  emoji: string;       // Icono visual
  tipo: 'arma' | 'ropa' | 'accesorio' | 'mascota';
  descripcion: string;
  reqStat?: {          // Requisito para comprar (Desbloqueo)
      tipo: StatTipo; 
      valor: number 
  }; 
}

export interface AvatarDef {
  id: PersonajeTipo;
  nombre: string;
  descripcion: string;
  emojiBase: string; // La cara del personaje por defecto
  statsBase: { vitalidad: number; sabiduria: number; carisma: number };
  tiendaExclusiva: GameItem[];
}

// ==========================================
// 3. CATÁLOGO DE PERSONAJES Y TIENDAS
// ==========================================

export const PERSONAJES: Record<PersonajeTipo, AvatarDef> = {
  guerrero: {
    id: 'guerrero',
    nombre: 'Guerrero de Luz',
    descripcion: 'Fuerza y disciplina. Enfocado en la acción y la vitalidad física.',
    emojiBase: '🛡️',
    statsBase: { vitalidad: 2, sabiduria: 0, carisma: 0 },
    tiendaExclusiva: [
      { id: 'espada_madera', nombre: 'Espada de Entrenamiento', precio: 50, emoji: '🗡️', tipo: 'arma', descripcion: 'Tu primera compañera de batalla.' },
      { id: 'botas_cuero', nombre: 'Botas de Marcha', precio: 100, emoji: '🥾', tipo: 'ropa', descripcion: 'Para largas caminatas.', reqStat: { tipo: 'vitalidad', valor: 5 } },
      { id: 'escudo_hierro', nombre: 'Escudo Férreo', precio: 300, emoji: '🛡️', tipo: 'arma', descripcion: 'Protege tu mente y cuerpo.', reqStat: { tipo: 'vitalidad', valor: 10 } },
      { id: 'armadura_plata', nombre: 'Armadura de Plata', precio: 800, emoji: '🦾', tipo: 'ropa', descripcion: 'Brilla con determinación.', reqStat: { tipo: 'vitalidad', valor: 20 } },
      { id: 'dragon_bebe', nombre: 'Dragón Guardián', precio: 2000, emoji: '🐉', tipo: 'mascota', descripcion: 'Un amigo leal y poderoso.', reqStat: { tipo: 'carisma', valor: 5 } }
    ]
  },
  mago: {
    id: 'mago',
    nombre: 'Sabio Arcano',
    descripcion: 'Conocimiento y calma. Transforma la realidad con el poder de la mente.',
    emojiBase: '🔮',
    statsBase: { vitalidad: 0, sabiduria: 2, carisma: 0 },
    tiendaExclusiva: [
      { id: 'varita_roble', nombre: 'Varita de Roble', precio: 50, emoji: '🪄', tipo: 'arma', descripcion: 'Canaliza tus pensamientos.' },
      { id: 'libro_hechizos', nombre: 'Grimorio Antiguo', precio: 120, emoji: '📖', tipo: 'accesorio', descripcion: 'Guarda tus aprendizajes.', reqStat: { tipo: 'sabiduria', valor: 5 } },
      { id: 'tunica_estrellas', nombre: 'Túnica Astral', precio: 300, emoji: '👘', tipo: 'ropa', descripcion: 'Tejida con polvo estelar.', reqStat: { tipo: 'sabiduria', valor: 10 } },
      { id: 'bola_cristal', nombre: 'Orbe de Claridad', precio: 600, emoji: '🔮', tipo: 'arma', descripcion: 'Visión clara del futuro.', reqStat: { tipo: 'sabiduria', valor: 20 } },
      { id: 'buho_blanco', nombre: 'Búho de Atenea', precio: 2000, emoji: '🦉', tipo: 'mascota', descripcion: 'Ve la verdad en la oscuridad.', reqStat: { tipo: 'vitalidad', valor: 5 } }
    ]
  },
  artista: { // Modista/Artista
    id: 'artista',
    nombre: 'Creador Visionario',
    descripcion: 'Carisma y expresión. Diseña su propia vida con creatividad.',
    emojiBase: '🎨',
    statsBase: { vitalidad: 0, sabiduria: 0, carisma: 2 },
    tiendaExclusiva: [
      { id: 'pincel_magico', nombre: 'Pincel de Aire', precio: 50, emoji: '🖌️', tipo: 'arma', descripcion: 'Pinta nuevos horizontes.' },
      { id: 'boina_artista', nombre: 'Boina Bohemia', precio: 100, emoji: '🧢', tipo: 'ropa', descripcion: 'Estilo único.', reqStat: { tipo: 'carisma', valor: 5 } },
      { id: 'paleta_colores', nombre: 'Paleta Infinita', precio: 300, emoji: '🎨', tipo: 'accesorio', descripcion: 'Todos los matices de la emoción.', reqStat: { tipo: 'carisma', valor: 10 } },
      { id: 'traje_gala', nombre: 'Traje de Gala', precio: 800, emoji: '👔', tipo: 'ropa', descripcion: 'Impresiona al mundo.', reqStat: { tipo: 'carisma', valor: 20 } },
      { id: 'gato_modelo', nombre: 'Gato Musa', precio: 2000, emoji: '🐈', tipo: 'mascota', descripcion: 'Inspiración elegante.', reqStat: { tipo: 'sabiduria', valor: 5 } }
    ]
  },
  explorador: {
    id: 'explorador',
    nombre: 'Explorador Vital',
    descripcion: 'Balance y aventura. Encuentra el equilibrio entre todos los mundos.',
    emojiBase: '🧭',
    statsBase: { vitalidad: 1, sabiduria: 1, carisma: 1 }, // Balanceado
    tiendaExclusiva: [
      { id: 'botas_senderismo', nombre: 'Botas Todo Terreno', precio: 50, emoji: '🥾', tipo: 'ropa', descripcion: 'Para caminos difíciles.' },
      { id: 'brujula_dorada', nombre: 'Brújula Moral', precio: 150, emoji: '🧭', tipo: 'accesorio', descripcion: 'Siempre apunta al norte.', reqStat: { tipo: 'sabiduria', valor: 5 } },
      { id: 'mochila_viaje', nombre: 'Mochila Sin Fondo', precio: 400, emoji: '🎒', tipo: 'accesorio', descripcion: 'Carga con todo lo bueno.', reqStat: { tipo: 'vitalidad', valor: 10 } },
      { id: 'mapa_mundi', nombre: 'Mapa del Destino', precio: 800, emoji: '🗺️', tipo: 'arma', descripcion: 'El mundo es tuyo.', reqStat: { tipo: 'carisma', valor: 15 } },
      { id: 'perro_fiel', nombre: 'Compañero Canino', precio: 2000, emoji: '🐕', tipo: 'mascota', descripcion: 'Lealtad incondicional.', reqStat: { tipo: 'vitalidad', valor: 5 } }
    ]
  }
};