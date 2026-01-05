import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RendezVous {
  id: string;
  patientId: string;
  medecinId: string;
  dateRendezVous: string;
  duree: number;
  motif: string;
  statut: 'PLANIFIE' | 'CONFIRME' | 'ANNULE' | 'TERMINE';
  notes?: string;
  raisonAnnulation?: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    profilePicture?: string;
  };
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class RendezVousService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Récupérer tous les rendez-vous
   */
  getRendezVous(params?: { futurs?: boolean }): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/rendez-vous`, { params: params as any });
  }

  /**
   * Créer un rendez-vous
   */
  creerRendezVous(data: {
    patientId: string;
    dateRendezVous: string;
    duree: number;
    motif: string;
    notes?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/rendez-vous`, data);
  }

  /**
   * Mettre à jour le statut d'un rendez-vous
   */
  updateStatut(rdvId: string, statut: 'CONFIRME' | 'TERMINE', notes?: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/rendez-vous/${rdvId}/statut`, {
      statut,
      notes
    });
  }

  /**
   * Annuler un rendez-vous
   */
  annulerRendezVous(rdvId: string, raison: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/rendez-vous/${rdvId}/annuler`, {
      raison
    });
  }

  /**
   * Récupérer les rendez-vous à venir
   */
  getRendezVousFuturs(): Observable<any> {
    return this.getRendezVous({ futurs: true });
  }

  /**
   * Récupérer les rendez-vous d'aujourd'hui
   */
  getRendezVousAujourdhui(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/rendez-vous`).pipe();
  }
}
