import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { Observable, firstValueFrom } from 'rxjs';
import { MedecinApiService } from '../../services/medecin-api.service';

@Component({
  selector: 'app-creation-prescription',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './creation-prescription.html',
  styleUrl: './creation-prescription.scss',
})
export class CreationPrescription implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private fb = inject(FormBuilder);
  private medecinApi = inject(MedecinApiService);

  patientId: string | null = null;
  dossierId: string | null = null;
  patientName: string = 'Patient Inconnu';
  prescriptionForm: FormGroup;
  isSubmitting: boolean = false;
  error: string = '';

  constructor() {
    this.prescriptionForm = this.fb.group({
      titre: ['Ordonnance Médicale', Validators.required],
      dateEmission: [this.getCurrentDate(), Validators.required],
      detailsMedicaments: this.fb.array([this.createMedicamentLine()])
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.patientId = params.get('patientId');
      if (this.patientId) {
        this.loadPatientInfo(this.patientId);
      }
    });
  }

  loadPatientInfo(patientId: string): void {
    // Charger les dossiers du patient pour obtenir le dossierId
    this.medecinApi.getDossiersPatient(patientId).subscribe({
      next: (response) => {
        if (response.success && response.data && response.data.length > 0) {
          const dossier = response.data[0];
          this.dossierId = dossier.id;
          
          if (dossier.patient) {
            this.patientName = `${dossier.patient.firstName} ${dossier.patient.lastName}`;
          }
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement du patient:', error);
        this.error = 'Impossible de charger les informations du patient';
      }
    });
  }

  get detailsMedicaments() {
    return this.prescriptionForm.get('detailsMedicaments') as FormArray;
  }

  createMedicamentLine(): FormGroup {
    return this.fb.group({
      medicament: ['', Validators.required],
      posologie: ['', Validators.required],
      frequence: ['', Validators.required],
      duree: ['', Validators.required],
      notes: ['']
    });
  }

  addMedicamentLine(): void {
    this.detailsMedicaments.push(this.createMedicamentLine());
  }

  removeMedicamentLine(index: number): void {
    this.detailsMedicaments.removeAt(index);
  }

  getCurrentDate(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  goBack(): void {
    this.location.back();
  }

  onSubmit(): void {
    if (this.prescriptionForm.invalid || !this.dossierId) {
      alert('Veuillez remplir tous les champs requis.');
      return;
    }

    this.isSubmitting = true;
    this.error = '';

    // Créer une ordonnance pour chaque médicament
    const medicaments = this.detailsMedicaments.value;
    const ordonnances = medicaments.map((med: any) => {
      return this.medecinApi.ajouterOrdonnance(this.dossierId!, {
        medicament: med.medicament,
        dosage: med.posologie,
        duree: med.duree,
        instructions: `${med.frequence}. ${med.notes || ''}`
      });
    });

    // Envoyer toutes les ordonnances
    Promise.all(ordonnances.map((obs: Observable<any>) => firstValueFrom(obs)))
      .then(() => {
        alert(`Ordonnance pour ${this.patientName} créée avec succès !`);
        this.router.navigate(['/medecin/dossier-patient', this.patientId]);
      })
      .catch((error) => {
        console.error('Erreur lors de la création de l\'ordonnance:', error);
        this.error = 'Erreur lors de la création de l\'ordonnance';
        this.isSubmitting = false;
      });
  }
}
