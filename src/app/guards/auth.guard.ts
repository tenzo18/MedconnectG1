import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard pour protéger les routes nécessitant une authentification
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (!authService.isLoggedIn()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
  
  return true;
};

/**
 * Guard pour les routes Admin uniquement
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (!authService.isLoggedIn()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
  
  if (!authService.hasRole('ADMIN')) {
    console.error('Accès refusé : rôle ADMIN requis');
    router.navigate(['/login']);
    return false;
  }
  
  return true;
};

/**
 * Guard pour les routes Médecin uniquement
 */
export const doctorGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Vérifier d'abord si on a un utilisateur en local storage
  const userStr = localStorage.getItem('currentUser');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.role === 'DOCTOR') {
        return true;
      }
    } catch (e) {
      console.error('Erreur parsing user from storage', e);
    }
  }
  
  // Si pas d'utilisateur local, vérifier l'authentification
  if (!authService.isLoggedIn()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
  
  if (!authService.hasRole('DOCTOR')) {
    console.error('Accès refusé : rôle DOCTOR requis');
    router.navigate(['/login']);
    return false;
  }
  
  return true;
};
