import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Ajouter le token d'accès si disponible
  const token = authService.getAccessToken();
  
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si erreur 401 (token expiré), essayer de rafraîchir
      if (error.status === 401 && token) {
        return authService.refreshToken().pipe(
          switchMap(() => {
            // Retry la requête avec le nouveau token
            const newToken = authService.getAccessToken();
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              }
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            // Si le refresh échoue, déconnecter l'utilisateur
            console.error('Refresh token failed:', refreshError);
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }

      // Pour les autres erreurs, les laisser passer
      return throwError(() => error);
    })
  );
};