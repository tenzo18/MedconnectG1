import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { MessagerieService, Conversation, Message } from '../../../services/messagerie.service';
import { SocketChatService, UserStatus, TypingIndicator } from '../../../services/socket-chat.service';
import { AuthService } from '../../../services/auth.service';
import { MedecinApiService } from '../../services/medecin-api.service';
import { AlertService } from '../../../services/alert.service';

interface ExtendedConversation extends Omit<Conversation, 'dernierMessage' | 'messagesNonLus'> {
  patientId: string;
  patientName: string;
  photoUrl: string;
  dernierMessage: string;
  dernierMessageType: 'sent' | 'received';
  dateCreation: Date;
  nonLus: number;
  isUrgent?: boolean;
  hasAttachment?: boolean;
  autreUtilisateur: any;
}

interface ExtendedMessage extends Omit<Message, 'lu'> {
  lu?: boolean;
  attachment?: {
    name: string;
    url: string;
    type: string;
  };
}

import { LoadingSpinnerComponent } from '../../../components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-messagerie',
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
  templateUrl: './messagerie.html',
  styleUrl: './messagerie.scss',
})
export class Messagerie implements OnInit, OnDestroy {
  private messagerieService = inject(MessagerieService);
  private socketService = inject(SocketChatService);
  private authService = inject(AuthService);
  private medecinApi = inject(MedecinApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private alertService = inject(AlertService);

  @ViewChild('chatWindow') chatWindow!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  conversations: ExtendedConversation[] = [];
  filteredConversations: ExtendedConversation[] = [];
  messages: ExtendedMessage[] = [];
  activeConversation: ExtendedConversation | null = null;

  newMessageContent: string = '';
  searchTerm: string = '';

  loading: boolean = true;
  loadingMessages: boolean = false;
  sending: boolean = false;
  isTyping: boolean = false;

  error: string = '';
  currentUser: any;
  currentUserId: string = '';

  // Réponses rapides
  showQuickReplies: boolean = true;
  quickReplies: string[] = [
    'Merci pour votre message',
    'Je vous recontacte bientôt',
    'Prenez rendez-vous',
    'Consultez votre dossier'
  ];

  // Gestion des états
  onlinePatients: Set<string> = new Set();
  typingUsers: Map<string, boolean> = new Map(); // userId -> isTyping
  socketConnected: boolean = false;
  typingTimeout: any;

  private refreshSubscription?: Subscription;
  private typingSubscription?: Subscription;
  private socketSubscriptions: Subscription[] = [];

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUserId = user.id;
      this.currentUser = user;
    }

    this.socketService.connect();
    this.loadConversations();
    this.setupSocketListeners();
    this.startAutoRefresh();

