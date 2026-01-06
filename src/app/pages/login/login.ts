import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DemoAuthService } from '../../services/demo-auth.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private authService = inject(AuthService);
  private demoAuth = inject(DemoAuthService);
  private router = inject(Router);
  private alertService = inject(AlertService);

  email: string = '';
  password: string = '';
  loading: boolean = false;
  showPassword: boolean = false;
  error: string = '';
  rememberMe: boolean = false;

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  login(): void {
    if (!this.email || !this.password) {
      this.error = 'Veuillez remplir tous les champs';
      this.alertService.toast(this.error, 'error');
      return;
    }

    // Éviter les doubles soumissions
    if (this.loading) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        console.log('✅ Login réussi', response);

        this.loading = false;

        if (response.data.requiresVerification) {
          // Rediriger vers la page de vérification 2FA
          console.log('🔐 Redirection vers /verify-2fa');
          this.router.navigate(['/verify-2fa']);
        } else if (response.data.tokens && response.data.user) {
          // Connexion directe (2FA désactivé ou non requis)
          const user = response.data.user;
          console.log('👤 Utilisateur connecté:', user.role);

          // Rediriger selon le rôle
          if (user.role === 'ADMIN') {
            console.log('🚀 Redirection vers /admin/dashboard');
            this.router.navigate(['/admin/dashboard']);
          } else if (user.role === 'DOCTOR') {
            console.log('🚀 Redirection vers /medecin/dashboard');
            this.router.navigate(['/medecin/dashboard']);
          } else {
            this.error = 'Rôle utilisateur non reconnu: ' + user.role;
          }
        } else {
          this.error = 'Réponse inattendue du serveur';
        }
      },
      error: (error) => {
        console.error('❌ Erreur de connexion:', error);
        this.error = error.message || 'Email ou mot de passe incorrect';
        this.alertService.error('Erreur de connexion', this.error);
        this.loading = false;
      }
    });
  }

  /**
   * Connexion en mode démonstration
   */
  loginDemo(): void {
    if (this.loading) {
      return;
    }

    this.loading = true;
    this.error = '';

    // Créer une session de démonstration
    this.demoAuth.createDemoSession();

    // Simuler un délai de connexion
    setTimeout(() => {
      this.loading = false;
      console.log('🎭 Mode démonstration activé');
      this.router.navigate(['/medecin/dashboard']);
    }, 1000);
  }
}
