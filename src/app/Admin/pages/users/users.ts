import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminApiService, UserListItem } from '../../services/admin-api.service';
import { LoadingSpinnerComponent } from '../../../components';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  photoUrl: string;
  specialite?: string;
  dateCreation?: string;
}

@Component({
  selector: 'app-users',
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './users.html',
  styleUrl: './users.scss'
})
export class Users implements OnInit {
  private adminApi = inject(AdminApiService);

  allUsers: User[] = [];
  filteredUsers: User[] = [];
  paginatedUsers: User[] = [];
  selectedUser: User | null = null;
  currentSearch: string = '';
  currentFilter: string = 'all';
  loading: boolean = true;
  error: string = '';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 5; // Changé de 10 à 5
  totalPages: number = 0;
  totalItems: number = 0;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    
    // D'abord, essayer de récupérer le nombre total via les stats
    this.adminApi.getStats().subscribe({
      next: (statsResponse) => {
        if (statsResponse.success && statsResponse.data) {
          const expectedTotal = statsResponse.data.totalUsers;
          const expectedDoctors = statsResponse.data.totalDoctors;
          
          // Charger les utilisateurs normalement
          this.loadAllUsersRecursively(1, [], expectedTotal, expectedDoctors);
        } else {
          // Fallback sans stats
          this.loadAllUsersRecursively();
        }
      },
      error: (error) => {
        this.loadAllUsersRecursively();
      }
    });
  }

  private loadAllUsersRecursively(page: number = 1, allUsers: UserListItem[] = [], expectedTotal?: number, expectedDoctors?: number): void {
    this.adminApi.getUsers({ page, limit: 50 }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const users = Array.isArray(response.data) ? response.data : (response.data.users || []);
          const pagination = response.data.pagination;
          
          // Ajouter les utilisateurs de cette page
          allUsers.push(...users);
          
          // Logique de pagination améliorée
          const shouldContinue = this.shouldLoadNextPage(pagination, page, users.length);
          
          if (shouldContinue) {
            this.loadAllUsersRecursively(page + 1, allUsers, expectedTotal, expectedDoctors);
          } else {
            // Vérifier si on a tous les médecins attendus
            this.checkAndLoadMissingDoctors(allUsers, expectedTotal, expectedDoctors);
          }
        } else {
          this.processAllUsers(allUsers, page);
        }
      },
      error: (error) => {
        // En cas d'erreur, traiter les utilisateurs déjà chargés
        if (allUsers.length > 0) {
          this.processAllUsers(allUsers, page - 1);
        } else {
          // Si c'est la première page qui échoue, essayer sans paramètres
          this.loadUsersWithoutParams();
        }
      }
    });
  }

  private checkAndLoadMissingDoctors(allUsers: UserListItem[], expectedTotal?: number, expectedDoctors?: number): void {
    // Supprimer les doublons d'abord
    const uniqueUsers = allUsers.filter((user, index, self) => 
      index === self.findIndex(u => u.id === user.id)
    );
    
    const currentDoctors = uniqueUsers.filter(u => u.role === 'DOCTOR').length;
    
    if (expectedDoctors && currentDoctors < expectedDoctors) {
      // Ajouter un message d'avertissement pour l'admin
      this.error = `⚠️ Problème backend : ${expectedDoctors - currentDoctors} médecins manquants. Seuls ${currentDoctors} médecins sur ${expectedDoctors} sont affichés.`;
    }
    
    // Traiter avec les utilisateurs disponibles
    this.processAllUsers(uniqueUsers, 1);
  }

  private shouldLoadNextPage(pagination: any, currentPage: number, usersOnPage: number): boolean {
    // Si pas de pagination, arrêter
    if (!pagination) {
      return false;
    }
    
    // Si la page est vide, arrêter
    if (usersOnPage === 0) {
      return false;
    }
    
    // Si pagination dit qu'il n'y a plus de pages
    if (!pagination.hasNext || currentPage >= pagination.totalPages) {
      return false;
    }
    
    // Sécurité : ne pas dépasser 20 pages
    if (currentPage >= 20) {
      return false;
    }
    
    return true;
  }

  private processAllUsers(allUsers: UserListItem[], totalPages: number): void {
    // Vérifier les doublons par ID
    const uniqueIds = new Set(allUsers.map(u => u.id));
    if (uniqueIds.size !== allUsers.length) {
      // Supprimer les doublons
      const uniqueUsers = allUsers.filter((user, index, self) => 
        index === self.findIndex(u => u.id === user.id)
      );
      allUsers = uniqueUsers;
    }

    this.allUsers = allUsers.map((user: UserListItem) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role === 'DOCTOR' ? 'Médecin' : user.role === 'PATIENT' ? 'Patient' : 'Admin',
      status: this.getStatusLabel(user.status),
      photoUrl: user.profilePicture || 'icon.png',
      dateCreation: user.createdAt
    }));
    
    this.applyFilters();
    this.loading = false;
  }

  private loadUsersWithoutParams(): void {
    this.adminApi.getUsers().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const users = Array.isArray(response.data) ? response.data : (response.data.users || []);
          this.processAllUsers(users, 1);
        } else {
          this.loading = false;
          this.error = 'Aucune donnée reçue du serveur';
        }
      },
      error: (error) => {
        this.error = 'Impossible de charger les utilisateurs';
        this.loading = false;
      }
    });
  }

  // --- Fonctions de Filtre (Inchangées) ---

  onSearch(event: Event): void {
    this.currentSearch = (event.target as HTMLInputElement).value.toLowerCase();
    this.applyFilters();
  }

  onFilter(event: Event): void {
    this.currentFilter = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  setFilter(filter: string): void {
    this.currentFilter = filter;
    this.applyFilters();
  }

  applyFilters(): void {
    let users = this.allUsers;
    
    if (this.currentFilter !== 'all') {
      users = users.filter(u => u.role === this.currentFilter);
    }
    
    if (this.currentSearch) {
      users = users.filter(u =>
        u.name.toLowerCase().includes(this.currentSearch) ||
        u.email.toLowerCase().includes(this.currentSearch)
      );
    }
    
    this.filteredUsers = users;
    this.totalItems = this.filteredUsers.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

    // Reset to first page when filters change
    this.currentPage = 1;
    this.updatePaginatedUsers();

    // Si l'utilisateur sélectionné n'est plus dans la liste filtrée, le désélectionner
    if (this.selectedUser && !this.filteredUsers.find(u => u.id === this.selectedUser!.id)) {
      this.selectedUser = null;
    }
  }

  updatePaginatedUsers(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedUsers();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedUsers();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedUsers();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, this.currentPage - 2);
      const end = Math.min(this.totalPages, start + maxVisiblePages - 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  // --- Fonctions d'Action ---



  /** Activer ou Désactiver le compte (le statut) */
  toggleStatus(id: string): void {
    const user = this.allUsers.find(u => u.id === id);
    if (user) {
      // Ne permettre le toggle que pour les utilisateurs actifs ou bloqués
      if (user.status !== 'Actif' && user.status !== 'Bloqué') {
        alert('Impossible de modifier le statut de cet utilisateur');
        return;
      }

      const action = user.status === 'Actif' ? 'bloquer' : 'débloquer';

      if (confirm(`Voulez-vous ${action} ce compte ?`)) {
        const apiCall = user.status === 'Actif'
          ? this.adminApi.blockUser(id)
          : this.adminApi.unblockUser(id);

        apiCall.subscribe({
          next: (response: any) => {
            if (response.success) {
              user.status = user.status === 'Actif' ? 'Bloqué' : 'Actif';
              this.applyFilters();
            }
          },
          error: (error: any) => {
            alert('Impossible de modifier le statut de l\'utilisateur');
          }
        });
      }
    }
  }

  /** TrackBy function pour optimiser les performances de la liste */
  trackByUserId(index: number, user: User): string {
    return user.id;
  }

  /** Sélectionner un utilisateur pour afficher ses détails */
  selectUser(user: User): void {
    this.selectedUser = user;
  }

  /** Obtenir le texte "À propos" */
  getAboutText(user: User): string {
    switch (user.role) {
      case 'Médecin':
        return 'Médecin expérimenté spécialisé dans les soins de santé primaires avec une expertise en technologie médicale moderne.';
      case 'Patient':
        return 'Patient actif utilisant la plateforme Med-Connect pour gérer ses rendez-vous et consultations médicales.';
      case 'Admin':
        return 'Administrateur système responsable de la gestion de la plateforme Med-Connect et du support utilisateur.';
      default:
        return 'Utilisateur de la plateforme Med-Connect.';
    }
  }

  /** Obtenir le libellé du statut */
  getStatusLabel(status: string): string {
    switch (status) {
      case 'ACTIVE':
      case 'APPROVED':
        return 'Actif';
      case 'PENDING':
        return 'En attente';
      case 'BLOCKED':
        return 'Bloqué';
      case 'REJECTED':
        return 'Rejeté';
      case 'INACTIVE':
        return 'Inactif';
      default:
        return status;
    }
  }
}