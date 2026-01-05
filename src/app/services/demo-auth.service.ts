import { Injectable } from '@angular/core';

/**
 * Service pour simuler une authentification en mode démo
 * Utilisé quand le backend n'est pas disponible
 */
@Injectable({
  providedIn: 'root'
})
export class DemoAuthService {

  /**
   * Créer une session de démonstration pour un médecin
   */
  createDemoSession(): void {
    const demoUser = {
      id: 'demo-doctor-id',
      email: 'dr.demo@medconnect.com',
      firstName: 'Jean',
      lastName: 'Martin',
      role: 'DOCTOR' as const,
      status: 'APPROVED',
      profilePicture: undefined,
      phone: '06 12 34 56 78',
      specialty: 'Médecine générale',
      licenseNumber: 'MD123456',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const demoTokens = {
      accessToken: 'demo-access-token-' + Date.now(),
      refreshToken: 'demo-refresh-token-' + Date.now()
    };

    // Stocker en localStorage
    localStorage.setItem('currentUser', JSON.stringify(demoUser));
    localStorage.setItem('accessToken', demoTokens.accessToken);
    localStorage.setItem('refreshToken', demoTokens.refreshToken);

    console.log('Session de démonstration créée pour le médecin:', demoUser);
  }

  /**
   * Vérifier si on est en mode démo
   */
  isDemoMode(): boolean {
    const token = localStorage.getItem('accessToken');
    return token ? token.startsWith('demo-') : false;
  }

  /**
   * Nettoyer la session de démo
   */
  clearDemoSession(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}