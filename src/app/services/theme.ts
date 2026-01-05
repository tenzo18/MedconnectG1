import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentTheme = new BehaviorSubject<Theme>('light');
  public theme$ = this.currentTheme.asObservable();

  constructor() {
    // Forcer le mode clair au démarrage pour tester
    const savedTheme = 'light'; // Temporairement forcé en light
    // Appliquer immédiatement le thème au démarrage
    this.applyTheme(savedTheme);
    this.currentTheme.next(savedTheme);
  }

  setTheme(theme: Theme): void {
    console.log('🎨 ThemeService.setTheme() appelé avec:', theme);
    console.log('🎨 Thème actuel avant changement:', this.currentTheme.value);
    
    this.currentTheme.next(theme);
    localStorage.setItem('app-theme', theme);
    this.applyTheme(theme);
    
    console.log('🎨 Thème après changement:', this.currentTheme.value);
    console.log('🎨 LocalStorage:', localStorage.getItem('app-theme'));
  }

  getCurrentTheme(): Theme {
    return this.currentTheme.value;
  }

  toggleTheme(): void {
    const newTheme = this.currentTheme.value === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  private applyTheme(theme: Theme): void {
    const html = document.documentElement;
    const body = document.body;
    
    console.log('🎨 ApplyTheme() appelé avec:', theme);
    console.log('🎨 Classes HTML avant:', html.className);
    console.log('🎨 Classes BODY avant:', body.className);
    
    // Supprimer toutes les classes de thème existantes
    html.classList.remove('dark', 'light');
    body.classList.remove('light-theme', 'dark-theme');
    
    if (theme === 'dark') {
      // Mode sombre : classe 'dark' sur HTML et 'dark-theme' sur body
      html.classList.add('dark');
      body.classList.add('dark-theme');
    } else {
      // Mode clair : classe 'light' sur HTML (comme le code de référence)
      html.classList.add('light');
      body.classList.add('light-theme');
    }
    
    console.log('🎨 Classes HTML après:', html.className);
    console.log('🎨 Classes BODY après:', body.className);
  }
}