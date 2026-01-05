import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('web-admin');

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Le service de thème s'initialise automatiquement
    // et applique le thème sauvegardé
  }
}
