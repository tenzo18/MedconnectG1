import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MedecinApiService } from '../../services/medecin-api.service';
import { AlertService } from '../../../services/alert.service';
import { NotificationService } from '../../../services/notification.service';
import Swal from 'sweetalert2';

interface DemandeConnexion {
  id: string;
  idPatient: string;
  nomPatient: string;
  emailPatient: string;
  photoUrl: string;
  dateDemande: Date;
  message?: string;
  niveauPartage?: string;
  statut: 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE';
}

import { LoadingSpinnerComponent } from '../../../components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-demandes-connexion',
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
  templateUrl: './demandes-connexion.html',
  styleUrl: './demandes-connexion.scss'
})
export class DemandesConnexion implements OnInit {
  private medecinApi = inject(MedecinApiService);
  private alertService = inject(AlertService);
  private notificationService = inject(NotificationService);

  demandesEnAttente: DemandeConnexion[] = [];
  filteredDemandes: DemandeConnexion[] = [];
  demandesTraitees: DemandeConnexion[] = [];

  loading: boolean = true;
  error: string = '';
  processing: boolean = false;

  // Filtres et recherche
  searchTerm = '';
  selectedFilter = '';
  showHistorique = false;

  // Statistiques
  demandesAcceptees = 0;

  ngOnInit(): void {
    this.loadDemandes();
  }

