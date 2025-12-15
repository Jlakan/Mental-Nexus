import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  Timestamp,
  doc,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Patient, TherapyMode, Quest } from '../types/patient';

const COLLECTION_NAME = 'patients';

export const patientService = {
  
  // 1. Crear nuevo paciente
  createPatient: async (
    therapistId: string, 
    data: { firstName: string; lastName: string; email: string; therapyMode: TherapyMode }
  ): Promise<string> => {
    try {
      const newPatient = {
        ...data,
        therapistId,
        providerType: 'psicologo',
        active: true,
        level: 1,
        currentXP: 0,
        nextLevelXP: 100,
        nexos: 0,
        gold: 50,
        stats: {
          vitality: 10, wisdom: 10, social: 10, resilience: 10, strength: 10,
          autocuidado: 10, desarrollo: 10, vinculacion: 10
        },
        inventory: [],
        activeQuests: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      const docRef = await addDoc(collection(db, COLLECTION_NAME), newPatient);
      return docRef.id;
    } catch (error) {
      console.error("Error creando paciente:", error);
      throw error;
    }
  },

  // 2. Traer MIS pacientes (Vista Profesional)
  getMyPatients: async (therapistId: string): Promise<Patient[]> => {
    try {
      const q = query(collection(db, COLLECTION_NAME), where("therapistId", "==", therapistId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient));
    } catch (error) {
      console.error("Error obteniendo pacientes:", error);
      throw error;
    }
  },

  // 3. 👇 NUEVO: Buscar Paciente por Email (Para la App del Paciente)
  getPatientByEmail: async (email: string): Promise<Patient | null> => {
    try {
      const q = query(collection(db, COLLECTION_NAME), where("email", "==", email));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      
      const docData = querySnapshot.docs[0];
      return { id: docData.id, ...docData.data() } as Patient;
    } catch (error) {
      console.error("Error buscando paciente:", error);
      return null;
    }
  },

  // 4. 👇 NUEVO: Completar Misión (Lógica Real)
  completeQuest: async (patientId: string, questId: string): Promise<void> => {
    try {
      const patientRef = doc(db, COLLECTION_NAME, patientId);
      const patientSnap = await getDoc(patientRef);
      
      if (!patientSnap.exists()) return;
      const patientData = patientSnap.data() as Patient;

      // Buscar la misión
      const questIndex = patientData.activeQuests.findIndex(q => q.id === questId);
      if (questIndex === -1) return;
      
      const quest = patientData.activeQuests[questIndex];
      if (quest.completed) return; // Ya estaba hecha

      // Actualizar datos
      const newGold = (patientData.gold || 0) + quest.goldReward;
      const newXP = (patientData.currentXP || 0) + quest.xpReward;
      
      // Lógica de Subida de Nivel (Simple)
      let newLevel = patientData.level;
      let finalXP = newXP;
      let nextLevelXP = patientData.nextLevelXP;

      if (finalXP >= nextLevelXP) {
        newLevel += 1;
        finalXP = finalXP - nextLevelXP; // Resto de XP
        nextLevelXP = Math.floor(nextLevelXP * 1.5); // Cada nivel cuesta 50% más
      }

      // Marcar misión como completa
      const updatedQuests = [...patientData.activeQuests];
      updatedQuests[questIndex] = { ...quest, completed: true };

      await updateDoc(patientRef, {
        gold: newGold,
        currentXP: finalXP,
        level: newLevel,
        nextLevelXP: nextLevelXP,
        activeQuests: updatedQuests
      });

    } catch (error) {
      console.error("Error completando misión:", error);
      throw error;
    }
  }
};