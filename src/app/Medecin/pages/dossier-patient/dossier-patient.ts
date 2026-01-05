import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MedecinApiService } from '../../services/medecin-api.service';

interface PatientData {
  id: string;
  nom: string;
  prenom: string;
  photoUrl: string;
  email: string;
  phone?: string;
  groupeSanguin?: string;
  allergies?: string;
  conditions?: string;
  medicamentsActuels?: string;
  poids?: number;
  taille?: number;
}

interface Document {
  id: string;
  titre: string;
  type: string;
  date: Date;
  fichierURL: string;
  niveauPartage?: string;
}

@Component({
  selector: 'app-dossier-patient',
  imports: [CommonModule],
  templateUrl: './dossier-patient.html',
  styleUrl: './dossier-patient.scss'
})
export class DossierPatient implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private medecinApi = inject(MedecinApiService);
  
  patientId: string | null = null;
  patient: PatientData | undefined;
  dossiers: any[] = [];
  documentsPatients: Document[] = [];
  documentsMedecin: Document[] = [];
  ordonnances: any[] = [];
  allergies: any[] = [];
  commentaires: any[] = [];
  activeTab: 'resume' | 'documents' | 'actes' = 'resume';
  loading: boolean = true;
  error: string = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.patientId = params.get('id');
      if (this.patientId) {
        this.loadPatientData(this.patientId);
      }
    });
  }

  loadPatientData(patientId: string): void {
    this.loading = true;
    
    // Charger les dossiers du patient
    this.medecinApi.getDossiersPatient(patientId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.dossiers = response.data;
          
          // Si au moins un dossier existe, charger ses détails
          if (this.dossiers.length > 0) {
            this.loadDossierDetails(this.dossiers[0].id);
          }
          
          // Extraire les infos patient du premier dossier
          if (this.dossiers[0]?.patient) {
            const p = this.dossiers[0].patient;
            this.patient = {
              id: p.id,
              nom: p.lastName || '',
              prenom: p.firstName || '',
              email: p.email,
              photoUrl: p.profilePicture || 'icon.png',
              phone: p.phone,
              groupeSanguin: p.groupeSanguin,
              allergies: p.allergiesConnues,
              conditions: p.conditionsMedicales,
              medicamentsActuels: p.medicamentsActuels,
              poids: p.poids,
              taille: p.taille
            };
          }
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du dossier:', error);
        this.error = 'Impossible de charger le dossier du patient';
        this.loading = false;
      }
    });
  }

  loadDossierDetails(dossierId: string): void {
    this.medecinApi.getDossierComplet(dossierId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const dossier = response.data;
          
          // Documents
          this.documentsPatients = (dossier.documents || []).map((doc: any) => ({
            id: doc.id,
            titre: doc.nom,
            type: doc.type,
            date: new Date(doc.createdAt),
            fichierURL: doc.cheminFichier,
            niveauPartage: 'Complet'
          }));
          
          // Documents médecin (ordonnances et commentaires)
          this.documentsMedecin = [
            ...(dossier.ordonnances || []).map((ord: any) => ({
              id: ord.id,
              titre: `Ordonnance - ${ord.medicament}`,
              type: 'Ordonnance',
              date: new Date(ord.createdAt),
              fichierURL: '#',
              niveauPartage: 'Complet'
            })),
            ...(dossier.commentaires || []).map((com: any) => ({
              id: com.id,
              titre: 'Commentaire médical',
              type: 'Diagnostic',
              date: new Date(com.createdAt),
              fichierURL: '#',
              niveauPartage: 'Complet'
            }))
          ];
          
          // Ordonnances
          this.ordonnances = dossier.ordonnances || [];
          
          // Allergies
          this.allergies = dossier.allergies || [];
          
          // Commentaires
          this.commentaires = dossier.commentaires || [];
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des détails:', error);
      }
    });
  }

  setActiveTab(tab: 'resume' | 'documents' | 'actes'): void {
    this.activeTab = tab;
  }

  openDocument(url: string, titre: string): void {
    if (url && url !== '#') {
      window.open(url, '_blank');
    } else {
      alert(`Document : ${titre}`);
    }
  }

  goToPrescriptionForm(): void {
    if (this.patientId) {
      this.router.navigate(['/medecin/creation-prescription', this.patientId]);
    }
  }

  goToDiagnosticForm(): void {
    if (this.patientId) {
      this.router.navigate(['/medecin/ajout-diagnostic', this.patientId]);
    }
  }
}
