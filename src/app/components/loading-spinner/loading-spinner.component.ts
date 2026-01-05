import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-loading-spinner',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div [class]="containerClass" class="flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
      <div class="relative">
        <div class="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="material-symbols-outlined text-primary text-xl animate-pulse">{{ icon }}</span>
        </div>
      </div>
      <p *ngIf="message" class="mt-6 text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-xs text-center">{{ message }}</p>
    </div>
  `,
    styles: []
})
export class LoadingSpinnerComponent {
    @Input() message: string = 'Chargement des données...';
    @Input() icon: string = 'progress_activity';
    @Input() containerClass: string = 'min-h-[40vh]';
}
