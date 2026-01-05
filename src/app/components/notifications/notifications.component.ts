import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../../services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  notifications: Notification[] = [];
  unreadCount: number = 0;
  isOpen: boolean = false;
  loading: boolean = false;

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    // Démarrer le polling des notifications
    this.notificationService.startPolling();

    // S'abonner aux notifications
    this.subscriptions.push(
      this.notificationService.notifications$.subscribe(notifications => {
        this.notifications = notifications.slice(0, 10); // Afficher les 10 dernières
      })
    );

    // S'abonner au compteur
    this.subscriptions.push(
      this.notificationService.unreadCount$.subscribe(count => {
        this.unreadCount = count;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    
    if (this.isOpen && this.notifications.length === 0) {
      this.loading = true;
      this.notificationService.loadNotifications();
      this.loading = false;
    }
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  marquerCommeLue(notificationId: string): void {
    this.notificationService.marquerCommeLue(notificationId).subscribe({
      error: (error) => {
        console.error('Erreur lors du marquage de la notification:', error);
      }
    });
  }

  marquerToutesCommeLues(): void {
    this.notificationService.marquerToutesCommeLues().subscribe({
      next: () => {
        console.log('Toutes les notifications marquées comme lues');
      },
      error: (error) => {
        console.error('Erreur lors du marquage des notifications:', error);
      }
    });
  }

  supprimerNotification(notificationId: string, event: Event): void {
    event.stopPropagation();
    
    this.notificationService.supprimerNotification(notificationId).subscribe({
      error: (error) => {
        console.error('Erreur lors de la suppression de la notification:', error);
      }
    });
  }

  voirToutes(): void {
    this.closeDropdown();
    // TODO: Créer une page dédiée aux notifications
    alert('Page de toutes les notifications à implémenter');
  }

  getIconForType(type: string): string {
    switch (type) {
      case 'SUCCESS':
        return 'check_circle';
      case 'WARNING':
        return 'warning';
      case 'ERROR':
        return 'error';
      case 'MESSAGE':
        return 'mail';
      case 'DEMANDE_CONNEXION':
        return 'person_add';
      case 'RENDEZ_VOUS':
        return 'event';
      default:
        return 'info';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'À l\'instant';
    } else if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
      });
    }
  }
}
