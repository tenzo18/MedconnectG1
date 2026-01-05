import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { MockDataService } from './mock-data.service';
import { SocketChatService } from './socket-chat.service';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  status: string;
  profilePicture?: string;
  phone?: string;
  // Champs spécifiques aux médecins
  specialty?: string;
  licenseNumber?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    requiresVerification?: boolean;
    tokens?: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export interface Verify2FAResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private mockData = inject(MockDataService);
  private socketService = inject(SocketChatService);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private apiUrl = environment.apiUrl;

  constructor() {
    this.loadUserFromStorage();
  }


  /**
   * Étape 1 : Login (envoie email + password)
   */
  login(email: string, password: string): Observable<LoginResponse> {
    console.log('🔐 Tentative de connexion pour:', email);

    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        console.log('📥 Réponse login reçue:', response);

        if (response.success && response.data.user) {
          console.log('✅ Login réussi pour:', response.data.user.firstName, response.data.user.lastName);

          // Si 2FA requis, stocker temporairement l'userId
          if (response.data.requiresVerification) {
            console.log('🔒 2FA requis pour utilisateur:', response.data.user.id);
            sessionStorage.setItem('pendingUserId', response.data.user.id);
          }
          // Si tokens présents (pas de 2FA), sauvegarder la session
          else if (response.data.tokens) {
            console.log('🎫 Tokens reçus, sauvegarde de la session');
            this.setSession(response.data.tokens, response.data.user);
          }
        } else {
          console.warn('⚠️ Login échoué:', response);
        }
      }),
      catchError((error) => {
        console.error('❌ Erreur lors du login:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Étape 2 : Vérification 2FA
   */
  verify2FA(userId: string, code: string): Observable<Verify2FAResponse> {
    console.log('🔐 Vérification 2FA pour utilisateur:', userId);

    return this.http.post<Verify2FAResponse>(`${this.apiUrl}/auth/verify-2fa`, {
      userId,
      code
    }).pipe(
      tap(response => {
        console.log('📥 Réponse 2FA reçue:', response);

        if (response.success && response.data.tokens) {
          console.log('✅ 2FA validé, sauvegarde de la session');
          this.setSession(response.data.tokens, response.data.user);
          sessionStorage.removeItem('pendingUserId');
        } else {
          console.warn('⚠️ 2FA échoué:', response);
        }
      }),
      catchError((error) => {
        console.error('❌ Erreur lors de la vérification 2FA:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Rafraîchir le token
   */
  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<any>(`${this.apiUrl}/auth/refresh`, {
      refreshToken
    }).pipe(
      tap(response => {
        if (response.success && response.data.tokens) {
          localStorage.setItem('accessToken', response.data.tokens.accessToken);
          localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupérer le profil utilisateur
   */
  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auth/profile`).pipe(
      tap(response => {
        if (response.success && response.data.user) {
          this.currentUserSubject.next(response.data.user);
          localStorage.setItem('currentUser', JSON.stringify(response.data.user));
        }
      }),
      catchError((error) => {
        console.warn('Backend non disponible, utilisation des données mockées');
        const mockProfile = this.mockData.getMockDoctorProfile();
        this.currentUserSubject.next(mockProfile.data.user);
        localStorage.setItem('currentUser', JSON.stringify(mockProfile.data.user));
        return of(mockProfile);
      })
    );
  }

  /**
   * Mettre à jour le profil
   */
  updateProfile(data: Partial<User>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/auth/profile`, data).pipe(
      tap(response => {
        if (response.success && response.data.user) {
          this.currentUserSubject.next(response.data.user);
          localStorage.setItem('currentUser', JSON.stringify(response.data.user));
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Déconnexion
   */
  logout(): void {
    console.log('🚪 Début de la procédure de déconnexion');

    // 1. Déconnecter Socket.IO
    this.disconnectSocket();

    // 2. Récupérer les infos nécessaires avant de vider le localStorage
    const refreshToken = localStorage.getItem('refreshToken');

    // 3. Appel API optionnel pour invalider le token côté serveur
    // On le fait avant de nettoyer localStorage pour avoir l'access token
    this.http.post(`${this.apiUrl}/auth/logout`, { refreshToken }).subscribe({
      next: () => console.log('✅ Déconnexion serveur confirmée'),
      error: (err) => console.log('⚠️ Déconnexion serveur (déjà déconnecté ou erreur):', err.message),
      complete: () => this.finishLogout()
    });

    // Fallback au cas où l'appel logout prendrait trop de temps ou échouerait
    setTimeout(() => this.finishLogout(), 1000);
  }

  /**
   * Finaliser le nettoyage de la session
   */
  private finishLogout(): void {
    if (this.currentUserSubject.value === null) return; // Déjà fait

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('pendingUserId');

    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Obtenir le token d'accès
   */
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Obtenir le refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  /**
   * Obtenir l'utilisateur actuel
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  hasRole(role: 'PATIENT' | 'DOCTOR' | 'ADMIN'): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Stocker la session
   */
  private setSession(tokens: { accessToken: string; refreshToken: string }, user: User): void {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);

    // Connecter Socket.IO après la connexion réussie
    this.connectSocket();
  }

  /**
   * Connecter Socket.IO
   */
  private connectSocket(): void {
    if (this.socketService) {
      this.socketService.connect();
    }
  }

  /**
   * Déconnecter Socket.IO
   */
  private disconnectSocket(): void {
    if (this.socketService) {
      this.socketService.disconnect();
    }
  }

  /**
   * Charger l'utilisateur depuis le stockage
   */
  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);

        // Reconnecter Socket.IO si l'utilisateur était déjà connecté
        if (this.getAccessToken()) {
          this.connectSocket();
        }
      } catch (e) {
        console.error('Error parsing user from storage', e);
      }
    }
  }

  /**
   * Gestion des erreurs
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur est survenue';

    console.error('🚨 Erreur HTTP complète:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      error: error.error,
      message: error.message
    });

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
      console.error('❌ Erreur côté client:', error.error.message);
    } else {
      // Erreur côté serveur
      if (error.error?.error?.message) {
        errorMessage = error.error.error.message;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Erreur ${error.status}: ${error.message}`;
      }

      console.error('❌ Erreur côté serveur:', {
        status: error.status,
        message: errorMessage,
        details: error.error
      });
    }

    console.error('Auth Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
