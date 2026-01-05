import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SocketMessage {
  id: string;
  expediteurId: string;
  destinataireId: string;
  contenu: string;
  objet?: string;
  dateEnvoi: string;
  expediteur: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
}

export interface UserStatus {
  userId: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface TypingIndicator {
  userId: string;
  conversationId: string;
  isTyping: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SocketChatService {
  private socket: Socket | null = null;
  private readonly API_URL = environment.apiUrl;

  // Observables pour les événements
  private connectedSubject = new BehaviorSubject<boolean>(false);
  private messageReceivedSubject = new Subject<SocketMessage>();
  private messageReadSubject = new Subject<{ messageId: string; userId: string }>();
  private userStatusSubject = new Subject<UserStatus>();
  private typingSubject = new Subject<TypingIndicator>();
  private onlineUsersSubject = new BehaviorSubject<string[]>([]);

  // Observables publics
  public connected$ = this.connectedSubject.asObservable();
  public messageReceived$ = this.messageReceivedSubject.asObservable();
  public messageRead$ = this.messageReadSubject.asObservable();
  public userStatus$ = this.userStatusSubject.asObservable();
  public typing$ = this.typingSubject.asObservable();
  public onlineUsers$ = this.onlineUsersSubject.asObservable();

  constructor() {
    // La connexion sera gérée manuellement par l'AuthService
  }

  /**
   * Se connecter au serveur Socket.IO avec gestion d'erreur améliorée
   */
  connect(): void {
    if (this.socket?.connected) {
      console.log('🔌 Socket déjà connecté');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('❌ Token d\'authentification manquant pour Socket.IO');
      return;
    }

    // Extraire l'URL de base pour Socket.IO (enlever /api)
    const socketUrl = this.API_URL.replace(/\/api$/, '');
    console.log(`🔌 Connexion à Socket.IO sur ${socketUrl}...`);

    this.socket = io(socketUrl, {
      auth: {
        token: token
      },
      query: {
        userType: 'DOCTOR' // Identifier le type d'utilisateur
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true // Force une nouvelle connexion
    });

    this.setupEventListeners();
  }

  /**
   * Se déconnecter du serveur Socket.IO
   */
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Déconnexion de Socket.IO');
      this.socket.disconnect();
      this.socket = null;
      this.connectedSubject.next(false);
    }
  }

  /**
   * Configurer les écouteurs d'événements
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Événements de connexion
    this.socket.on('connect', () => {
      console.log('✅ Connecté à Socket.IO');
      this.connectedSubject.next(true);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erreur de connexion Socket.IO:', error);
      this.connectedSubject.next(false);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Déconnecté de Socket.IO:', reason);
      this.connectedSubject.next(false);
    });

    // Événements de messagerie avec logs détaillés
    this.socket.on('message:new', (message: SocketMessage) => {
      console.log('📨 Nouveau message reçu (message:new):', {
        id: message.id,
        expediteur: message.expediteur?.firstName,
        contenu: message.contenu?.substring(0, 50)
      });
      this.messageReceivedSubject.next(message);
    });

    this.socket.on('message:sent', (message: SocketMessage) => {
      console.log('✅ Message envoyé confirmation (message:sent):', {
        id: message.id,
        contenu: message.contenu?.substring(0, 50)
      });
      this.messageReceivedSubject.next(message);
    });

    this.socket.on('message:received', (message: SocketMessage) => {
      console.log('📨 Message reçu directement (message:received):', {
        id: message.id,
        expediteur: message.expediteur?.firstName,
        contenu: message.contenu?.substring(0, 50)
      });
      this.messageReceivedSubject.next(message);
    });

    // Événement de confirmation de connexion
    this.socket.on('connection:confirmed', (data) => {
      console.log('✅ Connexion Socket.IO confirmée:', data);
    });

    // Événement de mise à jour des conversations
    this.socket.on('conversation:updated', (data) => {
      console.log('🔄 Conversation mise à jour:', data);
      // Ici on pourrait émettre un événement pour recharger les conversations
    });

    this.socket.on('message:read:notification', (data: { messageId: string; userId: string }) => {
      console.log('👁️ Message lu:', data);
      this.messageReadSubject.next(data);
    });

    // Événements de présence
    this.socket.on('user:online', (user: { userId: string; user: any }) => {
      console.log('🟢 Utilisateur en ligne:', user);
      this.userStatusSubject.next({
        userId: user.userId,
        isOnline: true
      });
    });

    this.socket.on('user:offline', (user: { userId: string }) => {
      console.log('🔴 Utilisateur hors ligne:', user);
      this.userStatusSubject.next({
        userId: user.userId,
        isOnline: false
      });
    });

    this.socket.on('users:online', (users: string[]) => {
      console.log('👥 Utilisateurs en ligne:', users);
      this.onlineUsersSubject.next(users);
    });

    // Événements de frappe
    this.socket.on('typing:start', (data: { userId: string; conversationId: string }) => {
      console.log('✍️ Utilisateur en train d\'écrire:', data);
      this.typingSubject.next({
        userId: data.userId,
        conversationId: data.conversationId,
        isTyping: true
      });
    });

    this.socket.on('typing:stop', (data: { userId: string; conversationId: string }) => {
      console.log('✋ Utilisateur arrête d\'écrire:', data);
      this.typingSubject.next({
        userId: data.userId,
        conversationId: data.conversationId,
        isTyping: false
      });
    });
  }

  /**
   * Envoyer un message via Socket.IO avec logs détaillés
   */
  sendMessage(destinataireId: string, contenu: string, objet?: string): void {
    if (!this.socket?.connected) {
      console.error('❌ Socket non connecté, impossible d\'envoyer le message');
      return;
    }

    console.log('📤 Envoi message via Socket.IO:', {
      destinataireId,
      contenu: contenu.substring(0, 50) + '...',
      objet
    });

    this.socket.emit('message:send', {
      destinataireId,
      contenu,
      objet
    });
  }

  /**
   * Marquer un message comme lu
   */
  markMessageAsRead(messageId: string): void {
    if (!this.socket?.connected) {
      console.error('Socket non connecté');
      return;
    }

    this.socket.emit('message:read', { messageId });
  }

  /**
   * Indiquer qu'on commence à écrire
   */
  startTyping(conversationId: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('typing:start', { conversationId });
  }

  /**
   * Indiquer qu'on arrête d'écrire
   */
  stopTyping(conversationId: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('typing:stop', { conversationId });
  }

  /**
   * Demander le statut d'un utilisateur
   */
  requestUserStatus(userId: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('user:status', { userId });
  }

  /**
   * Vérifier si le socket est connecté
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Obtenir l'ID du socket
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}