    // Gérer le paramètre patientId s'il est présent
    this.route.queryParams.subscribe(params => {
      const patientId = params['patientId'];
      if (patientId) {
        this.handleInitialPatientSelection(patientId);
      }
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
    this.typingSubscription?.unsubscribe();

    // Nettoyer les abonnements Socket.IO
    this.socketSubscriptions.forEach(sub => sub.unsubscribe());

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  private startAutoRefresh(): void {
    // Actualiser les conversations toutes les 30 secondes seulement si Socket.IO n'est pas connecté
    this.refreshSubscription = interval(30000).subscribe(() => {
      if (!this.socketConnected) {
        this.refreshConversations();
      }
    });
  }

  /**
   * Configurer les écouteurs Socket.IO
   */
  private setupSocketListeners(): void {
    // Écouter l'état de connexion Socket.IO
    const connectionSub = this.socketService.connected$.subscribe(connected => {
      this.socketConnected = connected;
      console.log(`Socket.IO ${connected ? 'connecté' : 'déconnecté'}`);
    });
    this.socketSubscriptions.push(connectionSub);

    // Écouter les nouveaux messages
    const messageSub = this.messagerieService.newMessage$.subscribe(message => {
      if (message) {
        this.handleNewMessage(message);
      }
    });
    this.socketSubscriptions.push(messageSub);

    // Écouter les statuts des utilisateurs
    const statusSub = this.socketService.userStatus$.subscribe(status => {
      this.handleUserStatusChange(status);
    });
    this.socketSubscriptions.push(statusSub);

    // Écouter les utilisateurs en ligne
    const onlineUsersSub = this.socketService.onlineUsers$.subscribe(users => {
      this.onlinePatients = new Set(users);
    });
    this.socketSubscriptions.push(onlineUsersSub);

    // Écouter les indicateurs de frappe
    const typingSub = this.socketService.typing$.subscribe(typing => {
      this.handleTypingIndicator(typing);
    });
    this.socketSubscriptions.push(typingSub);

    // Écouter les messages lus
    const readSub = this.socketService.messageRead$.subscribe(data => {
      this.handleMessageRead(data.messageId, data.userId);
    });
    this.socketSubscriptions.push(readSub);

    // Écouter les mises à jour des compteurs (non implémenté dans le service mais l'événement existe)
    // On peut écouter l'événement socket directement si le service ne l'expose pas encore
    if (this.socketService['socket']) {
      this.socketService['socket'].on('message:unread_count', (data: { count: number }) => {
        console.log('🔢 Mise à jour compteur non lus:', data.count);
        // Ici on pourrait mettre à jour un compteur global si nécessaire
        // Pour les conversations, c'est handleNewMessage qui s'en charge
      });
    }
  }

  /**
   * Gérer un nouveau message reçu via Socket.IO
   */
  private handleNewMessage(message: Message): void {
    console.log('📨 Nouveau message reçu via Socket.IO:', message);

    // Si c'est la conversation active, ajouter le message immédiatement
    if (this.activeConversation && this.activeConversation.autreUtilisateur &&
      (message.expediteurId === this.activeConversation.autreUtilisateur.id ||
        message.destinataireId === this.activeConversation.autreUtilisateur.id)) {

      // Vérifier que le message n'existe pas déjà
      const messageExists = this.messages.some(m => m.id === message.id);
      if (!messageExists) {
        console.log('➕ Ajout du message à la conversation active');
        this.messages.push(message);
        this.scrollToBottom();

        // Marquer comme lu si c'est un message reçu
        if (message.expediteurId !== this.currentUserId) {
          this.messagerieService.marquerCommeLu(message.id).subscribe();
        }
      } else {
        console.log('⚠️ Message déjà présent, ignoré');
      }
    }

    // Mise à jour instantanée de la liste des conversations
    this.updateConversationList(message);

    // Actualiser en arrière-plan pour garanir la cohérence
    // setTimeout(() => this.refreshConversations(), 2000);
  }

  /**
   * Mettre à jour la liste des conversations instantanément
   */
  private updateConversationList(message: Message | ExtendedMessage): void {
    const otherUserId = message.expediteurId === this.currentUserId ? message.destinataireId : message.expediteurId;

    // Trouver la conversation existante
    const existingConvIndex = this.conversations.findIndex(c => c.patientId === otherUserId);

    if (existingConvIndex > -1) {
      // Mettre à jour la conversation existante
      const conv = this.conversations[existingConvIndex];
      conv.dernierMessage = message.contenu;
      conv.dernierMessageType = message.expediteurId === this.currentUserId ? 'sent' : 'received';
      conv.dateCreation = new Date(message.dateEnvoi || message.createdAt || new Date());

      // Incrémenter non-lus seulement si ce n'est pas la conversation active ET que ce n'est pas un message envoyé par moi
      if (this.activeConversation?.id !== conv.id && message.expediteurId !== this.currentUserId) {
        conv.nonLus = (conv.nonLus || 0) + 1;
      }

      // Déplacer en haut de la liste
      this.conversations.splice(existingConvIndex, 1);
      this.conversations.unshift(conv);
    } else {
      // Nouvelle conversation (cas rare via socket, mais possible)
      // On rechargera la liste complète car il manque les infos utilisateurs
      this.refreshConversations();
    }

    // Mettre à jour la liste filtrée
    this.filterConversations();
  }

  /**
   * Gérer le changement de statut d'un utilisateur
   */
  private handleUserStatusChange(status: UserStatus): void {
    if (status.isOnline) {
      this.onlinePatients.add(status.userId);
    } else {
      this.onlinePatients.delete(status.userId);
    }
  }

  /**
   * Gérer les indicateurs de frappe
   */
  private handleTypingIndicator(typing: TypingIndicator): void {
    if (typing.userId !== this.currentUserId) {
      this.typingUsers.set(typing.userId, typing.isTyping);

      // Supprimer l'indicateur après 3 secondes si pas d'update
      if (typing.isTyping) {
        setTimeout(() => {
          if (this.typingUsers.get(typing.userId)) {
            this.typingUsers.set(typing.userId, false);
          }
        }, 3000);
      }
    }
  }

  /**
   * Gérer la confirmation de lecture d'un message
   */
  private handleMessageRead(messageId: string, userId: string): void {
    // Mettre à jour le statut de lecture dans les messages affichés
    const message = this.messages.find(m => m.id === messageId);
    if (message) {
      message.lu = true;
    }
  }

  private simulateOnlinePatients(): void {
    // Les statuts réels sont gérés par Socket.IO
  }

  loadConversations(): void {
    this.loading = true;
    this.error = '';

    console.log('🔄 Chargement des conversations médecin...');

    this.messagerieService.getConversations().subscribe({
      next: (response) => {
        console.log('📋 Réponse API conversations:', response);

        if (response.success && response.data) {
          // Filtrer les conversations dont l'autre utilisateur est manquant pour éviter les erreurs
          const validConversations = response.data
            .filter((conv: any) => {
              if (!conv || !conv.utilisateur) {
                console.warn('⚠️ Conversation sans utilisateur ignorée:', conv);
                return false;
              }
              return true;
            });

          console.log('✅ Conversations valides trouvées:', validConversations.length);

          this.conversations = validConversations.map((conv: any) => {
            const utilisateur = conv.utilisateur;
            const conversation = {
              id: utilisateur.id,
              patientId: utilisateur.id,
              patientName: `${utilisateur.firstName || ''} ${utilisateur.lastName || ''}`.trim() || 'Utilisateur inconnu',
              photoUrl: utilisateur.profilePicture || 'icon.png',
              dernierMessage: conv.dernierMessage?.contenu || 'Nouvelle conversation',
              dernierMessageType: conv.dernierMessage?.expediteur === this.currentUserId ? 'sent' : 'received',
              dateCreation: new Date(conv.dernierMessage?.dateEnvoi || conv.createdAt || Date.now()),
              nonLus: conv.messagesNonLus || 0,
              isUrgent: false,
              hasAttachment: false,
              autreUtilisateur: utilisateur
            };

            console.log('📋 Conversation mappée:', {
              id: conversation.id,
              patientName: conversation.patientName,
              dernierMessage: conversation.dernierMessage,
              nonLus: conversation.nonLus
            });

            return conversation;
          });

          this.filteredConversations = [...this.conversations];

          console.log('✅ Total conversations chargées:', this.conversations.length);

          // Charger la première conversation par défaut
          if (this.conversations.length > 0 && !this.activeConversation) {
            console.log('🎯 Sélection de la première conversation par défaut');
            this.selectConversation(this.conversations[0]);
          } else if (this.conversations.length === 0) {
            console.log('ℹ️ Aucune conversation trouvée');
          }
        } else {
          console.warn('⚠️ Réponse API sans données:', response);
          this.conversations = [];
          this.filteredConversations = [];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des conversations:', error);
        this.error = 'Impossible de charger les conversations';
        this.conversations = [];
        this.filteredConversations = [];
        this.loading = false;
      }
    });
  }

  private handleInitialPatientSelection(patientId: string): void {
    // 1. Chercher dans les conversations existantes
    const conv = this.conversations.find(c => c.patientId === patientId);
    if (conv) {
      this.selectConversation(conv);
      return;
    }

    // 2. Si non trouvé, chercher dans les patients connectés pour créer une conversation virtuelle
    this.medecinApi.getPatientsConnectes().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Trouver le patient dans les demandes ACCEPTÉES
          const demande = response.data.find((d: any) => d.patient.id === patientId && d.statut === 'ACCEPTEE');
          if (demande) {
            const virtualConv: ExtendedConversation = {
              id: patientId, // Utiliser le patientId comme id temporaire
              patientId: patientId,
              patientName: `${demande.patient.firstName || ''} ${demande.patient.lastName || ''}`.trim(),
              photoUrl: demande.patient.profilePicture || 'icon.png',
              dernierMessage: 'Discussion démarrée',
              dernierMessageType: 'received',
              dateCreation: new Date(),
              nonLus: 0,
              autreUtilisateur: demande.patient
            };

            this.conversations.unshift(virtualConv);
            this.filteredConversations = [...this.conversations];
            this.selectConversation(virtualConv);
          } else {
            console.warn('Patient non trouvé ou non connecté:', patientId);
          }
        }
      },
      error: (err) => console.error('Erreur lors de la récupération du patient pour messagerie:', err)
    });
  }



  filterConversations(): void {
    if (!this.searchTerm.trim()) {
      this.filteredConversations = [...this.conversations];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredConversations = this.conversations.filter(conv =>
      conv.patientName.toLowerCase().includes(term) ||
      conv.dernierMessage.toLowerCase().includes(term)
    );
  }

  selectConversation(conv: ExtendedConversation): void {
    this.activeConversation = conv;
    conv.nonLus = 0;
    this.loadMessages(conv.patientId);
    this.scrollToBottom();
  }

  loadMessages(patientId: string): void {
    this.loadingMessages = true;

    console.log('🔄 Chargement messages pour patient:', patientId);

    this.messagerieService.getMessages(patientId).subscribe({
      next: (response) => {
        console.log('📋 Messages reçus:', response);

        if (response.success && response.data) {
          // Trier les messages par date (plus anciens en premier)
          const sortedMessages = response.data.sort((a: any, b: any) => {
            const dateA = new Date(a.dateEnvoi).getTime();
            const dateB = new Date(b.dateEnvoi).getTime();
            return dateA - dateB; // Ordre chronologique (anciens → récents)
          });

          this.messages = sortedMessages.map((msg: any) => ({
            ...msg,
            isMedecin: msg.expediteur?.id === this.currentUserId || msg.expediteurId === this.currentUserId,
            dateEnvoi: msg.dateEnvoi,
            lu: msg.confirmationLecture,
            attachment: undefined
          }));

          console.log('✅ Messages triés par ordre chronologique:', this.messages.length);

          // Marquer les messages non lus comme lus
          this.messages
            .filter(msg => !msg.lu && !msg.isMedecin)
            .forEach(msg => {
              this.messagerieService.marquerCommeLu(msg.id).subscribe();
            });
        }
        this.loadingMessages = false;

        // Scroll vers le bas (messages les plus récents) après chargement
        setTimeout(() => {
          this.scrollToBottom();
          console.log('📍 Scroll vers le bas effectué');
        }, 100);
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des messages:', error);
        this.loadingMessages = false;
      }
    });
  }



  // Méthodes de gestion des messages
  sendMessage(): void {
    if (!this.canSendMessage()) return;

    this.sending = true;
    const contenu = this.newMessageContent.trim();
    const destinataireId = this.activeConversation!.patientId;

    console.log('📤 Envoi message médecin:', { destinataireId, contenu: contenu.substring(0, 50) });

    // Créer un message temporaire pour l'affichage immédiat (optimistic UI)
    const tempMessage: ExtendedMessage = {
      id: `temp-${Date.now()}`,
      expediteurId: this.currentUserId,
      destinataireId: destinataireId,
      contenu: contenu,
      lu: false,
      createdAt: new Date().toISOString(),
      dateEnvoi: new Date().toISOString(),
      isMedecin: true,
      expediteur: {
        id: this.currentUserId,
        firstName: 'Vous',
        lastName: ''
      }
    };

    // Ajouter immédiatement le message temporaire
    this.messages.push(tempMessage);
    this.scrollToBottom();

    this.messagerieService.envoyerMessage(destinataireId, contenu).subscribe({
      next: (response) => {
        console.log('✅ Message envoyé:', response);

        let realMessage: ExtendedMessage | undefined;

        // Si envoyé via Socket.IO, le message sera reçu via handleNewMessage
        if (response.method === 'socket') {
          console.log('📡 Message envoyé via Socket.IO, attente de confirmation');
          // Supprimer le message temporaire, le vrai arrivera via Socket.IO
          this.messages = this.messages.filter(m => m.id !== tempMessage.id);
        } else {
          // Si envoyé via HTTP, remplacer le message temporaire par le vrai
          console.log('🌐 Message envoyé via HTTP, remplacement du temporaire');
          realMessage = {
            id: response.data?.message?.id || Date.now().toString(),
            expediteurId: this.currentUserId,
            destinataireId: destinataireId,
            contenu: contenu,
            lu: false,
            createdAt: new Date().toISOString(),
            dateEnvoi: new Date().toISOString(),
            isMedecin: true,
            expediteur: {
              id: this.currentUserId,
              firstName: 'Vous',
              lastName: ''
            }
          };

          // Remplacer le message temporaire
          const tempIndex = this.messages.findIndex(m => m.id === tempMessage.id);
          if (tempIndex !== -1) {
            this.messages[tempIndex] = realMessage;
          }
        }

        if (this.activeConversation) {
          this.activeConversation.dernierMessage = contenu;
          this.activeConversation.dernierMessageType = 'sent';
          this.activeConversation.dateCreation = new Date();
        }

        // Mise à jour instantanée de la liste des conversations
        let messageForUpdate: ExtendedMessage = tempMessage;

        if (response.method !== 'socket' && typeof realMessage !== 'undefined') {
          messageForUpdate = realMessage;
        }

        this.updateConversationList({
          ...messageForUpdate,
          dateEnvoi: messageForUpdate.dateEnvoi || messageForUpdate.createdAt || new Date().toISOString()
        });

        this.newMessageContent = '';
        this.sending = false;

        // Arrêter l'indicateur de frappe
        if (this.socketService.isConnected()) {
          this.socketService.stopTyping(destinataireId);
        }
      },
      error: (error) => {
        console.error('❌ Erreur envoi message:', error);

        // Supprimer le message temporaire en cas d'erreur
        this.messages = this.messages.filter(m => m.id !== tempMessage.id);

        this.showErrorMessage('Erreur lors de l\'envoi du message');
        this.sending = false;
      }
    });
  }

  canSendMessage(): boolean {
    return !!(this.newMessageContent.trim() && this.activeConversation && !this.sending);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Ajuster la hauteur du textarea automatiquement (style WhatsApp)
   */
  resizeTextarea(event: any): void {
    const textarea = event.target;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 150); // Max 150px
    textarea.style.height = newHeight + 'px';
  }

  onTyping(): void {
    if (!this.activeConversation || !this.socketService.isConnected()) {
      return;
    }

    const conversationId = this.activeConversation.patientId;

    // Démarrer l'indicateur de frappe
    this.socketService.startTyping(conversationId);

    // Arrêter l'indicateur après 1 seconde d'inactivité
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      this.socketService.stopTyping(conversationId);
    }, 1000);
  }

  // Méthodes utilitaires
  getConversationClass(conv: ExtendedConversation): string {
    const baseClass = 'group p-4 flex items-center gap-4  cursor-pointer transition-all duration-300 mb-2 hover:shadow-md';

    if (this.activeConversation && this.activeConversation.id === conv.id) {
      return `${baseClass}  border-2 border-blue-200 dark:border-blue-700`;
    }

    return `${baseClass}   hover:bg-gray-50 dark:hover:bg-gray-700`;
  }

  getMessageClass(message: ExtendedMessage): string {
    if (message.isMedecin) {
      return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white ml-auto';
    }
    return ' dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600';
  }

  isPatientOnline(patientId: string): boolean {
    return this.onlinePatients.has(patientId);
  }

  isPatientTyping(patientId: string): boolean {
    return this.typingUsers.get(patientId) || false;
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} h`;
    if (diffDays < 7) return `${diffDays} j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  getAvatarColor(name: string): string {
    const colors = [
      '#1c74bc', '#155a92', '#4f6ebd', '#8BC34A', '#FF9800',
      '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3',
      '#00BCD4', '#009688', '#4CAF50', '#CDDC39', '#FFC107'
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }

  formatMessageTime(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();

    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }

    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTotalMessages(): number {
    return this.conversations.reduce((total, conv) => total + (conv.nonLus || 0), 0) + this.messages.length;
  }

  getTotalUnread(): number {
    return this.conversations.reduce((total, conv) => total + (conv.nonLus || 0), 0);
  }

  // Actions
  refreshConversations(): void {
    this.loadConversations();
  }

  attachFile(): void {
    // Implémenter l'upload de fichier
    console.log('Attacher un fichier');
  }

  insertTemplate(): void {
    // Implémenter l'insertion de template
    console.log('Insérer un template');
  }

  insertQuickReply(reply: string): void {
    this.newMessageContent = reply;
    this.messageInput.nativeElement.focus();
  }

  startTeleconsultation(): void {
    if (this.activeConversation) {
      this.router.navigate(['/medecin/teleconsultation', this.activeConversation.patientId]);
    }
  }

  voirDossierPatient(patientId: string): void {
    this.router.navigate(['/medecin/dossier-patient', patientId]);
  }

  planifierRendezVous(patientId: string): void {
    this.router.navigate(['/medecin/rendez-vous'], {
      queryParams: { patientId }
    });
  }

  onScroll(event: any): void {
    // Implémenter le chargement de messages plus anciens
    const element = event.target;
    if (element.scrollTop === 0) {
      // Charger plus de messages
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatWindow) {
        const element = this.chatWindow.nativeElement;
        // Scroll vers le bas (messages les plus récents)
        element.scrollTop = element.scrollHeight;
        console.log('📍 Scroll vers le bas:', element.scrollTop, '/', element.scrollHeight);
      }
    }, 100);
  }

  trackByConversation(index: number, conv: ExtendedConversation): string {
    return conv.id;
  }

  trackByMessage(index: number, message: ExtendedMessage): string {
    return message.id;
  }

  toggleEmojiPicker(): void {
    // Implémenter le sélecteur d'emoji
    console.log('Toggle emoji picker');
  }

  private showErrorMessage(message: string): void {
    this.alertService.error(message);
  }
}
