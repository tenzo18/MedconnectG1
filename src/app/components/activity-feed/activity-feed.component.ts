import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface ActivityItem {
  id: string;
  type: 'verification' | 'user' | 'system' | 'appointment';
  title: string;
  description: string;
  timestamp: Date;
  user?: {
    name: string;
    avatar?: string;
    role?: string;
  };
  action?: {
    label: string;
    route?: string;
    callback?: () => void;
  };
  priority?: 'low' | 'medium' | 'high';
}

@Component({
  selector: 'app-activity-feed',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white dark:bg-dark-gray/10 rounded-xl border border-gray-200 dark:border-white/10 p-6 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-dark-gray dark:text-white">{{ title }}</h3>
        <button *ngIf="showViewAll" 
                class="text-sm text-primary hover:text-primary/80 font-medium">
          Voir tout
        </button>
      </div>
      
      <div class="space-y-4" *ngIf="activities.length > 0; else noActivities">
        <div *ngFor="let activity of activities; trackBy: trackByFn" 
             class="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-gray/20 transition-colors">
          
          <!-- Icône de type d'activité -->
          <div class="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0"
               [ngClass]="getActivityIconClasses(activity.type)">
            <span class="material-symbols-outlined text-sm">{{ getActivityIcon(activity.type) }}</span>
          </div>
          
          <!-- Contenu de l'activité -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1">
                <p class="font-semibold text-dark-gray dark:text-white text-sm">{{ activity.title }}</p>
                <p class="text-xs text-dark-gray/60 dark:text-white/60 mt-1">{{ activity.description }}</p>
                
                <!-- Informations utilisateur -->
                <div *ngIf="activity.user" class="flex items-center gap-2 mt-2">
                  <img *ngIf="activity.user.avatar" 
                       [src]="activity.user.avatar" 
                       [alt]="activity.user.name"
                       class="w-6 h-6 rounded-full object-cover">
                  <div *ngIf="!activity.user.avatar" 
                       class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <span class="material-symbols-outlined text-xs text-primary">person</span>
                  </div>
                  <span class="text-xs text-dark-gray/60 dark:text-white/60">
                    {{ activity.user.name }}
                    <span *ngIf="activity.user.role" class="text-primary">• {{ activity.user.role }}</span>
                  </span>
                </div>
              </div>
              
              <!-- Timestamp -->
              <span class="text-xs text-dark-gray/60 dark:text-white/60 flex-shrink-0">
                {{ getRelativeTime(activity.timestamp) }}
              </span>
            </div>
            
            <!-- Action button -->
            <div *ngIf="activity.action" class="mt-3">
              <a *ngIf="activity.action.route" 
                 [routerLink]="activity.action.route"
                 class="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                {{ activity.action.label }}
                <span class="material-symbols-outlined text-xs">arrow_forward</span>
              </a>
              <button *ngIf="!activity.action.route && activity.action.callback"
                      (click)="activity.action.callback!()"
                      class="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                {{ activity.action.label }}
              </button>
            </div>
          </div>
          
          <!-- Indicateur de priorité -->
          <div *ngIf="activity.priority && activity.priority !== 'low'" 
               class="w-2 h-2 rounded-full flex-shrink-0 mt-2"
               [ngClass]="getPriorityClasses(activity.priority)">
          </div>
        </div>
      </div>
      
      <ng-template #noActivities>
        <div class="text-center py-8">
          <div class="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-dark-gray/20 mx-auto mb-4">
            <span class="material-symbols-outlined text-2xl text-gray-400">notifications_none</span>
          </div>
          <p class="font-semibold text-dark-gray dark:text-white">Aucune activité récente</p>
          <p class="text-sm text-dark-gray/60 dark:text-white/60">Les nouvelles activités apparaîtront ici.</p>
        </div>
      </ng-template>
    </div>
  `,
  styleUrls: ['./activity-feed.component.scss']
})
export class ActivityFeedComponent {
  @Input() title: string = 'Activité Récente';
  @Input() activities: ActivityItem[] = [];
  @Input() showViewAll: boolean = true;

  trackByFn(index: number, item: ActivityItem): string {
    return item.id;
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'verification':
        return 'fact_check';
      case 'user':
        return 'person_add';
      case 'system':
        return 'settings';
      case 'appointment':
        return 'event';
      default:
        return 'notifications';
    }
  }

  getActivityIconClasses(type: string): string {
    switch (type) {
      case 'verification':
        return 'bg-caution/10 text-caution';
      case 'user':
        return 'bg-primary/10 text-primary';
      case 'system':
        return 'bg-gray-100 text-gray-600';
      case 'appointment':
        return 'bg-success/10 text-success';
      default:
        return 'bg-primary/10 text-primary';
    }
  }

  getPriorityClasses(priority: string): string {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-caution';
      default:
        return 'bg-gray-400';
    }
  }

  getRelativeTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
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