  loadDemandes(): void {
    this.loading = true;
    this.error = '';

    this.medecinApi.getDemandesConnexion().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const allDemandes = response.data.map((d: any) => ({
            id: d.id,
            idPatient: d.patient?.id || d.patientId,
            nomPatient: `${d.patient?.firstName || ''} ${d.patient?.lastName || ''}`.trim() || 'Patient Anonyme',
            emailPatient: d.patient?.email || 'N/A',
            photoUrl: d.patient?.profilePicture || 'icon.png',
            dateDemande: new Date(d.dateCreation || d.createdAt),
            message: d.message,
            niveauPartage: d.niveauAcces || 'Accès Standard',
            statut: d.statut
          }));

          // Séparer les demandes en attente et traitées - Backend utilise 'EN_ATTENTE', 'ACCEPTEE', 'REFUSEE'
          this.demandesEnAttente = allDemandes.filter((d: DemandeConnexion) => d.statut === 'EN_ATTENTE');
          this.demandesTraitees = allDemandes.filter((d: DemandeConnexion) => d.statut !== 'EN_ATTENTE');
          this.demandesAcceptees = allDemandes.filter((d: any) => d.statut === 'ACCEPTEE').length;

          this.filteredDemandes = [...this.demandesEnAttente];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des demandes:', error);
        this.error = 'Impossible de charger les demandes de connexion';
        this.loading = false;
        this.demandesEnAttente = [];
        this.filteredDemandes = [];
      }
    });
  }

  filterDemandes(): void {
    let filtered = [...this.demandesEnAttente];

    // Recherche par nom ou email
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(demande =>
        demande.nomPatient.toLowerCase().includes(term) ||
        demande.emailPatient.toLowerCase().includes(term)
      );
    }

    // Filtre par type
    if (this.selectedFilter === 'recent') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(demande => demande.dateDemande >= weekAgo);
    } else if (this.selectedFilter === 'urgent') {
      // Simuler des demandes urgentes (avec message contenant certains mots-clés)
      filtered = filtered.filter(demande =>
        demande.message?.toLowerCase().includes('urgent') ||
        demande.message?.toLowerCase().includes('douleur') ||
        demande.message?.toLowerCase().includes('problème')
      );
    }

    this.filteredDemandes = filtered;
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.ceil(diffDays / 7)} semaines`;
    return `Il y a ${Math.ceil(diffDays / 30)} mois`;
  }

  async accepterDemande(connexionId: string): Promise<void> {
    const demande = this.demandesEnAttente.find(d => d.id === connexionId);
    if (!demande) return;

    const confirmed = await this.alertService.confirm(
      `Voulez-vous accepter la demande de connexion de ${demande.nomPatient} ?`,
      'Confirmation d\'acceptation'
    );

    if (!confirmed) {
      return;
    }

    this.processing = true;
    this.medecinApi.repondreDemandeConnexion(connexionId, 'accepter').subscribe({
      next: (response) => {
        console.log('Demande acceptée:', response);

        // Retirer de la liste des demandes en attente
        this.demandesEnAttente = this.demandesEnAttente.filter(d => d.id !== connexionId);
        this.filteredDemandes = this.filteredDemandes.filter(d => d.id !== connexionId);

        // Ajouter aux demandes traitées
        demande.statut = 'ACCEPTEE';
        this.demandesTraitees.unshift(demande);
        this.demandesAcceptees++;

        this.processing = false;

        // Notification de succès
        this.showSuccessMessage(`Demande de ${demande.nomPatient} acceptée avec succès !`);
        this.notificationService.getUnreadCount().subscribe();
        this.notificationService.requestRefresh();
      },
      error: (error) => {
        console.error('Erreur lors de l\'acceptation:', error);
        this.showErrorMessage('Erreur lors de l\'acceptation de la demande');
        this.processing = false;
      }
    });
  }

  async refuserDemande(connexionId: string): Promise<void> {
    const demande = this.demandesEnAttente.find(d => d.id === connexionId);
    if (!demande) return;

    const { value: raison } = await Swal.fire({
      title: 'Raison du refus',
      input: 'textarea',
      inputLabel: 'Raison du refus (optionnel)',
      inputPlaceholder: 'Entrez la raison ici...',
      showCancelButton: true,
      confirmButtonText: 'Continuer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#1c74bc'
    });

    if (raison === undefined) {
      return;
    }

    const confirmed = await this.alertService.confirm(
      `Voulez-vous refuser la demande de connexion de ${demande.nomPatient} ?`,
      'Confirmation de refus'
    );

    if (!confirmed) {
      return;
    }

    this.processing = true;
    this.medecinApi.repondreDemandeConnexion(connexionId, 'refuser', raison || undefined).subscribe({
      next: (response) => {
        console.log('Demande refusée:', response);

        // Retirer de la liste des demandes en attente
        this.demandesEnAttente = this.demandesEnAttente.filter(d => d.id !== connexionId);
        this.filteredDemandes = this.filteredDemandes.filter(d => d.id !== connexionId);

        // Ajouter aux demandes traitées
        demande.statut = 'REFUSEE';
        this.demandesTraitees.unshift(demande);

        this.processing = false;

        // Notification
        this.showSuccessMessage(`Demande de ${demande.nomPatient} refusée.`);
        this.notificationService.getUnreadCount().subscribe();
        this.notificationService.requestRefresh();
      },
      error: (error) => {
        console.error('Erreur lors du refus:', error);
        this.showErrorMessage('Erreur lors du refus de la demande');
        this.processing = false;
      }
    });
  }

  async accepterToutesLesDemandes(): Promise<void> {
    if (this.demandesEnAttente.length === 0) return;

    const confirmed = await this.alertService.confirm(
      `Voulez-vous accepter toutes les ${this.demandesEnAttente.length} demandes en attente ?`,
      'Confirmation d\'acceptation en masse'
    );

    if (!confirmed) {
      return;
    }

    this.processing = true;

    // Simuler l'acceptation de toutes les demandes
    const promises = this.demandesEnAttente.map(demande =>
      this.medecinApi.repondreDemandeConnexion(demande.id, 'accepter')
    );

    Promise.all(promises).then(() => {
      const count = this.demandesEnAttente.length;
      this.demandesAcceptees += count;
      this.demandesEnAttente = [];
      this.filteredDemandes = [];
      this.processing = false;

      this.showSuccessMessage(`${count} demandes acceptées avec succès !`);
      this.notificationService.getUnreadCount().subscribe();
      this.notificationService.requestRefresh();
    }).catch((error) => {
      console.error('Erreur lors de l\'acceptation en masse:', error);
      this.showErrorMessage('Erreur lors de l\'acceptation des demandes');
      this.processing = false;
    });
  }

  actualiserDemandes(): void {
    this.loadDemandes();
  }

  voirProfilPatient(demande: DemandeConnexion): void {
    // Navigation vers le profil du patient ou modal
    console.log('Voir profil patient:', demande.nomPatient);
  }

  toggleHistorique(): void {
    this.showHistorique = !this.showHistorique;
  }

  trackByDemande(index: number, demande: DemandeConnexion): string {
    return demande.id;
  }

  private showSuccessMessage(message: string): void {
    this.alertService.toast(message, 'success');
  }

  private showErrorMessage(message: string): void {
    this.alertService.toast(message, 'error');
  }
}
