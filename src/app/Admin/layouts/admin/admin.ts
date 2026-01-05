import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../../services/auth.service';
import { AdminApiService } from '../../services/admin-api.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin.html',
  styleUrl: './admin.scss',
})
export class Admin implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private adminApi = inject(AdminApiService);
  private alertService = inject(AlertService);

  currentUser: User | null = null;
  notifications: any[] = [];
  unreadCount = 0;
  showNotifications = false;
  isMobileMenuOpen = false;

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadNotifications();

    // Fermer les dropdowns quand on clique ailleurs
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notification-dropdown') && !target.closest('[data-notification-trigger]')) {
        this.showNotifications = false;
      }
    });
  }

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  async openLogoutDialog(): Promise<void> {
    const confirmed = await this.alertService.confirm(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter de votre session administrateur ?',
      'Se déconnecter',
      'Annuler'
    );

    if (confirmed) {
      this.authService.logout();
    }
  }

  loadNotifications(): void {
    // Simuler des notifications (à remplacer par de vraies données API)
    this.notifications = [
      {
        id: 1,
        title: 'Nouvelle demande de vérification',
        message: 'Dr. Martin Dubois a soumis ses documents',
        time: new Date(Date.now() - 30 * 60000),
        type: 'verification',
        read: false
      },
      {
        id: 2,
        title: 'Utilisateur inscrit',
        message: 'Marie Dupont s\'est inscrite',
        time: new Date(Date.now() - 2 * 60 * 60000),
        type: 'user',
        read: false
      },
      {
        id: 3,
        title: 'Rapport mensuel disponible',
        message: 'Le rapport de décembre est prêt',
        time: new Date(Date.now() - 24 * 60 * 60000),
        type: 'report',
        read: true
      }
    ];
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  markAsRead(notification: any): void {
    if (!notification.read) {
      notification.read = true;
      this.unreadCount--;
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'verification':
        return 'fact_check';
      case 'user':
        return 'person_add';
      case 'report':
        return 'assessment';
      default:
        return 'notifications';
    }
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}j`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else if (minutes > 0) {
      return `${minutes}min`;
    } else {
      return 'À l\'instant';
    }
  }
}
