import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MedecinApiService } from '../../services/medecin-api.service';
import { LoadingSpinnerComponent } from '../../../components';

interface DossierDetail {
  id: string;
  titre: string;
  description: string;
  type: string;
  statut: string;
  dateCreation: string;
  dateModification?: string;
  documents?: any[];
  ordonnances?: any[];
  allergies?: any[];
  commentaires?: any[];
  acces?: any[];
}

type TabType = 'documents' | 'ordonnances' | 'allergies' | 'commentaires';

@Component({
  selector: 'app-dossier-detail',
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent, FormsModule],
  templateUrl: './dossier-detail.html',
  styleUrl: './dossier-detail.scss'
})
export class DossierDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private medecinApi = inject(MedecinApiService);

  dossier: DossierDetail | null = null;
  loading = true;
  error = '';
  activeTab = signal<TabType>('documents');

  // Pour l'affichage des images
  selectedImage: string | null = null;
  showImageModal = false;

  // Pour l'ajout d'ordonnance
  showOrdonnanceModal = false;
  ordonnanceProcessing = false;
  newOrdonnance = {
    medicament: '',
    dosage: '',
    duree: '',
    instructions: ''
  };

  ngOnInit(): void {
    const dossierId = this.route.snapshot.paramMap.get('dossierId');
    console.log('🔍 Initialisation dossier-detail, ID:', dossierId);

    if (dossierId) {
      this.loadDossier(dossierId);
    } else {
      this.error = 'ID du dossier non trouvé';
      this.loading = false;
      console.error('❌ ID du dossier manquant dans la route');
    }
  }

  loadDossier(dossierId: string): void {
    this.loading = true;
    this.error = '';

    console.log('📂 Chargement du dossier:', dossierId);

    this.medecinApi.getDossierComplet(dossierId).subscribe({
      next: (response) => {
        console.log('✅ Réponse API complète:', response);

        if (response.success && response.data) {
          console.log('📋 Données du dossier:', response.data);
          console.log('📄 Documents:', response.data.documents);
          console.log('💊 Ordonnances:', response.data.ordonnances);
          console.log('⚠️ Allergies:', response.data.allergies);
          console.log('💬 Commentaires:', response.data.commentaires);

          this.dossier = response.data;
          console.log('✅ Dossier assigné au composant');
        } else {
          this.error = response.error?.message || 'Erreur lors du chargement du dossier';
          console.error('❌ Erreur API:', this.error);
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement du dossier:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Message:', error.message);
        console.error('❌ Détails:', error.error);

        this.error = 'Impossible de charger le dossier. Vérifiez que vous avez accès à ce dossier.';
        this.loading = false;
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab.set(tab as TabType);
  }

  getTypeColor(type: string): string {
    switch (type) {
      case 'CONSULTATION': return 'emerald';
      case 'URGENCE': return 'rose';
      case 'SUIVI': return 'blue';
      default: return 'slate';
    }
  }

  getStatutColor(statut: string): string {
    switch (statut) {
      case 'OUVERT': return 'emerald';
      case 'EN_COURS': return 'amber';
      case 'FERME': return 'slate';
      default: return 'slate';
    }
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date invalide';
    }
  }

  isImage(fileName: string): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext ? imageExtensions.includes(ext) : false;
  }

  isPdf(fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.pdf');
  }

  viewImage(document: any): void {
    this.selectedImage = document.cheminFichier;
    this.showImageModal = true;
  }

  closeImageModal(): void {
    this.showImageModal = false;
    this.selectedImage = null;
  }

  downloadDocument(document: any): void {
    // Créer un lien de téléchargement
    const link = document.createElement('a');
    link.href = document.cheminFichier;
    link.download = document.nom;
    link.click();
  }

  goBack(): void {
    this.location.back();
  }

  // --- Gestion des ordonnances ---

  openOrdonnanceModal(): void {
    this.resetOrdonnanceForm();
    this.showOrdonnanceModal = true;
  }

  closeOrdonnanceModal(): void {
    this.showOrdonnanceModal = false;
  }

  resetOrdonnanceForm(): void {
    this.newOrdonnance = {
      medicament: '',
      dosage: '',
      duree: '',
      instructions: ''
    };
  }

  ajouterOrdonnance(): void {
    if (!this.dossier || !this.newOrdonnance.medicament) return;

    this.ordonnanceProcessing = true;
    this.medecinApi.ajouterOrdonnance(this.dossier.id, this.newOrdonnance).subscribe({
      next: (response) => {
        if (response.success) {
          // Recharger le dossier pour voir la nouvelle ordonnance
          this.loadDossier(this.dossier!.id);
          this.closeOrdonnanceModal();
          this.resetOrdonnanceForm();
        }
        this.ordonnanceProcessing = false;
      },
      error: (err) => {
        console.error('Erreur lors de l\'ajout de l\'ordonnance:', err);
        this.ordonnanceProcessing = false;
      }
    });
  }

  // Propriété pour Math dans le template
  Math = Math;
}
