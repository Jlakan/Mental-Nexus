// src/types.ts

// 1. Definición de Usuario
export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    rol: 'admin' | 'psicologo' | 'paciente';
    
    // Permisos
    isAdmin?: boolean;       // Súper admin
    isPsicologo?: boolean;   // Bandera de acceso a panel
    isPaciente?: boolean;    // Bandera de acceso a app
    isAuthorized?: boolean;  // Si su superior lo aprobó
    
    // Vinculación
    codigoVinculacion?: string; // El código que el psico comparte
    psicologoId?: string;       // El ID de su doctor (si es paciente)
    
    createdAt: any; // Timestamp de Firebase
  }
  
  // 2. Definición de Hábito (Con Historial y Gamificación)
  export interface Habito {
    id?: string;
    titulo: string;
    pacienteId: string;
    asignadoPor: string;
    
    // Gamificación 🎮
    puntosPorCompletar: number; // Ej: 10 pts
    icono: string;              // Ej: "💧" o "🏃‍♂️"
    metaSemanal: number;        // Porcentaje (0-100)
    
    // Registro Actual (Semana en curso)
    registro: {
      L: boolean; M: boolean; X: boolean; J: boolean; V: boolean; S: boolean; D: boolean;
    };
  
    // Historial (Semanas pasadas) 📅
    // Se guardará como: { "2023-W45": { L: true... }, "2023-W46": ... }
    historial?: Record<string, any>; 
    
    createdAt: any;
  }
  
  // 3. Definición de Pruebas Psicológicas 🧠
  export interface PreguntaPrueba {
    id: number;
    texto: string;
    tipo: 'escala' | 'si_no' | 'texto'; // Escala 0-3, o Sí/No
    valorMaximo?: number; // Ej: 3 en escala Beck
  }
  
  export interface ResultadoPrueba {
    id?: string;
    pruebaId: string;      // Ej: "beck_depresion"
    nombrePrueba: string;  // Ej: "Inventario de Depresión de Beck"
    pacienteId: string;
    fechaAplicacion: any;
    
    respuestas: Record<number, number | string>; // { 1: 3, 2: 0, ... }
    puntajeTotal: number;
    
    // Interpretación
    interpretacionIA?: string; // Texto generado por la IA
    comentariosPsicologo?: string; // Notas del doctor
  }