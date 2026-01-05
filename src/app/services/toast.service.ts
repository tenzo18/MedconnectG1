import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toasts.asObservable();

  /**
   * Afficher un toast de succès
   */
  success(title: string, message: string, duration: number = 5000): void {
    this.addToast({
      type: 'success',
      title,
      message,
      duration
    });
  }

  /**
   * Afficher un toast d'erreur
   */
  error(title: string, message: string, duration: number = 8000): void {
    this.addToast({
      type: 'error',
      title,
      message,
      duration
    });
  }

  /**
   * Afficher un toast d'avertissement
   */
  warning(title: string, message: string, duration: number = 6000): void {
    this.addToast({
      type: 'warning',
      title,
      message,
      duration
    });
  }

  /**
   * Afficher un toast d'information
   */
  info(title: string, message: string, duration: number = 5000): void {
    this.addToast({
      type: 'info',
      title,
      message,
      duration
    });
  }

  /**
   * Afficher un toast avec action
   */
  withAction(
    type: Toast['type'],
    title: string,
    message: string,
    actionLabel: string,
    actionCallback: () => void,
    duration: number = 10000
  ): void {
    this.addToast({
      type,
      title,
      message,
      duration,
      action: {
        label: actionLabel,
        callback: actionCallback
      }
    });
  }

  /**
   * Supprimer un toast
   */
  remove(id: string): void {
    const currentToasts = this.toasts.value;
    const updatedToasts = currentToasts.filter(toast => toast.id !== id);
    this.toasts.next(updatedToasts);
  }

  /**
   * Supprimer tous les toasts
   */
  clear(): void {
    this.toasts.next([]);
  }

  /**
   * Ajouter un toast
   */
  private addToast(toast: Omit<Toast, 'id'>): void {
    const id = this.generateId();
    const newToast: Toast = { ...toast, id };

    const currentToasts = this.toasts.value;
    this.toasts.next([...currentToasts, newToast]);

    // Auto-suppression après la durée spécifiée
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, toast.duration);
    }
  }

  /**
   * Générer un ID unique
   */
  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}