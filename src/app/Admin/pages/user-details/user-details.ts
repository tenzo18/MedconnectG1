import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { AdminApiService } from '../../services/admin-api.service';
import { LoadingSpinnerComponent } from '../../../components';

// Interface simplifiée pour les informations utilisateur
interface UserDetailInfo {
  id: string;
  name: string;
  email: string;
  role: 'Médecin' | 'Patient' | 'Admin';
  status: 'Actif' | 'Inactif' | 'En attente';
  photoUrl: string;
  specialite?: string;
  dateCreation?: string;
  phone?: string;
  isOnline: boolean;
  firstName?: string;
  lastName?: string;
  licenseNumber?: string;
  lastConnection?: string;
}

@Component({
  selector: 'app-user-details',
  imports: [CommonModule, LoadingSpinnerComponent],
  templateUrl: './user-details.html',
  styleUrl: './user-details.scss'
})
export class UserDetails implements OnInit {

  user: UserDetailInfo | undefined;
  loading: boolean = true;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private adminApi: AdminApiService
  ) { }

  ngOnInit(): void {
    this.getUserDetails();
  }

  getUserDetails(): void {
    // 1. Récupérer l'ID depuis l'URL
    const id = this.route.snapshot.paramMap.get('id');

    console.log('🔍 ID récupéré depuis l\'URL:', id);

    if (!id) {
      console.error("❌ ID utilisateur manquant !");
      this.error = "ID utilisateur manquant";
      this.loading = false;
      return;
    }

    // 2. Appeler le service AdminApi pour récupérer l'utilisateur
    console.log('📡 Appel API pour récupérer l\'utilisateur...');
    this.adminApi.getUserDetails(id).subscribe({
      next: (response) => {
        console.log('✅ Réponse reçue:', response);

        if (response.success && response.data) {
          const userData = response.data;

          // 3. Mapper les données de l'API vers notre interface
          let role: 'Médecin' | 'Patient' | 'Admin' = 'Patient';
          if (userData.role === 'DOCTOR') role = 'Médecin';
          else if (userData.role === 'ADMIN') role = 'Admin';

          let status: 'Actif' | 'Inactif' | 'En attente' = 'Inactif';
          if (userData.status === 'ACTIVE') status = 'Actif';
          else if (userData.status === 'PENDING') status = 'En attente';
          else if (userData.status === 'BLOCKED') status = 'Inactif';

          this.user = {
            id: userData.id,
            name: `${userData.firstName} ${userData.lastName}`,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            role: role,
            status: status,
            photoUrl: userData.profilePicture || 'icon.png',
            specialite: userData.specialty || userData.specialite,
            dateCreation: userData.createdAt,
            phone: userData.phone,
            licenseNumber: userData.licenseNumber,
            lastConnection: userData.lastConnection,
            isOnline: this.isUserOnline(userData.lastConnection)
          };

          console.log('✅ Utilisateur chargé:', this.user);
          this.loading = false;
        } else {
          console.error("❌ Utilisateur non trouvé (réponse vide)");
          this.error = "Utilisateur non trouvé";
          this.loading = false;
        }
      },
      error: (error) => {
        console.error("❌ Erreur lors du chargement de l'utilisateur:", error);
        this.error = "Erreur lors du chargement de l'utilisateur";
        this.loading = false;
      }
    });
  }

  /** Déterminer si l'utilisateur est en ligne basé sur sa dernière connexion */
  private isUserOnline(lastConnection?: string): boolean {
    if (!lastConnection) return false;

    const lastConnectionDate = new Date(lastConnection);
    const now = new Date();
    const diffInMinutes = (now.getTime() - lastConnectionDate.getTime()) / (1000 * 60);

    // Considérer comme en ligne si la dernière connexion est dans les 15 dernières minutes
    return diffInMinutes <= 15;
  }

  /** Bouton de retour */
  goBack(): void {
    this.location.back();
  }

  /** Activer/Désactiver le compte utilisateur */
  toggleUserStatus(): void {
    if (!this.user) return;

    const action = this.user.status === 'Actif' ? 'désactiver' : 'activer';

    if (confirm(`Voulez-vous vraiment ${action} ce compte utilisateur ?`)) {
      const apiCall = this.user.status === 'Actif'
        ? this.adminApi.blockUser(this.user.id)
        : this.adminApi.unblockUser(this.user.id);

      apiCall.subscribe({
        next: (response: any) => {
          if (response.success && this.user) {
            this.user.status = this.user.status === 'Actif' ? 'Inactif' : 'Actif';
            console.log(`Statut changé: ${this.user.status}`);
          }
        },
        error: (error: any) => {
          console.error('Erreur lors du changement de statut:', error);
          alert('Impossible de modifier le statut de l\'utilisateur');
        }
      });
    }
  }

  /** Copier l'ID dans le presse-papiers */
  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      console.log('ID copié dans le presse-papiers');
      // Vous pouvez ajouter une notification toast ici
    }).catch(err => {
      console.error('Erreur lors de la copie:', err);
    });
  }

  /** Formater la date */
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}