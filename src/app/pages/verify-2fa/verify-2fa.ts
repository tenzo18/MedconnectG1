import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-2fa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verify-2fa.html',
  styleUrl: './verify-2fa.scss'
})
export class Verify2FA implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  digits: string[] = ['', '', '', ''];
  userId: string = '';
  loading: boolean = false;
  error: string = '';

  ngOnInit(): void {
    const pendingUserId = sessionStorage.getItem('pendingUserId');
    if (!pendingUserId) {
      this.router.navigate(['/login']);
      return;
    }
    this.userId = pendingUserId;
  }

  handleInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (value && index < 3) {
      const nextInput = input.nextElementSibling as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }

    this.digits[index] = value;
    this.checkAutoSubmit();
  }

  handleKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.digits[index] && index > 0) {
      const prevInput = (event.target as HTMLInputElement).previousElementSibling as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        this.digits[index - 1] = '';
      }
    }
  }

  handleFocus(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  handlePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasteData = event.clipboardData?.getData('text');
    if (pasteData && /^\d{4}$/.test(pasteData)) {
      const digitsArr = pasteData.split('');
      this.digits = digitsArr;

      // Focus on last input
      setTimeout(() => {
        const inputs = document.querySelectorAll('input[type="text"]');
        (inputs[3] as HTMLInputElement).focus();
        this.onSubmit();
      }, 0);
    }
  }

  checkAutoSubmit(): void {
    if (this.digits.every(d => d.length === 1)) {
      this.onSubmit();
    }
  }

  get combinedCode(): string {
    return this.digits.join('');
  }

  onSubmit(): void {
    const code = this.combinedCode;
    if (code.length !== 4) {
      this.error = 'Veuillez entrer un code à 4 chiffres';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.verify2FA(this.userId, code).subscribe({
      next: (response) => {
        const user = response.data.user;
        if (user.role === 'ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else if (user.role === 'DOCTOR') {
          this.router.navigate(['/medecin/dashboard']);
        } else {
          this.router.navigate(['/login']);
        }
      },
      error: (error) => {
        this.error = error.message || 'Code invalide ou expiré';
        this.loading = false;
      }
    });
  }

  resendCode(): void {
    alert('Fonctionnalité de renvoi de code à implémenter');
  }

  cancel(): void {
    sessionStorage.removeItem('pendingUserId');
    this.router.navigate(['/login']);
  }
}
