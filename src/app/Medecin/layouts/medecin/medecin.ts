import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { AuthService, User } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { MedecinApiService } from '../../services/medecin-api.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-medecin-layout',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './medecin.html',
  styleUrl: './medecin.scss',
})
export class MedecinLayout implements OnInit, OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private medecinApiService = inject(MedecinApiService);
  private alertService = inject(AlertService);

  currentUser: User | null = null;
  searchQuery = '';
  isDarkMode = false;
  isMobileMenuOpen = false;
  showNotifications = false;

  // Compteurs pour les badges
  notificationsCount = 0;
  pendingRequestsCount = 0;
  unreadMessagesCount = 0;
  notifications: any[] = [];

  private userSubscription?: Subscription;
  private statsSubscription?: Subscription;
  private refreshInterval?: Subscription;

  ngOnInit(): void {
    // S'abonner aux changements de l'utilisateur
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Charger le profil depuis le serveur
    this.authService.getProfile().subscribe({
      error: (err: any) => console.error('Erreur chargement profil:', err)
    });

    // Initialiser le thème
    this.initializeTheme();

    // Charger les statistiques initiales
    this.loadStats();

    // Actualiser les statistiques toutes les 30 secondes
    this.refreshInterval = interval(30000).subscribe(() => {
      this.loadStats();
    });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.statsSubscription?.unsubscribe();
    this.refreshInterval?.unsubscribe();
  }

  private initializeTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark' ||
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    this.applyTheme();
  }

  private applyTheme(): void {
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  private loadStats(): void {
    // Charger les notifications non lues
    this.notificationService.getUnreadCount().subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationsCount = response.data.count;
        }
      },
      error: (err: any) => console.error('Erreur chargement notifications:', err)
    });

    // Charger les demandes de connexion en attente
    this.medecinApiService.getPendingConnectionRequests().subscribe({
      next: (response) => {
        if (response.success) {
          this.pendingRequestsCount = response.data.length;
        }
      },
      error: (err: any) => console.error('Erreur chargement demandes:', err)
    });

    // Charger les messages non lus
    this.medecinApiService.getUnreadMessagesCount().subscribe({
      next: (response) => {
        if (response.success) {
          this.unreadMessagesCount = response.data.count;
        }
      },
      error: (err: any) => console.error('Erreur chargement messages:', err)
    });

    // Charger les notifications
    this.loadNotifications();
  }

  private loadNotifications(): void {
    this.notificationService.getNotifications().subscribe({
      next: (response) => {
        if (response.success) {
          this.notifications = response.data;
        }
      },
      error: (err: any) => console.error('Erreur chargement notifications:', err)
    });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme();
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.loadNotifications();
    }
  }

  markAsRead(notification: any): void {
    if (!notification.lue) {
      this.notificationService.marquerCommeLue(notification.id).subscribe({
        next: () => {
          notification.lue = true;
          this.notificationsCount = Math.max(0, this.notificationsCount - 1);
        },
        error: (err: any) => console.error('Erreur marquage notification:', err)
      });
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'connection_request': return 'person_add';
      case 'message': return 'chat';
      case 'appointment': return 'calendar_month';
      case 'document': return 'description';
      default: return 'notifications';
    }
  }

  getRelativeTime(date: string): string {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)} h`;
    return `Il y a ${Math.floor(diffInMinutes / 1440)} j`;
  }

  onSearch(event: any): void {
    const query = event.target.value;
    if (query.length > 2) {
      // Implémenter la recherche globale
      this.performSearch(query);
    }
  }

  private performSearch(query: string): void {
    // Recherche dans les patients, dossiers, etc.
    console.log('Recherche:', query);
    // TODO: Implémenter la recherche globale
  }

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  async openLogoutDialog(): Promise<void> {
    const confirmed = await this.alertService.confirm(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      'Se déconnecter',
      'Rester'
    );

    if (confirmed) {
      this.authService.logout();
    }
  }
}
