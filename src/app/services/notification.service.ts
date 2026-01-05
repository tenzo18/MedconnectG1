import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Notification {
  id: string;
  type: string;
  titre: string;
  message: string;
  lue: boolean;
  createdAt: string;
  metadata?: any;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Subject pour le compteur de notifications non lues
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  // Subject pour les notifications
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private refreshSubscription: any = null;

  constructor() {
    // Ne pas charger automatiquement au démarrage
    // Les composants appelleront startPolling() après l'authentification
  }

  /**
   * Démarrer le polling des notifications (à appeler après authentification)
   */
  startPolling(): void {
    // Éviter de démarrer plusieurs fois
    if (this.refreshSubscription) {
      return;
    }

    // Charger les notifications immédiatement
    this.loadNotifications();
    
    // Rafraîchir toutes les 30 secondes
    this.refreshSubscription = interval(30000).pipe(
      switchMap(() => this.getNotifications())
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.notificationsSubject.next(response.data.notifications);
          this.updateUnreadCount();
        }
      },
      error: (error) => {
        console.error('Erreur lors du rafraîchissement des notifications:', error);
      }
    });
  }

  /**
   * Arrêter le polling des notifications (à appeler lors de la déconnexion)
   */
  stopPolling(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
      this.refreshSubscription = null;
    }
    // Réinitialiser les données
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
  }

  /**
   * Charger les notifications
   */
  loadNotifications(): void {
    this.getNotifications().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.notificationsSubject.next(response.data.notifications);
          this.updateUnreadCount();
        }
      },
      error: (error) => {
        // Ignorer silencieusement les erreurs pour ne pas bloquer l'application
        console.warn('Impossible de charger les notifications:', error.message);
      }
    });
  }

  /**
   * Récupérer les notifications
   */
  getNotifications(params?: { page?: number; limite?: number; nonLuesUniquement?: boolean }): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/notifications`, { params: params as any });
  }

  /**
   * Récupérer le nombre de notifications non lues
   */
  getUnreadCount(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/notifications/count`).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.unreadCountSubject.next(response.data.count);
        }
      })
    );
  }

  /**
   * Marquer une notification comme lue
   */
  marquerCommeLue(notificationId: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/notifications/${notificationId}/lu`, {}).pipe(
      tap(() => {
        // Mettre à jour localement
        const notifications = this.notificationsSubject.value;
        const notification = notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.lue = true;
          this.notificationsSubject.next([...notifications]);
          this.updateUnreadCount();
        }
      })
    );
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  marquerToutesCommeLues(): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/notifications/marquer-toutes-lues`, {}).pipe(
      tap(() => {
        // Mettre à jour localement
        const notifications = this.notificationsSubject.value.map(n => ({
          ...n,
          lue: true
        }));
        this.notificationsSubject.next(notifications);
        this.unreadCountSubject.next(0);
      })
    );
  }

  /**
   * Supprimer une notification
   */
  supprimerNotification(notificationId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/notifications/${notificationId}`).pipe(
      tap(() => {
        // Retirer localement
        const notifications = this.notificationsSubject.value.filter(n => n.id !== notificationId);
        this.notificationsSubject.next(notifications);
        this.updateUnreadCount();
      })
    );
  }

  /**
   * Mettre à jour le compteur de notifications non lues
   */
  private updateUnreadCount(): void {
    const notifications = this.notificationsSubject.value;
    const count = notifications.filter(n => !n.lue).length;
    this.unreadCountSubject.next(count);
  }

  /**
   * Obtenir le compteur actuel
   */
  getCurrentUnreadCount(): number {
    return this.unreadCountSubject.value;
  }
}
