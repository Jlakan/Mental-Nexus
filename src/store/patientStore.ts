import { create } from 'zustand';
import { patientService } from '../services/patientService';
import { Patient, TherapyMode, Quest } from '../types/patient';
import { doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore'; 
import { db } from '../config/firebase';

interface PatientState {
  patients: Patient[];
  loading: boolean;
  error: string | null;

  // Acciones
  fetchPatients: (therapistId: string) => Promise<void>;
  addPatient: (therapistId: string, data: { 
    firstName: string; 
    lastName: string; 
    email: string; 
    therapyMode: TherapyMode 
  }) => Promise<void>;
  
  // 👇 NUEVA ACCIÓN: Asignar Misión
  addQuest: (patientId: string, quest: Quest) => Promise<void>;
}

export const usePatientStore = create<PatientState>((set, get) => ({
  patients: [],
  loading: false,
  error: null,

  fetchPatients: async (therapistId) => {
    set({ loading: true, error: null });
    try {
      const patients = await patientService.getMyPatients(therapistId);
      set({ patients, loading: false });
    } catch (err) {
      set({ error: 'Error al cargar pacientes', loading: false });
    }
  },

  addPatient: async (therapistId, data) => {
    // ... (El código de addPatient se mantiene IGUAL que antes)
    set({ loading: true, error: null });
    try {
      const newId = await patientService.createPatient(therapistId, data);
      const newPatientMock: Patient = {
        id: newId,
        ...data,
        therapistId,
        providerType: 'psicologo',
        active: true,
        level: 1,
        currentXP: 0,
        nextLevelXP: 100,
        nexos: 0,
        gold: 50,
        stats: { vitality: 10, wisdom: 10, social: 10, resilience: 10, strength: 10, autocuidado: 10, desarrollo: 10, vinculacion: 10 },
        activeQuests: [],
        inventory: [],
        createdAt: {} as any,
        updatedAt: {} as any
      };
      set(state => ({ patients: [...state.patients, newPatientMock], loading: false }));
    } catch (err) {
      console.error(err);
      set({ error: 'No se pudo crear el paciente', loading: false });
    }
  },

  // 👇 LA NUEVA LÓGICA DE MISIONES
  addQuest: async (patientId, quest) => {
    try {
      // 1. Actualizar en Firebase
      const patientRef = doc(db, 'patients', patientId);
      await updateDoc(patientRef, {
        activeQuests: arrayUnion(quest)
      });

      // 2. Actualizar en Memoria Local (para que se vea al instante)
      set(state => ({
        patients: state.patients.map(p => 
          p.id === patientId 
            ? { ...p, activeQuests: [...p.activeQuests, quest] }
            : p
        )
      }));
    } catch (error) {
      console.error("Error asignando quest:", error);
    }
  }
}));