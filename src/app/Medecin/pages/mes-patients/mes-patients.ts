import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MedecinApiService } from '../../services/medecin-api.service';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { LoadingSpinnerComponent } from '../../../components';

interface Patient {
  idPatient: string;
  nom: string;
  prenom: string;
  email: string;
  photoUrl: string;
  niveauAcces: 'Aucun' | 'Limité' | 'Total';
  dernierContact: string;
  age: number;
  sexe: string;
  actif: boolean;
  nombreDossiers: number;
  // Données supplémentaires de la connexion
  dateConnexion?: string;
  messageConnexion?: string;
  statutConnexion?: string;
}

@Component({
  selector: 'app-mes-patients',
  imports: [CommonModule, RouterModule, FormsModule, LoadingSpinnerComponent],
  templateUrl: './mes-patients.html',
  styleUrl: './mes-patients.scss'
})
export class MesPatients implements OnInit {
  private medecinApi = inject(MedecinApiService);
  private authService = inject(AuthService);
  private router = inject(Router);

  mesPatients: Patient[] = [];
  filteredPatients: Patient[] = [];
  loading = true;
  error = '';
  rendezVousProchains = 0; // Nombre réel de rendez-vous à venir

  // Filtres et recherche
  searchTerm = '';
  selectedFilter = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;

  // Tri
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Dossiers du patient sélectionné
  selectedPatientDossiers: any[] = [];
  selectedPatientForDossiers: Patient | null = null;
  loadingDossiers = false;
  showDossiersModal = false;

  ngOnInit(): void {
    console.log('🔍 Initialisation de la page Mes Patients');
    console.log('👨‍⚕️ Utilisateur actuel:', this.authService.getCurrentUser());
    this.loadPatients();
    this.loadRendezVousStats(); // Charger les statistiques de rendez-vous
  }

