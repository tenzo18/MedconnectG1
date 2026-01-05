import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { VerificationService, DoctorDetails } from '../../services/verification';
import { LoadingSpinnerComponent } from '../../../components';

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

  onApprove(id: string): void {
    if (!confirm("Voulez-vous vraiment approuver ce médecin ?")) {
      return;
    }

    this.processing = true;
    this.verificationService.approveDoctor(id).subscribe({
      next: (response) => {
        console.log('Médecin approuvé:', response);
        alert("Médecin approuvé avec succès !");
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

        alert(errorMessage + '\n\nVoir la console pour plus de détails');
        this.processing = false;
      }
    });
  }

  onRefuse(id: string): void {
    const reason = prompt("Raison du refus (minimum 10 caractères) :");

    // Vérifier que la raison est fournie et fait au moins 10 caractères
    if (!reason || reason.trim().length < 10) {
      alert("La raison du refus doit contenir au moins 10 caractères.");
      return;
    }

    if (!confirm("Êtes-vous sûr de vouloir refuser cette demande ?")) {
      return;
    }

    this.processing = true;
    this.verificationService.refuseDoctor(id, reason.trim()).subscribe({
      next: (response) => {
        console.log('Médecin refusé:', response);
        alert("Demande refusée avec succès.");
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

        alert(errorMessage);
        this.processing = false;
      }
    });
  }
}