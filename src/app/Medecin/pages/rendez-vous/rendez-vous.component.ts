import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RendezVousService, RendezVous } from '../../../services/rendez-vous.service';
import { MedecinApiService } from '../../services/medecin-api.service';

interface WeekDay {
  name: string;
  date: number;
  fullDate: Date;
}

interface CalendarDay {
  day: number;
  date: Date;
  isToday: boolean;
  isOtherMonth: boolean;
  isSelected: boolean;
}

@Component({
  selector: 'app-rendez-vous',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rendez-vous.component.html',
  styleUrl: './rendez-vous.component.scss'
})
export class RendezVousComponent implements OnInit {
  private rdvService = inject(RendezVousService);
  private medecinApi = inject(MedecinApiService);
  private router = inject(Router);

  rendezVousList: RendezVous[] = [];
  filteredRendezVous: RendezVous[] = [];
  patients: any[] = [];
  loading: boolean = true;
  error: string = '';
  filterType: 'tous' | 'futurs' | 'aujourdhui' | 'passes' = 'futurs';
  searchTerm = '';

  // Calendrier
  weekDays: WeekDay[] = [];
  weekDaysShort = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  calendarDays: CalendarDay[] = [];
  currentDate = new Date();
  selectedDate = new Date();

  // Modal de création
  showCreateModal: boolean = false;
  creating: boolean = false;
  durations = [15, 30, 45, 60, 90, 120];

  newRdv = {
    patientId: '',
    date: '',
    time: '',
    duree: 30,
    motif: '',
    notes: '',
    typeConsultation: 'presentiel',
    rappel: true
  };

  ngOnInit(): void {
    this.loadRendezVous();
    this.loadPatients();
    this.initializeWeekDays();
    this.generateCalendarDays();
    this.setDefaultDateTime();
  }

  private initializeWeekDays(): void {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lundi

    this.weekDays = [];
    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);

