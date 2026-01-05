import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface DemandeConnexion {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhoto?: string;
  message: string;
  dateCreation: string;
  statut: 'EN_ATTENTE' | 'ACCEPTE' | 'REFUSE';
}

export interface PatientConnecte {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  photoUrl?: string;
  phone?: string;
  dateConnexion: string;
}

export interface DossierPatient {
  id: string;
  patientId: string;
  titre: string;
  description?: string;
  type: string;
  createdAt: string;
  documents?: any[];
  ordonnances?: any[];
  allergies?: any[];
  commentaires?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class MedecinApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Récupérer les demandes de connexion reçues
   */
  getDemandesConnexion(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/connexions/demandes/medecin`);
  }

  /**
   * Répondre à une demande de connexion
   */
  repondreDemandeConnexion(demandeId: string, reponse: 'accepter' | 'refuser', raisonRefus?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/connexions/demandes/${demandeId}/repondre`, {
      reponse,
      raisonRefus
    });
  }

  /**
   * Récupérer la liste des patients connectés avec le nombre réel de dossiers accessibles
   */
  getPatientsConnectes(): Observable<any> {
    console.log('🔍 Appel API: Récupération des patients connectés...');
    console.log('🌐 URL:', `${this.apiUrl}/connexions/demandes/medecin?statut=ACCEPTEE&includeDossiers=true`);
    
    // Vérifier le token d'authentification
    const token = localStorage.getItem('accessToken');
    console.log('🔑 Token présent:', !!token);
    if (token) {
      console.log('🔑 Token (premiers caractères):', token.substring(0, 20) + '...');
    }
    
    // ✅ Utiliser la route existante pour les connexions acceptées avec info dossiers
    return this.http.get<any>(`${this.apiUrl}/connexions/demandes/medecin?statut=ACCEPTEE&includeDossiers=true`).pipe(
      tap((response: any) => {
        console.log('✅ Réponse API patients connectés:', response);
        if (response.success && response.data) {
          console.log('📊 Nombre de patients connectés:', response.data.length);
          if (response.data.length > 0) {
            console.log('👥 Premiers patients:', response.data.slice(0, 2).map((demande: any) => ({
              id: demande.patient.id,
              nom: `${demande.patient.firstName} ${demande.patient.lastName}`,
              email: demande.patient.email,
              statut: demande.statut,
              dateConnexion: demande.dateReponse,
              nombreDossiers: demande.nombreDossiersAccessibles || 0
            })));
          } else {
            console.log('⚠️ Aucun patient connecté trouvé dans la réponse API');
          }
        } else {
          console.log('⚠️ Réponse API invalide ou pas de données');
        }
      }),
      catchError(error => {
        console.error('❌ Erreur API patients connectés:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Message:', error.message);
        if (error.error) {
          console.error('❌ Détails erreur:', error.error);
        }
        // Retourner une erreur au lieu de données mockées
        throw error;
      })
    );
  }

  /**
   * Récupérer les dossiers d'un patient
   */
  getDossiersPatient(patientId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dossiers?patientId=${patientId}`);
  }

  /**
   * Récupérer un dossier complet
   */
  getDossierComplet(dossierId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dossiers/dossier/${dossierId}`);
  }

  /**
   * Ajouter une ordonnance
   */
  ajouterOrdonnance(dossierId: string, data: {
    medicament: string;
    dosage: string;
    duree: string;
    instructions?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/dossiers/${dossierId}/ordonnances`, data);
  }

  /**
   * Ajouter un commentaire/diagnostic
   */
  ajouterCommentaire(dossierId: string, contenu: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/dossiers/${dossierId}/commentaires`, {
      contenu
    });
  }

  /**
   * Récupérer le profil du médecin
   */
  getProfilMedecin(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auth/profile`);
  }

  /**
   * Mettre à jour le profil
   */
  updateProfil(data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/auth/profile`, data);
  }

  /**
   * Récupérer les demandes de connexion en attente (pour le layout)
   */
  getPendingConnectionRequests(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/connexions/demandes/medecin?statut=EN_ATTENTE`);
  }

  /**
   * Récupérer le nombre de messages non lus
   */
  getUnreadMessagesCount(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/messages/count-unread`);
  }

  /**
   * Récupérer les rendez-vous d'aujourd'hui
   */
  getRendezVousAujourdhui(): Observable<any> {
    const today = new Date().toISOString().split('T')[0];
    return this.http.get<any>(`${this.apiUrl}/rendez-vous?date=${today}`);
  }

  /**
   * Récupérer les rendez-vous à venir (prochains 7 jours)
   */
  getRendezVousProchains(): Observable<any> {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return this.http.get<any>(`${this.apiUrl}/rendez-vous?dateDebut=${today.toISOString().split('T')[0]}&dateFin=${nextWeek.toISOString().split('T')[0]}&statut=PLANIFIE,CONFIRME`).pipe(
      catchError(() => of({ success: true, data: [] }))
    );
  }

  /**
   * Récupérer les messages non lus
   */
  getMessagesNonLus(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/messages?lu=false`);
  }

  /**
   * Créer un rendez-vous
   */
  creerRendezVous(data: {
    patientId: string;
    dateRendezVous: string;
    duree: number;
    motif: string;
    notes?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/rendez-vous`, data);
  }

  /**
   * Envoyer un message à un patient
   */
  envoyerMessage(data: {
    destinataireId: string;
    objet: string;
    contenu: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/messages`, data);
  }

  /**
   * Récupérer les conversations
   */
  getConversations(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/messages/conversations`);
  }

  /**
   * Récupérer les messages d'une conversation
   */
  getMessagesConversation(userId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/messages/conversations/${userId}`);
  }

  /**
   * Marquer un message comme lu
   */
  marquerMessageLu(messageId: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/messages/${messageId}/lu`, {});
  }
}
