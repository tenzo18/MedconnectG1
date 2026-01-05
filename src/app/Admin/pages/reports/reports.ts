import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApiService, SystemStats } from '../../services/admin-api.service';
import {
  ChartCardComponent,
  LoadingSpinnerComponent
} from '../../../components';

interface WeeklyDataPoint {
  label: string;
  value: number;
  percentage: number;
}

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
  labels: string[];
  colors: string[];
};

@Component({
  selector: 'app-reports',
  imports: [CommonModule, ChartCardComponent, NgApexchartsModule, LoadingSpinnerComponent],
  templateUrl: './reports.html',
  styleUrl: './reports.scss'
})
export class Reports implements OnInit {
  private adminApi = inject(AdminApiService);

  stats: SystemStats | null = null;
  loading: boolean = true;
  error: string = '';

  // ApexCharts Configurations
  public registrationChartOptions: Partial<ChartOptions> | any;
  public specialtyChartOptions: Partial<ChartOptions> | any;

  ngOnInit(): void {
    this.initChartOptions();
    this.loadStats();
  }

  private initChartOptions(): void {
    this.registrationChartOptions = {
      series: [{ name: "Inscriptions", data: [] }],
      chart: { type: "area", height: 260, toolbar: { show: false }, zoom: { enabled: false } },
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 3 },
      fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [20, 100] } },
      xaxis: { categories: [], labels: { style: { fontWeight: 600, fontSize: '11px' } } },
      yaxis: { labels: { style: { fontWeight: 600, fontSize: '11px' } } },
      colors: ['#1c74bc'],
      tooltip: { x: { format: "dd/MM" } },
      responsive: [
        { breakpoint: 768, options: { chart: { height: 220 } } },
        { breakpoint: 480, options: { chart: { height: 180 }, xaxis: { labels: { style: { fontSize: '9px' } } } } }
      ]
    };

    this.specialtyChartOptions = {
      series: [{ name: "Médecins", data: [] }],
      chart: { type: "bar", height: 280, toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '55%' } },
      dataLabels: { enabled: true, textAnchor: 'start', style: { colors: ['#fff'], fontSize: '10px' }, formatter: (val: any) => val },
      xaxis: { categories: [], labels: { style: { fontSize: '10px' } } },
      yaxis: { labels: { style: { fontWeight: 600, fontSize: '10px' } } },
      colors: ['#8B5CF6'],
      tooltip: { theme: 'light' },
      responsive: [
        { breakpoint: 768, options: { chart: { height: 250 } } },
        { breakpoint: 480, options: { chart: { height: 220 }, dataLabels: { enabled: false } } }
      ]
    };
  }

  loadStats(): void {
    this.loading = true;
    this.error = '';

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
            totalMessages: data.totalMessages || 0,
            totalRendezVous: data.totalRendezVous || 0,
            registrationHistory: data.registrationHistory || [],
            specialtyBreakdown: data.specialtyBreakdown || [],
            appointmentStats: data.appointmentStats || [],
            systemMetrics: data.systemMetrics
          };
          this.updateCharts();
        } else {
          this.error = 'Aucune donnée disponible';
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Erreur serveur';
        this.loading = false;
      }
    });
  }

  updateCharts(): void {
    if (!this.stats) return;

    // Mise à jour Evolution (Area Chart)
    if (this.stats.registrationHistory && this.stats.registrationHistory.length > 0) {
      const history = [...this.stats.registrationHistory].slice(-7);
      this.registrationChartOptions.series = [{
        name: "Inscriptions",
        data: history.map(h => h.count)
      }];
      this.registrationChartOptions.xaxis = {
        categories: history.map(h => {
          const date = new Date(h.date);
          const label = date.toLocaleDateString('fr-FR', { weekday: 'short' });
          return label.charAt(0).toUpperCase() + label.slice(1, 3);
        })
      };
    }

    // Mise à jour Spécialités (Horizontal Bar)
    if (this.stats.specialtyBreakdown && this.stats.specialtyBreakdown.length > 0) {
      this.specialtyChartOptions.series = [{
        name: "Médecins",
        data: this.stats.specialtyBreakdown.map(s => s.count)
      }];
      this.specialtyChartOptions.xaxis = {
        categories: this.stats.specialtyBreakdown.map(s => s.specialty)
      };
    }
  }

  refreshStats(): void {
    this.loadStats();
  }

  getPercentage(value: number, total: number): number {
    return total === 0 ? 0 : Math.round((value / total) * 100);
  }

  getAveragePerPatient(): string {
    if (!this.stats || this.stats.totalPatients === 0) return '0';
    return (this.stats.totalDossiers / this.stats.totalPatients).toFixed(1);
  }

  getGrowthRate(): string {
    if (!this.stats || !this.stats.registrationHistory || this.stats.registrationHistory.length < 2) return '0';
    const history = this.stats.registrationHistory;
    const last7Days = history.slice(-7);
    const previous7Days = history.slice(-14, -7);

    const currentTotal = last7Days.reduce((acc, curr) => acc + curr.count, 0);
    const previousTotal = previous7Days.reduce((acc, curr) => acc + curr.count, 0);

    if (previousTotal === 0) return currentTotal > 0 ? '+100' : '0';
    const rate = ((currentTotal - previousTotal) / previousTotal) * 100;
    return (rate > 0 ? '+' : '') + Math.round(rate);
  }

  getPlatformHealth(): { status: string; class: string } {
    if (!this.stats || !this.stats.systemMetrics) return { status: 'Indisponible', class: 'text-slate-400' };

    const cpu = this.stats.systemMetrics.cpuUsage;
    if (cpu > 90) return { status: 'Critique', class: 'text-rose-500' };
    if (cpu > 70) return { status: 'Surchargé', class: 'text-amber-500' };
    return { status: 'Optimale', class: 'text-emerald-500' };
  }

  getEngagementRate(): number {
    if (!this.stats || this.stats.totalUsers === 0) return 0;
    // Taux d'engagement basé sur les consultations par rapport au total utilisateurs (estimation)
    const rate = (this.stats.totalRendezVous / this.stats.totalUsers) * 100;
    return Math.min(Math.round(rate * 10) / 10, 100);
  }

  formatNumber(value: number): string {
    return value.toLocaleString('fr-FR');
  }

  getAveragePerDoctor(): string {
    if (!this.stats || this.stats.totalDoctors === 0) return '0';
    return (this.stats.totalRendezVous / this.stats.totalDoctors).toFixed(1);
  }


  Math = Math;
}