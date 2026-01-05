import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AdminApiService } from './admin-api.service';

// Interface pour les détails complets du médecin
export interface DoctorDetails {
  id: string;
  userId: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  specialite: string;
  numeroOrdre: string;
  dateSoumission: string;
  statut: 'en_attente' | 'approuve' | 'refuse';
  photoUrl: string;
  adresse?: string;
  hopital?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VerificationService {
  private adminApi = inject(AdminApiService);

  /** Retourne la LISTE des médecins en attente */
  getPendingDoctors(): Observable<DoctorDetails[]> {
    return this.adminApi.getPendingDoctors().pipe(
      map(response => {
        if (response.success && response.data) {
          // Le backend peut renvoyer soit un tableau directement, soit un objet avec une propriété doctors
          const doctors = Array.isArray(response.data) ? response.data : (response.data.doctors || []);
          
          console.log('🔍 Données brutes du backend:', doctors[0]); // Debug
          
          // Transformer les données backend vers le format frontend
          return doctors.map((doctor: any) => ({
            id: doctor.doctorId || doctor.id, // Utiliser doctorId pour la validation
            userId: doctor.id, // L'ID utilisateur
            nom: doctor.lastName || '',
            prenom: doctor.firstName || '',
            email: doctor.email,
            telephone: doctor.phone || '',
            specialite: doctor.specialty || '',
            numeroOrdre: doctor.licenseNumber || '',
            dateSoumission: doctor.createdAt,
            statut: 'en_attente',
            photoUrl: doctor.profilePicture || 'icon.png'
          }));
        }
        return [];
      })
    );
  }

  /** Retourne les DÉTAILS d'un médecin par ID */
  getDoctorDetails(id: string): Observable<DoctorDetails | undefined> {
    return this.adminApi.getPendingDoctors().pipe(
      map(response => {
        if (response.success && response.data) {
          const doctors = Array.isArray(response.data) ? response.data : (response.data.doctors || []);
          // Chercher par doctorId OU par id utilisateur (pour compatibilité)
          const doctor = doctors.find((d: any) => d.doctorId === id || d.id === id);
          if (doctor) {
            console.log('🔍 Détails médecin trouvé:', doctor); // Debug
            return {
              id: doctor.doctorId || doctor.id, // Utiliser doctorId pour la validation
              userId: doctor.id, // L'ID utilisateur
              nom: doctor.lastName || '',
              prenom: doctor.firstName || '',
              email: doctor.email,
              telephone: doctor.phone || '',
              specialite: doctor.specialty || '',
              numeroOrdre: doctor.licenseNumber || '',
              dateSoumission: doctor.createdAt,
              statut: 'en_attente',
              photoUrl: doctor.profilePicture || 'icon.png'
            };
          }
        }
        return undefined;
      })
    );
  }

  /** Approuver un médecin */
  approveDoctor(id: string): Observable<any> {
    return this.adminApi.validateDoctor(id, 'approve');
  }

  /** Refuser un médecin */
  refuseDoctor(id: string, reason?: string): Observable<any> {
    return this.adminApi.validateDoctor(id, 'reject', reason);
  }
}