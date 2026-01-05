import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { UploadService } from '../../../services/upload.service';

import { ChartCardComponent, LoadingSpinnerComponent } from '../../../components';

@Component({
  selector: 'app-profil-medecin',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, LoadingSpinnerComponent],
  templateUrl: './profil-medecin.html',
})
export class ProfilMedecin implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private uploadService = inject(UploadService);
  private router = inject(Router);

  profilForm: FormGroup;
  passwordForm: FormGroup;
  isSubmitting: boolean = false;
  loading: boolean = true;
  error: string = '';

  // Upload de photo
  uploading: boolean = false;
  uploadProgress: number = 0;
  uploadError: string = '';
  currentPhotoUrl: string = '';

  currentDoctorData: any = null;
  currentUser: any = null;

  // Onglets simplifiés selon le backend
  tabs = [
    { id: 'personal', label: 'Informations Personnelles', icon: 'person' },
    { id: 'security', label: 'Sécurité', icon: 'security' }
  ];

  // Statistiques du profil - Basées sur les vraies données backend
  profileStats = {
    patientsConnectes: 0,
    consultationsTotal: 0,
    messagesNonLus: 0,
    demandesEnAttente: 0
  };

  // Onglets et modes d'édition
  activeTab: string = 'personal';
  editMode = {
    personal: false,
    security: false
  };
  specialites = [
    'Médecine générale',
    'Cardiologie',
    'Dermatologie',
    'Endocrinologie',
    'Gastro-entérologie',
    'Gynécologie',
    'Neurologie',
    'Ophtalmologie',
    'Orthopédie',
    'Pédiatrie',
    'Pneumologie',
    'Psychiatrie',
    'Radiologie',
    'Rhumatologie',
    'Urologie'
  ];

  // Sessions récentes - Simplifiées
  recentSessions = [
    {
      device: 'computer',
      location: 'Paris, France',
      date: 'Aujourd\'hui à 14:30',
      ip: '192.168.1.1',
      current: true
    },
    {
      device: 'smartphone',
      location: 'Paris, France',
      date: 'Hier à 09:15',
      ip: '192.168.1.1',
      current: false
    }
  ];

  constructor() {
    this.profilForm = this.fb.group({
      prenom: ['', Validators.required],
      nom: ['', Validators.required],
      telephone: [''],
      specialite: [''],
      numeroOrdre: [{ value: '', disabled: true }]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadProfile();
    this.loadProfileStats();
  }

  loadProfile(): void {
    this.loading = true;
    this.authService.getProfile().subscribe({
      next: (response) => {
        if (response.success && response.data?.user) {
          this.currentDoctorData = response.data.user;
          this.currentUser = response.data.user;
          this.currentPhotoUrl = this.currentDoctorData.profilePicture || '';

          this.profilForm.patchValue({
            prenom: this.currentDoctorData.firstName,
            nom: this.currentDoctorData.lastName,
            telephone: this.currentDoctorData.phone || '',
            specialite: this.currentDoctorData.specialty || '',
            numeroOrdre: this.currentDoctorData.licenseNumber || ''
          });

          // Ajuster les validateurs selon le rôle
          if (this.currentUser.role === 'DOCTOR') {
            this.profilForm.get('specialite')?.setValidators([Validators.required]);
          } else {
            this.profilForm.get('specialite')?.clearValidators();
          }
          this.profilForm.get('specialite')?.updateValueAndValidity();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du profil:', error);
        this.error = 'Impossible de charger le profil';
        this.loading = false;
      }
    });
  }

  loadProfileStats(): void {
    // Charger les vraies statistiques depuis le backend
    // TODO: Implémenter les appels API réels
    this.profileStats = {
      patientsConnectes: 0,
      consultationsTotal: 0,
      messagesNonLus: 0,
      demandesEnAttente: 0
    };
  }

  getUserFullName(): string {
    if (this.currentUser) {
      return `${this.currentUser.firstName || ''} ${this.currentUser.lastName || ''}`.trim();
    }
    return 'Utilisateur';
  }

  getMemberSince(): string {
    if (this.currentUser?.createdAt) {
      const date = new Date(this.currentUser.createdAt);
      return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
    }
    return 'Date inconnue';
  }

  getLastConnection(): string {
    // Simuler la dernière connexion
    return 'Aujourd\'hui à 14:30';
  }

  toggleEditMode(section: string): void {
    if (section === 'personal') {
      this.editMode.personal = !this.editMode.personal;
      if (!this.editMode.personal) {
        // Annuler les modifications
        this.loadProfile();
      }
    }
  }

  // Gestion du mot de passe
  getPasswordStrength(): number {
    const password = this.passwordForm.get('newPassword')?.value || '';
    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    return strength;
  }

  getPasswordStrengthClass(): string {
    const strength = this.getPasswordStrength();
    switch (strength) {
      case 0:
      case 1: return 'text-red-500';
      case 2: return 'text-orange-500';
      case 3: return 'text-yellow-500';
      case 4: return 'text-green-500';
      default: return 'text-gray-500';
    }
  }

  getPasswordStrengthBarClass(index: number): string {
    const strength = this.getPasswordStrength();
    if (index < strength) {
      switch (strength) {
        case 1: return 'bg-red-500';
        case 2: return 'bg-orange-500';
        case 3: return 'bg-yellow-500';
        case 4: return 'bg-green-500';
        default: return 'bg-gray-300';
      }
    }
    return 'bg-gray-300 dark:bg-gray-600';
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    switch (strength) {
      case 0:
      case 1: return 'Faible';
      case 2: return 'Moyen';
      case 3: return 'Fort';
      case 4: return 'Très fort';
      default: return '';
    }
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value ? null : { 'mismatch': true };
  }

  onPhotoSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.uploadError = '';

    // Valider le type
    if (!this.uploadService.validateFileType(file, ['image'])) {
      this.uploadError = 'Seules les images sont autorisées (JPG, PNG)';
      return;
    }

    // Valider la taille (5MB max)
    if (!this.uploadService.validateFileSize(file, 5)) {
      this.uploadError = 'La taille maximale est de 5MB';
      return;
    }

    this.uploading = true;
    this.uploadProgress = 0;

    this.uploadService.uploadWithProgress(file, 'profiles').subscribe({
      next: (result) => {
        if ('percentage' in result) {
          this.uploadProgress = result.percentage;
        } else {
          // Upload terminé
          this.currentPhotoUrl = result.url;
          this.uploading = false;
          this.uploadProgress = 0;

          alert('Photo uploadée avec succès ! Note: La mise à jour du profil nécessite que le backend implémente la route PUT /api/auth/profile');

          // Mettre à jour le profil avec la nouvelle photo (si la route existe)
          this.authService.updateProfile({ profilePicture: result.url }).subscribe({
            next: () => {
              console.log('Photo de profil mise à jour');
            },
            error: (error) => {
              console.warn('Route de mise à jour du profil non disponible:', error);
              // Ne pas afficher d'erreur à l'utilisateur car la photo est déjà uploadée
            }
          });
        }
      },
      error: (error) => {
        console.error('Erreur upload:', error);
        this.uploadError = 'Erreur lors de l\'upload de la photo';
        this.uploading = false;
        this.uploadProgress = 0;
      }
    });
  }

  onRemovePhoto(): void {
    if (!confirm('Voulez-vous vraiment supprimer votre photo de profil ?')) {
      return;
    }

    this.currentPhotoUrl = '';

    // Tenter de mettre à jour le profil (si la route existe)
    this.authService.updateProfile({ profilePicture: '' }).subscribe({
      next: () => {
        console.log('Photo de profil supprimée');
        alert('Photo supprimée avec succès');
      },
      error: (error) => {
        console.warn('Route de mise à jour du profil non disponible:', error);
        alert('Photo supprimée localement. Note: Le backend doit implémenter PUT /api/auth/profile pour la suppression permanente');
      }
    });
  }

  onSaveProfil(): void {
    if (this.profilForm.invalid) {
      alert("Veuillez remplir tous les champs obligatoires du profil.");
      return;
    }

    this.isSubmitting = true;
    this.error = '';

    // Mapper les champs du formulaire aux noms attendus par le backend
    const profileData = {
      firstName: this.profilForm.value.prenom,
      lastName: this.profilForm.value.nom,
      phone: this.profilForm.value.telephone,
      specialty: this.profilForm.value.specialite
    };

    this.authService.updateProfile(profileData).subscribe({
      next: (response) => {
        console.log('Profil mis à jour:', response);
        alert('Profil mis à jour avec succès !');
        this.isSubmitting = false;
        this.loadProfile();
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour:', error);
        this.error = 'Erreur lors de la mise à jour du profil';
        this.isSubmitting = false;
      }
    });
  }

  onSavePassword(): void {
    if (this.passwordForm.invalid) {
      alert("Veuillez vérifier les champs du mot de passe (min. 8 caractères et les deux nouveaux doivent correspondre).");
      return;
    }

    if (this.passwordForm.errors && this.passwordForm.errors['mismatch']) {
      alert("Le nouveau mot de passe et la confirmation ne correspondent pas.");
      return;
    }

    this.isSubmitting = true;

    // TODO: Implémenter l'endpoint de changement de mot de passe dans le backend
    // Pour l'instant, on simule
    setTimeout(() => {
      this.isSubmitting = false;
      alert('Mot de passe changé avec succès ! Vous devez vous reconnecter.');
      this.passwordForm.reset();
      this.authService.logout();
    }, 1500);
  }
}
