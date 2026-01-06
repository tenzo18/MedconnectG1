import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './forgot-password.html',
    styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
    private authService = inject(AuthService);
    private router = inject(Router);
    private alertService = inject(AlertService);

    email: string = '';
    code: string = '';
    newPassword: string = '';
    confirmPassword: string = '';

    step: 1 | 2 | 3 = 1;
    loading: boolean = false;
    showPassword: boolean = false;
    error: string = '';
    timeLeft: number = 0;
    canResend: boolean = true;
    private timer: any;

    togglePasswordVisibility(): void {
        this.showPassword = !this.showPassword;
    }

    onRequestCode(): void {
        if (!this.email) {
            this.error = 'Veuillez entrer votre adresse email';
            return;
        }

        this.loading = true;
        this.error = '';

        this.authService.forgotPassword(this.email).subscribe({
            next: (response: any) => {
                this.loading = false;
                if (response.success) {
                    this.alertService.success('Code envoyé', 'Veuillez vérifier vos emails');
                    this.step = 2;
                    this.startResendTimer();
                } else {
                    this.error = response.message || 'Erreur lors de l\'envoi du code';
                }
            },
            error: (err: any) => {
                this.loading = false;
                this.error = err.message || 'Une erreur est survenue';
                this.alertService.error('Erreur', this.error);
            }
        });
    }

    onVerifyCode(): void {
        if (!this.code) {
            this.error = 'Veuillez entrer le code reçu';
            return;
        }

        this.loading = true;
        this.error = '';

        this.authService.verifyResetCode(this.email, this.code).subscribe({
            next: (response: any) => {
                this.loading = false;
                if (response.success) {
                    this.step = 3;
                } else {
                    this.error = response.message || 'Code invalide';
                }
            },
            error: (err: any) => {
                this.loading = false;
                this.error = err.message || 'Une erreur est survenue';
            }
        });
    }

    onResetPassword(): void {
        if (!this.newPassword || !this.confirmPassword) {
            this.error = 'Veuillez remplir tous les champs';
            return;
        }

        if (this.newPassword !== this.confirmPassword) {
            this.error = 'Les mots de passe ne correspondent pas';
            return;
        }

        this.loading = true;
        this.error = '';

        this.authService.resetPassword({
            email: this.email,
            code: this.code,
            newPassword: this.newPassword
        }).subscribe({
            next: (response: any) => {
                this.loading = false;
                if (response.success) {
                    this.alertService.success('Succès', 'Votre mot de passe a été réinitialisé');
                    this.router.navigate(['/login']);
                } else {
                    this.error = response.message || 'Erreur lors de la réinitialisation';
                }
            },
            error: (err: any) => {
                this.loading = false;
                this.error = err.message || 'Une erreur est survenue';
            }
        });
    }

    startResendTimer(): void {
        this.canResend = false;
        this.timeLeft = 60;
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            if (this.timeLeft > 0) {
                this.timeLeft--;
            } else {
                this.canResend = true;
                clearInterval(this.timer);
            }
        }, 1000);
    }

    resendCode(): void {
        if (!this.canResend || this.loading) return;
        this.onRequestCode();
    }
}
