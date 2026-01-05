import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from '../../../components';
import { VerificationService, DoctorDetails } from '../../services/verification';

@Component({
  selector: 'app-verifications',
  imports: [CommonModule, RouterLink, FormsModule, LoadingSpinnerComponent],
  templateUrl: './verifications.html',
  styleUrl: './verifications.scss'
})
export class Verifications implements OnInit {
  private verificationService = inject(VerificationService);

  pendingList: DoctorDetails[] = [];
  loading: boolean = true;
  error: string = '';

  // Modals
  showApproveModal: boolean = false;
  showRejectModal: boolean = false;
  selectedDoctor: DoctorDetails | null = null;
  rejectionReason: string = '';

  ngOnInit(): void {
    this.loadPendingDoctors();
  }

  loadPendingDoctors(): void {
    this.loading = true;
    this.error = '';

    this.verificationService.getPendingDoctors().subscribe({
      next: (doctors) => {
        this.pendingList = doctors;
        this.loading = false;
        console.log('✅ Médecins en attente chargés:', doctors.length);
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des médecins:', error);
        this.error = 'Impossible de charger la liste des médecins en attente';
        this.loading = false;
      }
    });
  }

  /** Ouvrir le modal d'approbation rapide */
  quickApprove(doctor: DoctorDetails): void {
    this.selectedDoctor = doctor;
    this.showApproveModal = true;
  }

  /** Ouvrir le modal de refus rapide */
  quickReject(doctor: DoctorDetails): void {
    this.selectedDoctor = doctor;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  /** Confirmer l'approbation */
  confirmApprove(): void {
    if (!this.selectedDoctor) return;

    console.log('🔄 Approbation du médecin:', this.selectedDoctor.id);

    this.verificationService.approveDoctor(this.selectedDoctor.id).subscribe({
      next: (response) => {
        console.log('✅ Médecin approuvé avec succès:', response);

        // Supprimer de la liste locale
        this.pendingList = this.pendingList.filter(d => d.id !== this.selectedDoctor!.id);

        // Fermer le modal
        this.cancelAction();

        // Notification de succès
        alert(`Dr. ${this.selectedDoctor!.prenom} ${this.selectedDoctor!.nom} a été approuvé avec succès !`);
      },
      error: (error) => {
        console.error('❌ Erreur lors de l\'approbation:', error);
        alert('Erreur lors de l\'approbation du médecin. Veuillez réessayer.');
      }
    });
  }

  /** Confirmer le refus */
  confirmReject(): void {
    if (!this.selectedDoctor) return;

    console.log('🔄 Refus du médecin:', this.selectedDoctor.id, 'Raison:', this.rejectionReason);

    this.verificationService.refuseDoctor(this.selectedDoctor.id, this.rejectionReason).subscribe({
      next: (response) => {
        console.log('✅ Médecin refusé avec succès:', response);

        // Supprimer de la liste locale
        this.pendingList = this.pendingList.filter(d => d.id !== this.selectedDoctor!.id);

        // Fermer le modal
        this.cancelAction();

        // Notification de succès
        alert(`Dr. ${this.selectedDoctor!.prenom} ${this.selectedDoctor!.nom} a été refusé.`);
      },
      error: (error) => {
        console.error('❌ Erreur lors du refus:', error);
        alert('Erreur lors du refus du médecin. Veuillez réessayer.');
      }
    });
  }

  /** Annuler l'action et fermer les modals */
  cancelAction(): void {
    this.showApproveModal = false;
    this.showRejectModal = false;
    this.selectedDoctor = null;
    this.rejectionReason = '';
  }

  /** Recharger la liste */
  refreshList(): void {
    this.loadPendingDoctors();
  }
}