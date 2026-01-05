import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-register-doctor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register-doctor.html',
  styleUrl: './register-doctor.scss',
})
export class RegisterDoctor {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private alertService = inject(AlertService);

  registerForm: FormGroup;
  loading: boolean = false;
  error: string = '';
  success: boolean = false;
  currentStep: number = 1;
  totalSteps: number = 3;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  countryCodes = [
    { code: '+237', country: 'Cameroun', flag: '🇨🇲' },
    { code: '+33', country: 'France', flag: '🇫🇷' },
    { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
    { code: '+44', country: 'Royaume-Uni', flag: '🇬🇧' },
    { code: '+49', country: 'Allemagne', flag: '🇩🇪' },
    { code: '+32', country: 'Belgique', flag: '🇧🇪' },
    { code: '+41', country: 'Suisse', flag: '🇨🇭' },
    { code: '+225', country: 'Côte d\'Ivoire', flag: '🇨🇮' },
    { code: '+221', country: 'Sénégal', flag: '🇸🇳' },
    { code: '+212', country: 'Maroc', flag: '🇲🇦' },
    { code: '+213', country: 'Algérie', flag: '🇩🇿' },
    { code: '+216', country: 'Tunisie', flag: '🇹🇳' },
    { code: '+243', country: 'RD Congo', flag: '🇨🇩' },
    { code: '+242', country: 'Congo', flag: '🇨🇬' },
    { code: '+241', country: 'Gabon', flag: '🇬🇦' },
  ];

  constructor() {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      countryCode: ['+237', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^6[0-9]{8}$/)]],
      specialty: ['', Validators.required],
      licenseNumber: ['', Validators.required],
      address: [''],
      city: [''],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', Validators.required],
      acceptTerms: [false, Validators.requiredTrue]
    }, { validators: this.passwordMatchValidator });

    // Écouter les changements de l'indicatif pays pour adapter la validation du téléphone
    this.registerForm.get('countryCode')?.valueChanges.subscribe(countryCode => {
      const phoneControl = this.registerForm.get('phone');
      if (countryCode === '+237') {
        // Format camerounais : 6 XX XX XX XX (9 chiffres commençant par 6)
        phoneControl?.setValidators([Validators.required, Validators.pattern(/^6[0-9]{8}$/)]);
      } else {
        // Format international : 9 à 15 chiffres
        phoneControl?.setValidators([Validators.required, Validators.pattern(/^[0-9]{9,15}$/)]);
      }
      phoneControl?.updateValueAndValidity();
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  nextStep(): void {
    if (this.currentStep === 1) {
      // Valider les champs de l'étape 1
      const step1Fields = ['firstName', 'lastName', 'email', 'countryCode', 'phone'];
      let isValid = true;
      step1Fields.forEach(field => {
        const control = this.registerForm.get(field);
        control?.markAsTouched();
        if (control?.invalid) isValid = false;
      });
      if (!isValid) return;
    } else if (this.currentStep === 2) {
      // Valider les champs de l'étape 2
      const step2Fields = ['specialty', 'licenseNumber'];
      let isValid = true;
      step2Fields.forEach(field => {
        const control = this.registerForm.get(field);
        control?.markAsTouched();
        if (control?.invalid) isValid = false;
      });
      if (!isValid) return;
    }

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.error = '';
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.error = '';
    }
  }

  onSubmit(): void {
    // Valider les champs de l'étape 3
    const step3Fields = ['password', 'confirmPassword', 'acceptTerms'];
    step3Fields.forEach(field => {
      this.registerForm.get(field)?.markAsTouched();
    });

    if (this.registerForm.invalid) {
      return;
    }

    if (this.loading) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = false;

    const formData = { ...this.registerForm.value };

    // Pour le Cameroun (+237), envoyer uniquement le numéro sans préfixe
    // Pour les autres pays, combiner l'indicatif et le numéro
    if (formData.countryCode === '+237') {
      // Le backend attend le format camerounais : 6 XX XX XX XX
      formData.phone = formData.phone;
    } else {
      // Pour les autres pays, combiner l'indicatif et le numéro
      formData.phone = formData.countryCode + formData.phone;
    }

    delete formData.countryCode;
    delete formData.confirmPassword;
    delete formData.acceptTerms;

    console.log('📤 Données envoyées au backend:', formData);

    this.http.post<any>(`${environment.apiUrl}/auth/register/doctor`, formData).subscribe({
      next: (response) => {
        console.log('✅ Inscription réussie', response);
        this.success = true;
        this.loading = false;

        this.alertService.success(
          'Inscription réussie !',
          'Votre demande a été envoyée avec succès. Vous allez être redirigé vers la page de connexion.'
        );

        // Rediriger vers la page de login après 3 secondes
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (error) => {
        console.error('❌ Erreur inscription:', error);
        console.error('Détails erreur:', error.error);

        // Extraire le message d'erreur détaillé
        let errorMessage = 'Une erreur est survenue lors de l\'inscription';

        if (error.error?.error?.message) {
          errorMessage = error.error.error.message;
        } else if (error.error?.error) {
          errorMessage = typeof error.error.error === 'string' ? error.error.error : JSON.stringify(error.error.error);
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        this.error = errorMessage;
        this.alertService.error('Erreur d\'inscription', this.error);
        this.loading = false;
      }
    });
  }

  getStepTitle(): string {
    switch (this.currentStep) {
      case 1: return 'Informations personnelles';
      case 2: return 'Informations professionnelles';
      case 3: return 'Sécurité et confirmation';
      default: return '';
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field?.touched && field?.errors) {
      if (field.errors['required']) return 'Ce champ est requis';
      if (field.errors['email']) return 'Email invalide';
      if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
      if (field.errors['pattern']) {
        if (fieldName === 'phone') {
          return 'Format: 6 XX XX XX XX (9 chiffres commençant par 6)';
        }
        if (fieldName === 'password') {
          return 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)';
        }
        return 'Format invalide';
      }
      if (field.errors['passwordMismatch']) return 'Les mots de passe ne correspondent pas';
    }
    return '';
  }
}
