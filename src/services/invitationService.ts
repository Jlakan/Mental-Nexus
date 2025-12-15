import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  addDoc, 
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { patientService } from './patientService';

export interface Invitation {
  id: string;
  patientEmail: string;
  patientUid?: string;
  therapistId: string;
  organizationId: string;
  status: 'pending' | 'accepted' | 'rejected';
  requestDate: Timestamp;
}

export const invitationService = {
  
  // 1. Obtener solicitudes pendientes
  getPendingInvitations: async (therapistId: string): Promise<Invitation[]> => {
    try {
      const q = query(
        collection(db, 'invitations'),
        where('therapistId', '==', therapistId),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Invitation));
    } catch (error) {
      console.error("Error trayendo invitaciones:", error);
      return [];
    }
  },

  // 2. Aceptar solicitud
  acceptInvitation: async (invitation: Invitation) => {
    try {
      // A) Actualizamos el estado de la invitación
      const invRef = doc(db, 'invitations', invitation.id);
      await updateDoc(invRef, { status: 'accepted' });

      // B) CREAMOS EL EXPEDIENTE
      const patientData = {
        firstName: 'Usuario', 
        lastName: 'App',
        email: invitation.patientEmail,
        therapyMode: 'tcc' as const,
      };
      
      await patientService.createPatient(invitation.therapistId, patientData);
      
      return true;
    } catch (error) {
      console.error("Error aceptando invitación:", error);
      throw error;
    }
  },

  // 3. Rechazar
  rejectInvitation: async (invitationId: string) => {
    const invRef = doc(db, 'invitations', invitationId);
    await updateDoc(invRef, { status: 'rejected' });
  },
  
  // 4. (DEBUG) Crear invitación falsa
  createMockInvitation: async (therapistId: string, orgId: string) => {
    await addDoc(collection(db, 'invitations'), {
      patientEmail: `test${Math.floor(Math.random()*100)}@nexus.com`,
      therapistId,
      organizationId: orgId,
      status: 'pending',
      requestDate: Timestamp.now()
    });
  }
};