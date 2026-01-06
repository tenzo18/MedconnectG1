import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { VerificationService, DoctorDetails } from '../../services/verification';
import { LoadingSpinnerComponent } from '../../../components';
import { AlertService } from '../../../services/alert.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-verification-details',
  imports: [CommonModule, LoadingSpinnerComponent],
  templateUrl: './verification-details.html',
  styleUrl: './verification-details.scss'
})
export class VerificationDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private verificationService = inject(VerificationService);
  private alertService = inject(AlertService);

  doctor: DoctorDetails | undefined;
  loading: boolean = true;
  error: string = '';
  processing: boolean = false;

  ngOnInit(): void {
    this.getDoctor();
  }

  getDoctor(): void {
    // Récupérer l'ID de l'URL
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.error = 'ID médecin manquant';
      this.loading = false;
      return;
    }

    this.verificationService.getDoctorDetails(id).subscribe({
      next: (doctor) => {
        this.doctor = doctor;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du médecin:', error);
        this.error = 'Impossible de charger les détails du médecin';
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  async onApprove(id: string): Promise<void> {
    const confirmed = await this.alertService.confirm(
      "Voulez-vous vraiment approuver ce médecin ?",
      "Confirmation d'approbation"
    );

    if (!confirmed) {
      return;
    }

    this.processing = true;
    this.verificationService.approveDoctor(id).subscribe({
      next: (response) => {
        console.log('Médecin approuvé:', response);
        this.alertService.success("Médecin approuvé avec succès !");
        this.router.navigate(['/admin/verifications']);
      },
      error: (error) => {
        console.error('Erreur lors de l\'approbation:', error);
        console.error('Détails de l\'erreur:', JSON.stringify(error.error, null, 2));

        // Extraire le message d'erreur détaillé
        let errorMessage = 'Erreur lors de l\'approbation du médecin';
        if (error.error?.error?.message) {
          errorMessage = error.error.error.message;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.error?.details) {
          // Afficher les détails de validation
          const details = error.error.error.details;
          errorMessage = details.map((d: any) => d.message).join(', ');
        } else if (error.message) {
          errorMessage = error.message;
        }

        this.alertService.error(errorMessage, 'Voir la console pour plus de détails');
        this.processing = false;
      }
    });
  }

  async onRefuse(id: string): Promise<void> {
    const { value: reason } = await Swal.fire({
      title: 'Raison du refus',
      input: 'textarea',
      inputLabel: 'Veuillez indiquer la raison du refus (minimum 10 caractères)',
      inputPlaceholder: 'Entrez la raison ici...',
      inputAttributes: {
        'aria-label': 'Raison du refus'
      },
      showCancelButton: true,
      confirmButtonText: 'Continuer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#1c74bc',
      inputValidator: (value) => {
        if (!value || value.trim().length < 10) {
          return 'La raison doit contenir au moins 10 caractères';
        }
        return null;
      }
    });

    if (!reason) {
      return;
    }

    const confirmed = await this.alertService.confirm(
      "Êtes-vous sûr de vouloir refuser cette demande ?",
      "Confirmation de refus"
    );

    if (!confirmed) {
      return;
    }

    this.processing = true;
    this.verificationService.refuseDoctor(id, reason.trim()).subscribe({
      next: (response) => {
        console.log('Médecin refusé:', response);
        this.alertService.success("Demande refusée avec succès.");
        this.router.navigate(['/admin/verifications']);
      },
      error: (error) => {
        console.error('Erreur lors du refus:', error);

        // Extraire le message d'erreur détaillé
        let errorMessage = 'Erreur lors du refus de la demande';
        if (error.error?.error?.message) {
          errorMessage = error.error.error.message;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }

        this.alertService.error(errorMessage);
        this.processing = false;
      }
    });
  }
}