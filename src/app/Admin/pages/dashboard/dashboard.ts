import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VerificationService, DoctorDetails } from '../../services/verification';
import { AdminApiService } from '../../services/admin-api.service';
import {
  ChartCardComponent,
  LoadingSpinnerComponent,
  SimpleChartComponent,
  ChartData
} from '../../../components';
import { AuthService, User } from '../../../services/auth.service';

import {
  ChartComponent,
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

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    RouterLink,
    ChartCardComponent,
    NgApexchartsModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private verificationService = inject(VerificationService);
  private adminApi = inject(AdminApiService);
  private authService = inject(AuthService);

  currentUser: User | null = null;
  pendingVerifications: DoctorDetails[] = [];
  totalPendingCount: number = 0;
  stats: any = null;
  loading: boolean = true;
  error: string = '';

  // ApexCharts Configurations
  public userDistributionOptions: Partial<ChartOptions> | any;
  public doctorValidationOptions: Partial<ChartOptions> | any;

  // Données pour le feed d'activité
  recentActivities: any[] = [];

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadPendingVerifications();
    this.loadStats();
    this.loadRecentActivities();
    this.initChartOptions();
  }

  private initChartOptions(): void {
    this.userDistributionOptions = {
      series: [{ name: "Utilisateurs", data: [0, 0, 0] }],
      chart: { type: "bar", height: 250, toolbar: { show: false }, animations: { enabled: true } },
      plotOptions: { bar: { borderRadius: 8, columnWidth: '45%', distributed: true } },
      dataLabels: { enabled: false },
      legend: { show: false },
      xaxis: { categories: ["Admin", "Médecins", "Patients"], labels: { style: { fontWeight: 600 } } },
      colors: ['#8B5CF6', '#10B981', '#F59E0B'],
      tooltip: { theme: 'light' },
      responsive: [
        { breakpoint: 768, options: { chart: { height: 220 }, plotOptions: { bar: { columnWidth: '60%' } } } },
        { breakpoint: 480, options: { chart: { height: 200 }, xaxis: { labels: { rotate: -45, style: { fontSize: '10px' } } } } }
      ]
    };

    this.doctorValidationOptions = {
      series: [0, 0, 0],
      chart: { type: "donut", height: 280, animations: { enabled: true } },
      labels: ["Validés", "En attente", "Refusés"],
      colors: ['#10B981', '#F59E0B', '#EF4444'],
      legend: { position: 'bottom', horizontalAlign: 'center', fontWeight: 600, fontSize: '12px' },
      dataLabels: { enabled: true, dropShadow: { enabled: false } },
      plotOptions: { pie: { donut: { size: '70%', labels: { show: true, total: { show: true, label: 'Total', fontWeight: 700 } } } } },
      responsive: [
        { breakpoint: 768, options: { chart: { height: 250 }, legend: { position: 'bottom' } } },
        { breakpoint: 480, options: { chart: { height: 220 }, legend: { fontSize: '10px' } } }
      ]
    };
  }

  loadPendingVerifications(): void {
    this.verificationService.getPendingDoctors().subscribe({
      next: (doctors) => {
        this.pendingVerifications = doctors.slice(0, 3);
        this.totalPendingCount = doctors.length;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des médecins en attente:', error);
        this.error = 'Impossible de charger les médecins en attente';
        this.loading = false;
      }
    });
  }

  loadStats(): void {
    this.adminApi.getStats().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const data = response.data;
          this.stats = {
            totalUsers: data.totalUsers || 0,
            totalPatients: data.totalPatients || (data.patients?.total || 0),
            totalDoctors: data.totalDoctors || (data.doctors?.total || 0),
            totalAdmins: data.totalAdmins || (data.admins?.total || 0),
            activeDoctors: data.activeDoctors || (data.doctors?.approved || 0),
            pendingDoctors: data.pendingDoctors || (data.doctors?.pending || 0),
            rejectedDoctors: data.rejectedDoctors || (data.doctors?.rejected || 0),
            totalDossiers: data.totalDossiers || 0,
            activeDossiers: data.activeDossiers || 0,
            verifiedDossiers: data.verifiedDossiers || 0,
            totalMessages: data.totalMessages || 0,
            totalRendezVous: data.totalRendezVous || 0,
            honoredAppointments: data.honoredAppointments || 0,
            plannedAppointments: data.plannedAppointments || 0,
            cancelledAppointments: data.cancelledAppointments || 0,
            registrationHistory: data.registrationHistory || [],
          };
          this.loadChartData();
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
        this.stats = {
          totalUsers: 0, totalPatients: 0, totalDoctors: 0, activeDoctors: 0,
          pendingDoctors: this.totalPendingCount, totalAdmins: 0, totalDossiers: 0,
          totalRendezVous: 0, rejectedDoctors: 0
        };
      }
    });
  }

  loadChartData(): void {
    if (!this.stats) return;

    // Mettre à jour Bar Chart
    this.userDistributionOptions.series = [{
      name: "Utilisateurs",
      data: [
        this.stats.totalAdmins || 0,
        this.stats.totalDoctors || 0,
        this.stats.totalPatients || 0
      ]
    }];

    // Mettre à jour Donut Chart
    this.doctorValidationOptions.series = [
      this.stats.activeDoctors || 0,
      this.stats.pendingDoctors || 0,
      this.stats.rejectedDoctors || 0
    ];
  }

  loadRecentActivities(): void {
    // Charger les vraies activités depuis l'API
    this.recentActivities = [];
    // TODO: Implémenter l'appel API pour récupérer les activités récentes
    // this.adminApi.getRecentActivities().subscribe(activities => {
    //   this.recentActivities = activities;
    // });
  }
}