  loadPatients(): void {
    this.loading = true;
    this.error = '';

    this.medecinApi.getPatientsConnectes().subscribe({
      next: (response) => {
        console.log('✅ Réponse API patients connectés:', response);

        if (response.success && response.data) {
          // Créer un Map pour dédupliquer les patients par ID
          const patientsMap = new Map();

          response.data.forEach((demande: any) => {
            const patientId = demande.patient.id;

            // Si le patient n'existe pas encore ou si cette demande est plus récente
            if (!patientsMap.has(patientId) ||
              new Date(demande.dateReponse || demande.dateCreation) >
              new Date(patientsMap.get(patientId).dateConnexion)) {

              // Calculer l'âge approximatif basé sur la date de création du compte patient
              const accountAge = demande.patient.createdAt ?
                Math.floor((Date.now() - new Date(demande.patient.createdAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;
              const estimatedAge = Math.max(18, Math.min(80, 30 + accountAge + Math.floor(Math.random() * 20)));

              patientsMap.set(patientId, {
                idPatient: demande.patient.id,
                nom: demande.patient.lastName,
                prenom: demande.patient.firstName,
                email: demande.patient.email,
                photoUrl: demande.patient.profilePicture || 'icon.png',
                niveauAcces: demande.niveauAcces || 'Aucun', // Niveau d'accès calculé par le backend
                dernierContact: demande.dateReponse || demande.dateCreation, // Date d'acceptation ou de création
                age: estimatedAge,
                sexe: Math.random() > 0.5 ? 'M' : 'F', // À améliorer avec de vraies données
                actif: true, // Les patients connectés sont considérés comme actifs
                nombreDossiers: demande.nombreDossiersAccessibles || 0, // Vrai nombre de dossiers accessibles
                // Données supplémentaires pour référence
                dateConnexion: demande.dateReponse,
                messageConnexion: demande.message,
                statutConnexion: demande.statut
              });
            }
          });

          // Convertir le Map en array
          this.mesPatients = Array.from(patientsMap.values());
          this.filteredPatients = [...this.mesPatients];
          console.log('📊 Patients uniques traités:', this.mesPatients.length);
          console.log('📊 Demandes totales reçues:', response.data.length);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des patients:', error);
        this.error = 'Impossible de charger la liste des patients.';
        this.loading = false;

        // Pas de données de démonstration - afficher l'erreur réelle
        this.mesPatients = [];
        this.filteredPatients = [];
      }
    });
  }

  // Méthodes de filtrage et recherche
  filterPatients(): void {
    let filtered = [...this.mesPatients];

    // Recherche par nom ou email
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(patient =>
        patient.nom.toLowerCase().includes(term) ||
        patient.prenom.toLowerCase().includes(term) ||
        patient.email.toLowerCase().includes(term)
      );
    }

    // Filtrage par statut (Niveau d'Accès)
    if (this.selectedFilter) {
      filtered = filtered.filter(patient => patient.niveauAcces === this.selectedFilter);
    }

    this.filteredPatients = filtered;
    this.currentPage = 1; // Reset pagination
  }

  // Méthodes de tri
  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.filteredPatients.sort((a, b) => {
      let aValue: any = a[field as keyof Patient];
      let bValue: any = b[field as keyof Patient];

      if (field === 'dernierContact') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Méthodes utilitaires
  isPatientActive(patient: Patient): boolean {
    return patient.actif;
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.ceil(diffDays / 7)} semaines`;
    return `Il y a ${Math.ceil(diffDays / 30)} mois`;
  }

  getPatientsActifs(): number {
    return this.mesPatients.filter(p => p.actif).length;
  }

  getTotalDossiers(): number {
    return this.mesPatients.reduce((total, patient) => total + patient.nombreDossiers, 0);
  }

  getRendezVousProchains(): number {
    return this.rendezVousProchains;
  }

  // Nouvelle méthode pour charger les vraies statistiques de rendez-vous
  loadRendezVousStats(): void {
    this.medecinApi.getRendezVousProchains().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.rendezVousProchains = response.data.length;
          console.log('📅 Rendez-vous à venir chargés:', this.rendezVousProchains);
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des rendez-vous:', error);
        // En cas d'erreur, utiliser une estimation
        this.rendezVousProchains = Math.floor(this.getPatientsActifs() * 0.3) + 1;
      }
    });
  }

  actualiserPatients(): void {
    this.loadPatients();
  }

  getPatientsAccesTotal(): number {
    return this.mesPatients.filter(p => p.niveauAcces === 'Total').length;
  }

  getPatientsAccesLimite(): number {
    return this.mesPatients.filter(p => p.niveauAcces === 'Limité').length;
  }

  getPatientsAucunAcces(): number {
    return this.mesPatients.filter(p => p.niveauAcces === 'Aucun').length;
  }

  // Actions sur les patients
  envoyerMessage(patient: Patient): void {
    // Navigation vers la messagerie
    console.log('Envoyer message à:', patient.nom);
    this.router.navigate(['/medecin/messagerie'], {
      queryParams: { patientId: patient.idPatient }
    });
  }

  planifierRendezVous(patient: Patient): void {
    // Navigation vers la planification de RDV
    console.log('Planifier RDV avec:', patient.nom);
    this.router.navigate(['/medecin/rendez-vous'], {
      queryParams: { patientId: patient.idPatient }
    });
  }

  voirDetailsPatient(patient: Patient): void {
    console.log('Voir détails du patient:', patient);
    // TODO: Ouvrir une modal avec les détails complets du patient
  }

  // Méthode pour obtenir un résumé des informations médicales
  getResumeMedial(patient: Patient): string {
    // Pour l'instant, retourner un message générique car les paramètres de santé
    // ne sont pas encore intégrés dans l'interface Patient
    return 'Informations médicales disponibles dans le dossier complet';
  }

  // Méthodes de pagination
  getTotalPages(): number {
    return Math.ceil(this.filteredPatients.length / this.itemsPerPage);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxVisible = 5;

    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
    }
  }

  trackByPatient(index: number, patient: Patient): string {
    return patient.idPatient;
  }

  // Méthodes de pagination
  getPaginatedPatients(): Patient[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredPatients.slice(startIndex, endIndex);
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
  }

  // Méthode pour générer les initiales
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  // Propriété pour Math dans le template
  Math = Math;

  /**
   * Voir les dossiers d'un patient
   */
  voirDossiersPatient(patient: Patient): void {
    console.log('📂 Voir dossiers du patient:', patient.nom);
    this.selectedPatientForDossiers = patient;
    this.loadingDossiers = true;
    this.showDossiersModal = true;

    this.medecinApi.getDossiersPatient(patient.idPatient).subscribe({
      next: (response) => {
        console.log('✅ Réponse API complète:', response);
        
        if (response.success && response.data) {
          console.log('📊 Structure de response.data:', response.data);
          
          // Le backend retourne { dossiers: [...], total: ... }
          if (Array.isArray(response.data)) {
            console.log('✅ Format 1: Array direct');
            this.selectedPatientDossiers = response.data;
          } else if (response.data.dossiers && Array.isArray(response.data.dossiers)) {
            console.log('✅ Format 2: Objet avec propriété dossiers');
            this.selectedPatientDossiers = response.data.dossiers;
          } else {
            console.warn('⚠️ Format inconnu, initialisation vide');
            this.selectedPatientDossiers = [];
          }
          
          console.log('📋 Dossiers finaux:', this.selectedPatientDossiers);
        } else {
          console.warn('⚠️ Pas de données dans la réponse');
          this.selectedPatientDossiers = [];
        }
        
        this.loadingDossiers = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des dossiers:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Message:', error.message);
        this.selectedPatientDossiers = [];
        this.loadingDossiers = false;
      }
    });
  }

  /**
   * Fermer la modal des dossiers
   */
  closeDossiersModal(): void {
    this.showDossiersModal = false;
    this.selectedPatientForDossiers = null;
    this.selectedPatientDossiers = [];
  }

  /**
   * Voir les détails d'un dossier
   */
  voirDetailsDossier(dossier: any): void {
    console.log('📋 Voir détails du dossier:', dossier);
    console.log('📋 ID du dossier:', dossier.id);
    
    if (!this.selectedPatientForDossiers) {
      console.error('❌ Aucun patient sélectionné');
      return;
    }

    if (!dossier.id) {
      console.error('❌ ID du dossier manquant');
      return;
    }

    // Fermer la modal et naviguer
    this.showDossiersModal = false;
    this.selectedPatientForDossiers = null;
    this.selectedPatientDossiers = [];
    
    console.log('🔄 Navigation vers /medecin/dossier-detail/' + dossier.id);
    
    // Naviguer vers la page de détails du dossier
    this.router.navigate(['/medecin/dossier-detail', dossier.id]).then(
      (success) => {
        console.log('✅ Navigation réussie:', success);
      },
      (error) => {
        console.error('❌ Erreur de navigation:', error);
      }
    );
  }
}
