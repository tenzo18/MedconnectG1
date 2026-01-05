import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AdminApiService } from './admin-api.service';

// L'interface de base
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'DOCTOR' | 'PATIENT' | 'ADMIN';
  status: 'ACTIVE' | 'PENDING' | 'BLOCKED';
  photoUrl: string;
  specialite?: string;
  dateCreation?: string;
  phone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private adminApi = inject(AdminApiService);

  /**
   * Récupérer tous les utilisateurs avec filtres
   */
  getUsers(filters?: {
    page?: number;
    limit?: number;
    role?: 'PATIENT' | 'DOCTOR' | 'ADMIN';
    status?: string;
    search?: string;
  }): Observable<User[]> {
    return this.adminApi.getUsers(filters).pipe(
      map(response => {
        if (response.success && response.data?.users) {
          return response.data.users.map((user: any) => ({
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            role: user.role,
            status: user.status,
            photoUrl: user.profilePicture || 'icon.png',
            specialite: user.specialty,
            dateCreation: user.createdAt,
            phone: user.phone
          }));
        }
        return [];
      })
    );
  }

  /**
   * Récupérer un utilisateur par ID
   */
  getUserById(id: string): Observable<User | undefined> {
    return this.adminApi.getUserDetails(id).pipe(
      map(response => {
        console.log('🔍 UserService - Réponse brute de l\'API:', response);
        console.log('🔍 UserService - response.success:', response?.success);
        console.log('🔍 UserService - response.data:', response?.data);
        console.log('🔍 UserService - response.data?.user:', response?.data?.user);
        
        // Essayer différents formats de réponse
        let user = null;
        
        // Format 1: { success: true, data: { user: {...} } }
        if (response?.success && response?.data?.user) {
          user = response.data.user;
          console.log('✅ Format 1 détecté - user dans response.data.user');
        }
        // Format 2: { success: true, data: {...} }
        else if (response?.success && response?.data && !response?.data?.user) {
          user = response.data;
          console.log('✅ Format 2 détecté - user directement dans response.data');
        }
        // Format 3: Données directement dans response
        else if (response && !response.success && response.id) {
          user = response;
          console.log('✅ Format 3 détecté - user directement dans response');
        }
        
        if (user) {
          console.log('✅ UserService - Utilisateur brut:', user);
          console.log('✅ UserService - TOUTES les propriétés:', Object.keys(user));
          console.log('✅ UserService - user.id:', user.id);
          console.log('✅ UserService - user.firstName:', user.firstName);
          console.log('✅ UserService - user.lastName:', user.lastName);
          console.log('✅ UserService - user.email:', user.email);
          console.log('✅ UserService - user.prenom:', user.prenom);
          console.log('✅ UserService - user.nom:', user.nom);
          
          const mappedUser = {
            id: user.id || '',
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A',
            email: user.email || 'N/A',
            role: user.role || 'PATIENT',
            status: user.status || 'ACTIVE',
            photoUrl: user.profilePicture || user.photo || 'icon.png',
            specialite: user.specialty || user.specialite,
            dateCreation: user.createdAt || user.dateCreation,
            phone: user.phone || user.telephone
          };
          
          console.log('✅ UserService - Utilisateur mappé:', mappedUser);
          return mappedUser;
        }
        
        console.log('❌ UserService - Aucune donnée trouvée dans la réponse');
        return undefined;
      })
    );
  }

  /**
   * Bloquer un utilisateur
   */
  blockUser(id: string): Observable<any> {
    return this.adminApi.blockUser(id);
  }

  /**
   * Débloquer un utilisateur
   */
  unblockUser(id: string): Observable<any> {
    return this.adminApi.unblockUser(id);
  }

  /**
   * Supprimer un utilisateur
   */
  deleteUser(id: string): Observable<any> {
    return this.adminApi.deleteUser(id);
  }
}