      this.weekDays.push({
        name: dayNames[i],
        date: date.getDate(),
        fullDate: new Date(date)
      });
    }
  }

  private generateCalendarDays(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    // Premier jour du mois
    const firstDay = new Date(year, month, 1);
    // Dernier jour du mois
    const lastDay = new Date(year, month + 1, 0);

    // Premier lundi de la grille (peut être du mois précédent)
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Lundi = 0
    startDate.setDate(firstDay.getDate() - daysToSubtract);

    this.calendarDays = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Générer 42 jours (6 semaines)
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const isToday = date.getTime() === today.getTime();
      const isOtherMonth = date.getMonth() !== month;
      const isSelected = date.getTime() === this.selectedDate.getTime();

      this.calendarDays.push({
        day: date.getDate(),
        date: new Date(date),
        isToday,
        isOtherMonth,
        isSelected
      });
    }
  }

  // Méthodes pour le calendrier
  previousMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.generateCalendarDays();
  }

  nextMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.generateCalendarDays();
  }

  getCurrentMonthYear(): string {
    return this.currentDate.toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric'
    });
  }

  selectDate(day: CalendarDay): void {
    // Désélectionner l'ancienne date
    this.calendarDays.forEach(d => d.isSelected = false);

    // Sélectionner la nouvelle date
    day.isSelected = true;
    this.selectedDate = new Date(day.date);

    // Filtrer les rendez-vous pour cette date
    this.filterRendezVousForSelectedDate();
  }

  private filterRendezVousForSelectedDate(): void {
    const selectedDay = new Date(this.selectedDate);
    selectedDay.setHours(0, 0, 0, 0);
    const nextDay = new Date(selectedDay);
    nextDay.setDate(selectedDay.getDate() + 1);

    this.filteredRendezVous = this.rendezVousList.filter(rdv => {
      const rdvDate = new Date(rdv.dateRendezVous);
      return rdvDate >= selectedDay && rdvDate < nextDay;
    });
  }

  getCalendarDayClass(day: CalendarDay): string {
    let classes = 'calendar-day';

    if (day.isToday) {
      classes += ' today';
    }

    if (day.isOtherMonth) {
      classes += ' other-month';
    }

    if (day.isSelected) {
      classes += ' selected';
    }

    if (this.getRendezVousCountForDay(day.date) > 0) {
      classes += ' has-appointments';
    }

    return classes;
  }

  getRendezVousCountForDay(date: Date): number {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return this.rendezVousList.filter(rdv => {
      const rdvDate = new Date(rdv.dateRendezVous);
      return rdvDate >= dayStart && rdvDate <= dayEnd;
    }).length;
  }

  formatSelectedDate(): string {
    return this.selectedDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  private setDefaultDateTime(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    this.newRdv.date = tomorrow.toISOString().split('T')[0];
    this.newRdv.time = '09:00';
  }

  loadRendezVous(): void {
    this.loading = true;
    this.error = '';

    const params = this.filterType === 'futurs' ? { futurs: true } : undefined;

    this.rdvService.getRendezVous(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          let rdvs = response.data;

          // Appliquer les filtres
          rdvs = this.applyFilters(rdvs);

          this.rendezVousList = rdvs;
          this.filterRendezVousForSelectedDate();
          console.log('✅ Rendez-vous chargés:', this.rendezVousList.length);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des rendez-vous:', error);
        this.error = 'Impossible de charger les rendez-vous';
        this.loading = false;

        // Pas de données de démonstration - afficher l'erreur
        this.rendezVousList = [];
        this.filteredRendezVous = [];
      }
    });
  }

  private applyFilters(rdvs: RendezVous[]): RendezVous[] {
    const now = new Date();

    switch (this.filterType) {
      case 'aujourdhui':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return rdvs.filter((rdv: RendezVous) => {
          const rdvDate = new Date(rdv.dateRendezVous);
          return rdvDate >= today && rdvDate < tomorrow;
        });

      case 'futurs':
        return rdvs.filter((rdv: RendezVous) => new Date(rdv.dateRendezVous) > now);

      case 'passes':
        return rdvs.filter((rdv: RendezVous) => new Date(rdv.dateRendezVous) < now);

      default:
        return rdvs;
    }
  }

  filterRendezVous(): void {
    if (!this.searchTerm) {
      this.filterRendezVousForSelectedDate();
      return;
    }

    const term = this.searchTerm.toLowerCase();
    const dayFiltered = this.getRendezVousForSelectedDate();

    this.filteredRendezVous = dayFiltered.filter(rdv =>
      rdv.patient?.firstName?.toLowerCase().includes(term) ||
      rdv.patient?.lastName?.toLowerCase().includes(term) ||
      rdv.motif.toLowerCase().includes(term)
    );
  }

  private getRendezVousForSelectedDate(): RendezVous[] {
    const selectedDay = new Date(this.selectedDate);
    selectedDay.setHours(0, 0, 0, 0);
    const nextDay = new Date(selectedDay);
    nextDay.setDate(selectedDay.getDate() + 1);

    return this.rendezVousList.filter(rdv => {
      const rdvDate = new Date(rdv.dateRendezVous);
      return rdvDate >= selectedDay && rdvDate < nextDay;
    });
  }

  loadPatients(): void {
    this.medecinApi.getPatientsConnectes().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Mapper les données des demandes de connexion vers le format patient
          this.patients = response.data.map((demande: any) => ({
            id: demande.patient.id,
            firstName: demande.patient.firstName,
            lastName: demande.patient.lastName,
            email: demande.patient.email,
            profilePicture: demande.patient.profilePicture
          }));
          console.log('✅ Patients chargés pour rendez-vous:', this.patients.length);
        }
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des patients:', error);
        this.patients = [];
      }
    });
  }

  // Méthodes pour les statistiques
  getRendezVousAujourdhui(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.rendezVousList.filter(rdv => {
      const rdvDate = new Date(rdv.dateRendezVous);
      return rdvDate >= today && rdvDate < tomorrow;
    }).length;
  }

  getRendezVousFuturs(): number {
    const now = new Date();
    return this.rendezVousList.filter(rdv => new Date(rdv.dateRendezVous) > now).length;
  }

  // Méthodes pour le calendrier
  getCurrentWeek(): string {
    const start = this.weekDays[0]?.fullDate;
    const end = this.weekDays[6]?.fullDate;

    if (!start || !end) return '';

    return `${start.getDate()} - ${end.getDate()} ${end.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
  }

  getRendezVousForDay(date: Date): RendezVous[] {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return this.rendezVousList.filter(rdv => {
      const rdvDate = new Date(rdv.dateRendezVous);
      return rdvDate >= dayStart && rdvDate <= dayEnd;
    });
  }

  // Modal de création
  openCreateModal(): void {
    this.showCreateModal = true;
    this.setDefaultDateTime();
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  isFormValid(): boolean {
    return !!(this.newRdv.patientId && this.newRdv.date && this.newRdv.time && this.newRdv.motif && this.newRdv.duree);
  }

  creerRendezVous(): void {
    if (!this.isFormValid()) {
      this.showErrorMessage('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.creating = true;

    // Combiner date et heure
    const dateTime = new Date(`${this.newRdv.date}T${this.newRdv.time}`);
    const dateRendezVous = dateTime.toISOString();

    const rdvData = {
      patientId: this.newRdv.patientId,
      dateRendezVous,
      duree: this.newRdv.duree,
      motif: this.newRdv.motif,
      notes: this.newRdv.notes || undefined
    };

    console.log('🔍 Création rendez-vous:', rdvData);

    this.rdvService.creerRendezVous(rdvData).subscribe({
      next: (response) => {
        console.log('✅ Rendez-vous créé:', response);
        this.showSuccessMessage('Rendez-vous créé avec succès !');
        this.closeCreateModal();
        this.resetForm();
        this.loadRendezVous();
        this.creating = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors de la création du rendez-vous:', error);
        let errorMessage = 'Erreur lors de la création du rendez-vous';

        if (error.error?.errors && Array.isArray(error.error.errors)) {
          const validationErrors = error.error.errors.map((e: any) => e.msg).join('. ');
          errorMessage = `Données invalides: ${validationErrors}`;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 403) {
          errorMessage = 'Vous n\'avez pas accès aux dossiers de ce patient';
        } else if (error.status === 400) {
          errorMessage = 'Données invalides. Vérifiez les informations saisies.';
        }

        this.showErrorMessage(errorMessage);
        this.creating = false;
      }
    });
  }

  private resetForm(): void {
    this.newRdv = {
      patientId: '',
      date: '',
      time: '',
      duree: 30,
      motif: '',
      notes: '',
      typeConsultation: 'presentiel',
      rappel: true
    };
    this.setDefaultDateTime();
  }

  // Actions sur les rendez-vous
  confirmerRdv(rdvId: string): void {
    if (!confirm('Confirmer ce rendez-vous ?')) {
      return;
    }

    this.rdvService.updateStatut(rdvId, 'CONFIRME').subscribe({
      next: () => {
        this.showSuccessMessage('Rendez-vous confirmé');
        this.loadRendezVous();
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.showErrorMessage('Erreur lors de la confirmation');
      }
    });
  }

  terminerRdv(rdvId: string): void {
    const notes = prompt('Notes de consultation (optionnel):');

    this.rdvService.updateStatut(rdvId, 'TERMINE', notes || undefined).subscribe({
      next: () => {
        this.showSuccessMessage('Rendez-vous terminé');
        this.loadRendezVous();
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.showErrorMessage('Erreur lors de la finalisation');
      }
    });
  }

  annulerRdv(rdvId: string): void {
    const raison = prompt('Raison de l\'annulation:');

    if (!raison) {
      return;
    }

    this.rdvService.annulerRendezVous(rdvId, raison).subscribe({
      next: () => {
        this.showSuccessMessage('Rendez-vous annulé');
        this.loadRendezVous();
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.showErrorMessage('Erreur lors de l\'annulation');
      }
    });
  }

  // Actions supplémentaires
  envoyerMessage(patient: any): void {
    // Navigation vers la messagerie avec ce patient
    console.log('Envoyer message à:', patient?.firstName, patient?.lastName);
  }

  voirDossierPatient(patientId: string): void {
    if (patientId && patientId.trim() !== '') {
      this.router.navigate(['/medecin/dossier-patient', patientId]);
    }
  }

  // Méthodes utilitaires
  getStatutLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      'PLANIFIE': 'Planifié',
      'CONFIRME': 'Confirmé',
      'ANNULE': 'Annulé',
      'TERMINE': 'Terminé'
    };
    return labels[statut] || statut;
  }

  getStatutClass(statut: string): string {
    const classes: { [key: string]: string } = {
      'PLANIFIE': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
      'CONFIRME': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      'ANNULE': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      'TERMINE': 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
    };
    return classes[statut] || 'bg-gray-100 text-gray-700';
  }

  getStatusBadgeClass(statut: string): string {
    const classes: { [key: string]: string } = {
      'PLANIFIE': 'bg-yellow-500',
      'CONFIRME': 'bg-green-500',
      'ANNULE': 'bg-red-500',
      'TERMINE': 'bg-gray-500'
    };
    return classes[statut] || 'bg-gray-500';
  }

  getStatusIcon(statut: string): string {
    const icons: { [key: string]: string } = {
      'PLANIFIE': 'schedule',
      'CONFIRME': 'check_circle',
      'ANNULE': 'cancel',
      'TERMINE': 'task_alt'
    };
    return icons[statut] || 'help';
  }

  getTimeUntilRendezVous(dateString: string): string {
    const now = new Date();
    const rdvDate = new Date(dateString);
    const diffTime = rdvDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Passé';
    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Demain';
    if (diffDays < 7) return `Dans ${diffDays} jours`;
    return `Dans ${Math.ceil(diffDays / 7)} semaines`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  trackByRendezVous(index: number, rdv: RendezVous): string {
    return rdv.id;
  }

  private showSuccessMessage(message: string): void {
    // TODO: Implémenter un système de notification toast
    console.log('✅ Succès:', message);
    alert(message); // Temporaire
  }

  private showErrorMessage(message: string): void {
    // TODO: Implémenter un système de notification toast
    console.error('❌ Erreur:', message);
    alert(message); // Temporaire
  }
}
