import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MedecinApiService } from '../../services/medecin-api.service';
import { NotificationService } from '../../../services/notification.service';
import { Subscription } from 'rxjs';
import {
  ChartCardComponent,
  LoadingSpinnerComponent
} from '../../../components';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTooltip,
  ApexStroke,
  ApexTitleSubtitle,
  ApexYAxis,
  ApexLegend,
  ApexPlotOptions,
  ApexFill,
  ApexResponsive,
  NgApexchartsModule
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries | any;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  title: ApexTitleSubtitle;
  yaxis: ApexYAxis;
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
  responsive: ApexResponsive[];
  labels: string[];
  colors: string[];
};

interface DoctorDashboardStats {
  patientsConnectes: number;
  nouveauxPatientsMois: number;
  demandesEnAttente: number;
  rendezVousAujourdhui: number;
  messagesNonLus: number;
  dossiersAccessibles: number;
  ordonnancesSemaine: number;
  patientsRecents: Array<{
    id: string;
    nom: string;
    photo: string;
    dernierContact: string;
    statut: string;
  }>;
}

@Component({
  selector: 'app-dashboard-docteur',
  imports: [
    CommonModule,
    RouterModule,
    ChartCardComponent,
    NgApexchartsModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardDocteur implements OnInit {
  private medecinApi = inject(MedecinApiService);
  private notificationService = inject(NotificationService);
  private refreshSubscription?: Subscription;

  // ApexCharts Configurations
  public activityChartOptions: Partial<ChartOptions> | any;
  public patientDistributionOptions: Partial<ChartOptions> | any;

  stats: DoctorDashboardStats = {
    patientsConnectes: 0,
    nouveauxPatientsMois: 0,
    demandesEnAttente: 0,
    rendezVousAujourdhui: 0,
    messagesNonLus: 0,
    dossiersAccessibles: 0,
    ordonnancesSemaine: 0,
    patientsRecents: []
  };

  loading: boolean = true;
  error: string = '';
  doctorName: string = '';

  ngOnInit(): void {
    this.loadDoctorName();
    this.loadStats();
    this.initChartOptions();

    // S'abonner aux demandes de rafraîchissement
    this.refreshSubscription = this.notificationService.refreshRequested$.subscribe(() => {
      this.loadStats();
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  private initChartOptions(): void {
    this.activityChartOptions = {
      series: [{ name: "Activités", data: [10, 25, 15, 30, 20, 45, 35] }],
      chart: { type: "area", height: 350, toolbar: { show: false }, animations: { enabled: true } },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3 },
      xaxis: { categories: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] },
      colors: ['#1c74bc'],
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [20, 100] } },
      tooltip: { theme: 'light' }
    };

    this.patientDistributionOptions = {
      series: [44, 55, 13, 33],
      chart: { type: "donut", height: 280, animations: { enabled: true } },
      labels: ["Générale", "Cardiologie", "Pédiatrie", "Autre"],
      colors: ['#1c74bc', '#10B981', '#F59E0B', '#EF4444'],
      legend: { position: 'bottom' },
      plotOptions: { pie: { donut: { size: '70%' } } }
    };
  }

  loadDoctorName(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.doctorName = user.lastName || 'Docteur';
      } catch (e) {
        this.doctorName = 'Docteur';
      }
    }
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  getCurrentDate(): string {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return today.toLocaleDateString('fr-FR', options);
  }

  private initializeWeeklyActivity(): void {
    // Supprimé - données non disponibles dans le backend
  }

  loadStats(): void {
    this.loading = true;
    this.error = '';

    // Utiliser la même API que "Mes Patients" qui fonctionne déjà
    this.medecinApi.getPatientsConnectes().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          // Calculer les statistiques basées sur les données des patients connectés
          const patientsData = response.data;
          console.log('📊 Dashboard loading patientsData:', patientsData.length, patientsData);

          // Dédupliquer les patients par ID (même logique que mes-patients)
          const patientsMap = new Map();
          patientsData.forEach((demande: any) => {
            const patientId = demande.patient.id;
            if (!patientsMap.has(patientId) ||
              new Date(demande.dateReponse || demande.dateCreation) >
              new Date(patientsMap.get(patientId).dateConnexion)) {
              patientsMap.set(patientId, {
                id: demande.patient.id,
                nom: `${demande.patient.firstName} ${demande.patient.lastName}`,
                photo: demande.patient.profilePicture || 'icon.png',
                dateConnexion: demande.dateReponse || demande.dateCreation,
                nombreDossiers: demande.nombreDossiersAccessibles || 0
              });
            }
          });

          const patientsUniques = Array.from(patientsMap.values());

          // Calculer nouveaux patients ce mois
          const debutMois = new Date();
          debutMois.setDate(1);
          debutMois.setHours(0, 0, 0, 0);

          const nouveauxPatientsMois = patientsUniques.filter(p =>
            new Date(p.dateConnexion) >= debutMois
          ).length;

          // Calculer total des dossiers accessibles
          const totalDossiers = patientsUniques.reduce((total, p) => total + p.nombreDossiers, 0);

          this.stats = {
            patientsConnectes: patientsUniques.length,
            nouveauxPatientsMois: nouveauxPatientsMois,
            demandesEnAttente: 0, // À charger séparément
            rendezVousAujourdhui: 0, // À charger séparément
            messagesNonLus: 0, // À charger séparément
            dossiersAccessibles: totalDossiers,
            ordonnancesSemaine: 0, // À charger séparément
            patientsRecents: patientsUniques.slice(0, 5).map(p => ({
              id: p.id,
              nom: p.nom,
              photo: p.photo,
              dernierContact: this.getTimeAgo(p.dateConnexion),
              statut: 'Connecté'
            }))
          };

          console.log("✅ Stats du dashboard basées sur les patients connectés:", this.stats);

          // Charger les autres statistiques en parallèle
          this.loadAdditionalStats();
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement des stats:', error);
        this.error = 'Impossible de charger les statistiques.';
        this.loading = false;

        // Pas de données de démonstration - afficher l'erreur réelle
        this.stats = {
          patientsConnectes: 0,
          nouveauxPatientsMois: 0,
          demandesEnAttente: 0,
          rendezVousAujourdhui: 0,
          messagesNonLus: 0,
          dossiersAccessibles: 0,
          ordonnancesSemaine: 0,
          patientsRecents: []
        };
      }
    });
  }

  // Charger les statistiques supplémentaires
  loadAdditionalStats(): void {
    // Demandes en attente
    this.medecinApi.getDemandesConnexion().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const demandesEnAttente = response.data.filter((d: any) => d.statut === 'EN_ATTENTE');
          this.stats.demandesEnAttente = demandesEnAttente.length;
        }
      },
      error: (error) => console.error('Erreur demandes en attente:', error)
    });

    // Rendez-vous d'aujourd'hui
    this.medecinApi.getRendezVousAujourdhui().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.stats.rendezVousAujourdhui = response.data.length || 0;
        }
      },
      error: (error) => console.error('Erreur rendez-vous:', error)
    });

    // Messages non lus
    this.medecinApi.getMessagesNonLus().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Si response.data est un tableau, prendre sa longueur
          const count = Array.isArray(response.data) ? response.data.length : (response.data.count || 0);
          this.stats.messagesNonLus = count;
        }
      },
      error: (error) => console.error('Erreur messages:', error)
    });
  }

  // Calculer le temps écoulé depuis une date
  getTimeAgo(dateString: string): string {
    if (!dateString) return 'Récemment';

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.ceil(diffDays / 7)} semaines`;
    return `Il y a ${Math.ceil(diffDays / 30)} mois`;
  }
}
