import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, timer } from 'rxjs';
import { retry, retryWhen, delayWhen } from 'rxjs/operators';
import { MessagerieConfig } from '../config/messagerie.config';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    // Retry automatique pour certaines erreurs
    retryWhen(errors => 
      errors.pipe(
        delayWhen((error: HttpErrorResponse, index: number) => {
          // Retry seulement pour les erreurs 429, 500, 502, 503, 504
          if ([429, 500, 502, 503, 504].includes(error.status) && index < 3) {
            const delay = MessagerieConfig.RETRY_BASE_DELAY * Math.pow(2, index);
            console.log(`🔄 Retry HTTP ${index + 1}/3 dans ${delay}ms pour ${req.url}`);
            return timer(delay);
          }
          // Ne pas retry pour les autres erreurs
          return throwError(() => error);
        })
      )
    ),
    catchError((error: HttpErrorResponse) => {
      // Log détaillé des erreurs
      console.error('❌ Erreur HTTP interceptée:', {
        url: req.url,
        method: req.method,
        status: error.status,
        message: error.message,
        error: error.error
      });

      // Ajouter des informations contextuelles à l'erreur
      const enhancedError = {
        ...error,
        userMessage: getUserFriendlyMessage(error),
        isRetryable: isRetryableError(error),
        timestamp: new Date().toISOString()
      };

      return throwError(() => enhancedError);
    })
  );
};

/**
 * Obtenir un message d'erreur compréhensible par l'utilisateur
 */
function getUserFriendlyMessage(error: HttpErrorResponse): string {
  switch (error.status) {
    case 429:
      return MessagerieConfig.ERROR_MESSAGES.RATE_LIMIT;
    case 401:
      return MessagerieConfig.ERROR_MESSAGES.AUTH_ERROR;
    case 404:
      return MessagerieConfig.ERROR_MESSAGES.NOT_FOUND;
    case 0:
      return MessagerieConfig.ERROR_MESSAGES.NETWORK_ERROR;
    case 500:
    case 502:
    case 503:
    case 504:
      return MessagerieConfig.ERROR_MESSAGES.SERVER_ERROR;
    default:
      return error.error?.message || error.message || 'Une erreur inattendue s\'est produite.';
  }
}

/**
 * Déterminer si une erreur peut être retentée
 */
function isRetryableError(error: HttpErrorResponse): boolean {
  return [429, 500, 502, 503, 504].includes(error.status);
}