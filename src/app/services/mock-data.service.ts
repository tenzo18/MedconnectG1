import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

/**
 * Service de données mockées conformes au backend Med-Connect
 * Utilisé comme fallback quand le backend n'est pas disponible
 */
@Injectable({
  providedIn: 'root'
})
export class MockDataService {

  /**
   * Données mockées pour un médecin
   */
  getMockDoctorProfile() {
    return {
      success: true,
      data: {
        user: {
          id: 'mock-doctor-id',
          email: 'dr.martin@medconnect.com',
          firstName: 'Jean',
          lastName: 'Martin',
          role: 'DOCTOR' as const,
          status: 'APPROVED',
          profilePicture: undefined,
          phone: '06 12 34 56 78',
          specialty: 'Médecine générale',
          licenseNumber: 'MD123456',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-12-28T12:00:00Z'
        }
      }
    };
  }

  /**
   * Patients connectés mockés (conforme à l'API /api/sante/patients-connectes)
   */
  getMockPatientsConnectes(): Observable<any> {
    return of({
      success: true,
      data: [
        {
          id: 'patient-1',
          firstName: 'Marie',
          lastName: 'Dubois',
          email: 'marie.dubois@email.com',
          profilePicture: null,
          dateAutorisation: '2024-12-20T10:00:00Z',
          typeAcces: 'COMPLET',
          parametresSante: {
            groupeSanguin: 'A+',
            allergiesConnues: ['Pénicilline'],
            medicamentsActuels: ['Doliprane'],
            conditionsMedicales: ['Hypertension']
          }
        },
        {
          id: 'patient-2',
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@email.com',
          profilePicture: null,
          dateAutorisation: '2024-12-18T14:30:00Z',
          typeAcces: 'COMPLET',
          parametresSante: {
            groupeSanguin: 'O-',
            allergiesConnues: [],
            medicamentsActuels: [],
            conditionsMedicales: []
          }
        },
        {
          id: 'patient-3',
          firstName: 'Sophie',
          lastName: 'Bernard',
          email: 'sophie.bernard@email.com',
          profilePicture: null,
          dateAutorisation: '2024-12-15T09:15:00Z',
          typeAcces: 'COMPLET',
          parametresSante: {
            groupeSanguin: 'B+',
            allergiesConnues: ['Aspirine'],
            medicamentsActuels: ['Levothyrox'],
            conditionsMedicales: ['Hypothyroïdie']
          }
        }
      ]
    });
  }

  /**
   * Demandes de connexion mockées (conforme à l'API /api/connexions/demandes/medecin)
   */
  getMockDemandesConnexion(): Observable<any> {
    return of({
      success: true,
      data: [
        {
          id: 'demande-1',
          patientId: 'patient-4',
          medecinId: 'mock-doctor-id',
          statut: 'EN_ATTENTE',
          message: 'Bonjour docteur, j\'aimerais vous donner accès à mon dossier médical pour un suivi de ma tension artérielle.',
          createdAt: '2024-12-28T08:30:00Z',
          patient: {
            id: 'patient-4',
            firstName: 'Pierre',
            lastName: 'Moreau',
            email: 'pierre.moreau@email.com',
            profilePicture: null,
            age: 45
          }
        },
        {
          id: 'demande-2',
          patientId: 'patient-5',
          medecinId: 'mock-doctor-id',
          statut: 'EN_ATTENTE',
          message: 'Docteur, suite à notre consultation téléphonique, voici ma demande d\'accès à mon dossier.',
          createdAt: '2024-12-27T16:45:00Z',
          patient: {
            id: 'patient-5',
            firstName: 'Lucie',
            lastName: 'Petit',
            email: 'lucie.petit@email.com',
            profilePicture: null,
            age: 32
          }
        }
      ]
    });
  }

