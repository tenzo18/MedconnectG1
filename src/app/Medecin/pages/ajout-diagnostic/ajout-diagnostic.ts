import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MedecinApiService } from '../../services/medecin-api.service';

@Component({
  selector: 'app-ajout-diagnostic',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ajout-diagnostic.html',
  styleUrl: './ajout-diagnostic.scss',
})
export class AjoutDiagnostic implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private fb = inject(FormBuilder);
  private medecinApi = inject(MedecinApiService);

  patientId: string | null = null;
  dossierId: string | null = null;
  patientName: string = 'Patient Inconnu';
  diagnosticForm: FormGroup;
  isSubmitting: boolean = false;
  error: string = '';

  constructor() {
    this.diagnosticForm = this.fb.group({
      titre: ['', Validators.required],
      dateActe: [this.getCurrentDate(), Validators.required],
      details: ['', Validators.required],
      fichierURL: ['']
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
    if (this.diagnosticForm.invalid || !this.dossierId) {
      alert('Veuillez remplir tous les champs requis.');
      return;
    }

    this.isSubmitting = true;
    this.error = '';

    const contenu = `${this.diagnosticForm.value.titre}\n\nDate: ${this.diagnosticForm.value.dateActe}\n\n${this.diagnosticForm.value.details}`;

    this.medecinApi.ajouterCommentaire(this.dossierId, contenu).subscribe({
      next: (response) => {
        console.log('Diagnostic ajouté:', response);
        alert(`Diagnostic pour ${this.patientName} ajouté avec succès !`);
        this.router.navigate(['/medecin/dossier-patient', this.patientId]);
      },
      error: (error) => {
        console.error('Erreur lors de l\'ajout du diagnostic:', error);
        this.error = 'Erreur lors de l\'ajout du diagnostic';
        this.isSubmitting = false;
      }
    });
  }
}
