import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface DoctorPending {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialty: string;
  licenseNumber: string;
  profilePicture?: string;
  createdAt: string;
  status: string;
}

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  status: string;
  profilePicture?: string;
  phone?: string;
  createdAt: string;
  lastConnection?: string;
}

export interface SystemStats {
  totalUsers: number;
  totalPatients: number;
  totalDoctors: number;
  totalAdmins: number;
  pendingDoctors: number;
  activeDoctors: number;
  rejectedDoctors: number;
  totalDossiers: number;
  activeDossiers?: number;
  verifiedDossiers?: number;
  totalMessages: number;
  totalRendezVous: number;
  honoredAppointments?: number;
  plannedAppointments?: number;
  cancelledAppointments?: number;
  registrationHistory?: { date: string; count: number }[];
  specialtyBreakdown?: { specialty: string; count: number }[];
  appointmentStats?: { status: string; count: number }[];
  systemMetrics?: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    uptime: string;
    apiLatency: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AdminApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Récupérer la liste des médecins en attente de validation
   */
  getPendingDoctors(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/doctors/pending`);
  }

  /**
   * Valider ou rejeter un médecin
   */
  validateDoctor(doctorId: string, action: 'approve' | 'reject', rejectionReason?: string): Observable<any> {
    const body = {
      action,
      ...(rejectionReason && { rejectionReason })
    };

    console.log('🔍 validateDoctor - URL:', `${this.apiUrl}/admin/doctors/${doctorId}/validate`);
    console.log('🔍 validateDoctor - Body:', body);

    return this.http.post<any>(`${this.apiUrl}/admin/doctors/${doctorId}/validate`, body);
  }

  /**
   * Récupérer la liste des utilisateurs avec filtres
   */
  getUsers(params?: {
    page?: number;
    limit?: number;
    role?: 'PATIENT' | 'DOCTOR' | 'ADMIN';
    status?: string;
    search?: string;
  }): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/users`, { params: params as any });
  }

  /**
   * Récupérer les détails d'un utilisateur
   */
  getUserDetails(userId: string): Observable<any> {
    const url = `${this.apiUrl}/admin/users/${userId}`;
    console.log('🌐 AdminApiService - Appel GET:', url);

    return this.http.get<any>(url).pipe(
      tap(response => {
        console.log('🌐 AdminApiService - Réponse reçue:', response);
      }),
      catchError(error => {
        console.error('🌐 AdminApiService - Erreur:', error);
        throw error;
      })
    );
  }

  /**
   * Bloquer un utilisateur
   */
  blockUser(userId: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/admin/users/${userId}/block`, {});
  }

  /**
   * Débloquer un utilisateur
   */
  unblockUser(userId: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/admin/users/${userId}/unblock`, {});
  }

  /**
   * Supprimer un utilisateur
   */
  deleteUser(userId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/admin/users/${userId}`);
  }

  /**
   * Récupérer les statistiques du système
   */
  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/stats`).pipe(
      catchError(error => {
        console.error('❌ Erreur lors de la récupération des statistiques:', error);
        throw error;
      })
    );
  }
}