  /**
   * Rendez-vous d'aujourd'hui mockés (conforme à l'API /api/rendez-vous)
   */
  getMockRendezVousAujourdhui(): Observable<any> {
    const today = new Date().toISOString().split('T')[0];
    
    return of({
      success: true,
      data: [
        {
          id: 'rdv-1',
          patientId: 'patient-1',
          medecinId: 'mock-doctor-id',
          dateRendezVous: `${today}T14:30:00Z`,
          duree: 30,
          motif: 'Consultation de suivi',
          statut: 'CONFIRME',
          notes: null,
          patient: {
            id: 'patient-1',
            firstName: 'Marie',
            lastName: 'Dubois',
            profilePicture: null
          }
        },
        {
          id: 'rdv-2',
          patientId: 'patient-2',
          medecinId: 'mock-doctor-id',
          dateRendezVous: `${today}T16:00:00Z`,
          duree: 45,
          motif: 'Contrôle médical',
          statut: 'PLANIFIE',
          notes: null,
          patient: {
            id: 'patient-2',
            firstName: 'Jean',
            lastName: 'Dupont',
            profilePicture: null
          }
        }
      ]
    });
  }

  /**
   * Messages non lus mockés (conforme à l'API /api/messages/count-unread)
   */
  getMockMessagesNonLus(): Observable<any> {
    return of({
      success: true,
      data: {
        count: 5
      }
    });
  }

  /**
   * Conversations mockées (conforme à l'API /api/messages/conversations)
   */
  getMockConversations(): Observable<any> {
    return of({
      success: true,
      data: [
        {
          autreUtilisateur: {
            id: 'patient-1',
            firstName: 'Marie',
            lastName: 'Dubois',
            email: 'marie.dubois@email.com',
            profilePicture: null,
            role: 'PATIENT'
          },
          dernierMessage: {
            contenu: 'Merci pour la consultation docteur',
            date: '2024-12-28T10:30:00Z',
            lu: false
          },
          messagesNonLus: 2
        },
        {
          autreUtilisateur: {
            id: 'patient-2',
            firstName: 'Jean',
            lastName: 'Dupont',
            email: 'jean.dupont@email.com',
            profilePicture: null,
            role: 'PATIENT'
          },
          dernierMessage: {
            contenu: 'J\'ai une question sur mon traitement',
            date: '2024-12-27T15:20:00Z',
            lu: true
          },
          messagesNonLus: 0
        }
      ]
    });
  }

  /**
   * Messages d'une conversation mockés (conforme à l'API /api/messages/conversations/:id)
   */
  getMockMessages(patientId: string): Observable<any> {
    return of({
      success: true,
      data: [
        {
          id: 'msg-1',
          expediteurId: patientId,
          destinataireId: 'mock-doctor-id',
          contenu: 'Bonjour docteur, j\'ai une question concernant mon traitement.',
          objet: null,
          lu: true,
          createdAt: '2024-12-28T09:00:00Z',
          expediteur: {
            id: patientId,
            firstName: 'Marie',
            lastName: 'Dubois',
            profilePicture: null
          }
        },
        {
          id: 'msg-2',
          expediteurId: 'mock-doctor-id',
          destinataireId: patientId,
          contenu: 'Bonjour ! Je suis à votre disposition. Quelle est votre question ?',
          objet: null,
          lu: true,
          createdAt: '2024-12-28T09:15:00Z',
          expediteur: {
            id: 'mock-doctor-id',
            firstName: 'Jean',
            lastName: 'Martin',
            profilePicture: null
          }
        }
      ]
    });
  }

  /**
   * Spécialités médicales (conforme au backend)
   */
  getSpecialites(): string[] {
    return [
      'Médecine générale',
      'Cardiologie',
      'Dermatologie',
      'Endocrinologie',
      'Gastro-entérologie',
      'Gynécologie',
      'Neurologie',
      'Ophtalmologie',
      'Orthopédie',
      'Pédiatrie',
      'Pneumologie',
      'Psychiatrie',
      'Radiologie',
      'Rhumatologie',
      'Urologie'
    ];
  }

  /**
   * Statuts des rendez-vous (conforme au backend)
   */
  getStatutsRendezVous(): string[] {
    return ['PLANIFIE', 'CONFIRME', 'ANNULE', 'TERMINE'];
  }

  /**
   * Types d'accès aux dossiers (conforme au backend)
   */
  getTypesAcces(): string[] {
    return ['COMPLET', 'LIMITE', 'LECTURE_SEULE'];
  }
}