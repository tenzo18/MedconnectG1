import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentTheme = new BehaviorSubject<Theme>('light');
  public theme$ = this.currentTheme.asObservable();

  constructor() {
    // Charger le thème sauvegardé ou utiliser 'light' par défaut
    const savedTheme = localStorage.getItem('app-theme') as Theme || 'light';
    this.setTheme(savedTheme);
  }

  setTheme(theme: Theme): void {
    this.currentTheme.next(theme);
    localStorage.setItem('app-theme', theme);
    this.applyTheme(theme);
  }

  getCurrentTheme(): Theme {
    return this.currentTheme.value;
  }

  private applyTheme(theme: Theme): void {
    const body = document.body;
    
    // Supprimer toutes les classes de thème existantes
    body.classList.remove('light-theme', 'dark-theme');
    
    if (theme === 'dark') {
      body.classList.add('dark-theme');
    } else if (theme === 'light') {
      body.classList.add('light-theme');
    } else if (theme === 'auto') {
      // Détecter la préférence système
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      body.classList.add(prefersDark ? 'dark-theme' : 'light-theme');
    }
  }
}