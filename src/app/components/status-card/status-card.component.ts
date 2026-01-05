import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-3 rounded-xl p-6 bg-white dark:bg-dark-gray/10 border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all duration-200"
         [ngClass]="cardClasses">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-12 h-12 rounded-full"
               [ngClass]="iconClasses">
            <span class="material-symbols-outlined text-xl">{{ icon }}</span>
          </div>
          <div>
            <p class="text-sm font-medium text-dark-gray/60 dark:text-white/60">{{ title }}</p>
            <p class="text-2xl font-bold text-dark-gray dark:text-white tracking-tight">{{ value }}</p>
          </div>
        </div>
        <div *ngIf="trend" class="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
             [ngClass]="trendClasses">
          <span class="material-symbols-outlined text-sm">{{ trendIcon }}</span>
          {{ trend }}
        </div>
      </div>
      <p class="text-xs font-medium" [ngClass]="subtitleClasses">{{ subtitle }}</p>
    </div>
  `,
  styleUrls: ['./status-card.component.scss']
})
export class StatusCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = '';
  @Input() subtitle: string = '';
  @Input() icon: string = 'analytics';
  @Input() type: 'primary' | 'success' | 'warning' | 'info' | 'danger' = 'primary';
  @Input() trend?: string;
  @Input() trendDirection?: 'up' | 'down' | 'neutral' = 'neutral';

  get cardClasses(): string {
    const baseClasses = '';
    switch (this.type) {
      case 'warning':
        return baseClasses + ' bg-[#FFF9E6] dark:bg-caution/20 border-caution/20';
      case 'success':
        return baseClasses + ' bg-green-50 dark:bg-success/20 border-success/20';
      case 'danger':
        return baseClasses + ' bg-red-50 dark:bg-red-500/20 border-red-200 dark:border-red-500/20';
      default:
        return baseClasses;
    }
  }

  get iconClasses(): string {
    switch (this.type) {
      case 'primary':
        return 'bg-primary/10 text-primary';
      case 'success':
        return 'bg-success/10 text-success';
      case 'warning':
        return 'bg-caution/10 text-caution';
      case 'danger':
        return 'bg-danger/10 text-danger';
      case 'info':
        return 'bg-primary/10 text-primary';
      default:
        return 'bg-primary/10 text-primary';
    }
  }

  get subtitleClasses(): string {
    switch (this.type) {
      case 'warning':
        return 'text-caution/80 dark:text-caution/90';
      case 'success':
        return 'text-success';
      case 'danger':
        return 'text-danger';
      default:
        return 'text-dark-gray/60 dark:text-white/60';
    }
  }

  get trendClasses(): string {
    switch (this.trendDirection) {
      case 'up':
        return 'bg-success/10 text-success';
      case 'down':
        return 'bg-danger/10 text-danger';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  get trendIcon(): string {
    switch (this.trendDirection) {
      case 'up':
        return 'trending_up';
      case 'down':
        return 'trending_down';
      default:
        return 'trending_flat';
    }
  }
}