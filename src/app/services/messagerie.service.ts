import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { SocketChatService } from './socket-chat.service';

export interface Conversation {
  id: string;
  autreUtilisateur: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    photoUrl?: string;
    role: string;
  };
  dernierMessage: {
    contenu: string;
    date: string;
    lu: boolean;
  };
  messagesNonLus: number;
}

export interface Message {
  id: string;
  expediteurId: string;
  destinataireId: string;
  contenu: string;
  objet?: string;
  lu: boolean;
  createdAt: string;
  dateEnvoi: string;
  isMedecin: boolean;
  expediteur?: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class MessagerieService {
  private http = inject(HttpClient);
  private socketService = inject(SocketChatService);
  private apiUrl = environment.apiUrl;

  // Subject pour notifier les nouveaux messages reçus via Socket.IO
  private newMessageSubject = new BehaviorSubject<Message | null>(null);
  public newMessage$ = this.newMessageSubject.asObservable();

  constructor() {
    // Écouter les nouveaux messages via Socket.IO
    this.socketService.messageReceived$.subscribe(socketMessage => {
      // Convertir le message Socket.IO au format Message
      const message: Message = {
        id: socketMessage.id,
        expediteurId: socketMessage.expediteurId,
        destinataireId: socketMessage.destinataireId,
        contenu: socketMessage.contenu,
        objet: socketMessage.objet,
        lu: false,
        createdAt: socketMessage.dateEnvoi,
        dateEnvoi: socketMessage.dateEnvoi,
        isMedecin: false, // Sera déterminé par le composant
        expediteur: socketMessage.expediteur
      };
      
      this.newMessageSubject.next(message);
    });
  }

  /**
   * Récupérer toutes les conversations
   */
  getConversations(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/messages/conversations`);
  }

  /**
   * Récupérer les messages d'une conversation
   */
  getMessages(autreUtilisateurId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/messages/conversations/${autreUtilisateurId}`);
  }

  /**
   * Envoyer un message (avec Socket.IO si connecté, sinon HTTP)
   */
  envoyerMessage(destinataireId: string, contenu: string, objet?: string): Observable<any> {
    // Envoyer via Socket.IO si connecté
    if (this.socketService.isConnected()) {
      this.socketService.sendMessage(destinataireId, contenu, objet);
      // Retourner un Observable vide pour maintenir la compatibilité
      return new Observable(observer => {
        observer.next({ success: true, method: 'socket' });
        observer.complete();
      });
    }

    // Fallback vers HTTP si Socket.IO non disponible
    return this.http.post<any>(`${this.apiUrl}/messages`, {
      destinataireId,
      contenu,
      objet
    });
  }

  /**
   * Marquer un message comme lu (avec Socket.IO si connecté, sinon HTTP)
   */
  marquerCommeLu(messageId: string): Observable<any> {
    // Marquer via Socket.IO si connecté
    if (this.socketService.isConnected()) {
      this.socketService.markMessageAsRead(messageId);
      // Retourner un Observable vide pour maintenir la compatibilité
      return new Observable(observer => {
        observer.next({ success: true, method: 'socket' });
        observer.complete();
      });
    }

    // Fallback vers HTTP si Socket.IO non disponible
    return this.http.patch<any>(`${this.apiUrl}/messages/${messageId}/lu`, {});
  }

  /**
   * Rechercher des médecins (pour les patients)
   */
  rechercherMedecins(params?: { specialite?: string; nom?: string }): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/messages/medecins/recherche`, { params: params as any });
  }
}
