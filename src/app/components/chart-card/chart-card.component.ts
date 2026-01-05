import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chart-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col rounded-xl border border-gray-200 dark:border-white/10 p-6 bg-white dark:bg-dark-gray/10 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-lg font-bold text-dark-gray dark:text-white">{{ title }}</h3>
          <p *ngIf="subtitle" class="text-sm text-dark-gray/60 dark:text-white/60">{{ subtitle }}</p>
        </div>
        <div *ngIf="actions" class="flex items-center gap-2">
          <ng-content select="[slot=actions]"></ng-content>
        </div>
      </div>
      
      <div class="flex-1">
        <ng-content></ng-content>
      </div>
      
      <div *ngIf="footer" class="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
        <ng-content select="[slot=footer]"></ng-content>
      </div>
    </div>
  `,
  styleUrls: ['./chart-card.component.scss']
})
export class ChartCardComponent {
  @Input() title: string = '';
  @Input() subtitle?: string;
  @Input() actions: boolean = false;
  @Input() footer: boolean = false;
}