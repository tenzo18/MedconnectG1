import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon, SweetAlertResult } from 'sweetalert2';

@Injectable({
    providedIn: 'root'
})
export class AlertService {
    private readonly primaryColor = '#1c74bc';

    /**
     * Afficher un toast de notification (petit message auto-refermant)
     */
    toast(title: string, icon: SweetAlertIcon = 'success'): void {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast: HTMLElement) => {
                toast.onmouseenter = Swal.stopTimer;
                toast.onmouseleave = Swal.resumeTimer;
            }
        });
        Toast.fire({
            icon: icon,
            title: title
        });
    }

    /**
     * Afficher un message de succès
     */
    success(title: string, text?: string): void {
        Swal.fire({
            title: title,
            text: text,
            icon: 'success',
            confirmButtonColor: this.primaryColor,
            heightAuto: false
        });
    }

    /**
     * Afficher un message d'erreur
     */
    error(title: string, text?: string): void {
        Swal.fire({
            title: title,
            text: text,
            icon: 'error',
            confirmButtonColor: this.primaryColor,
            heightAuto: false
        });
    }

    /**
     * Afficher une boîte de confirmation
     */
    async confirm(title: string, text: string, confirmButtonText: string = 'Confirmer', cancelButtonText: string = 'Annuler'): Promise<boolean> {
        const result = await Swal.fire({
            title: title,
            text: text,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: this.primaryColor,
            cancelButtonColor: '#64748b',
            confirmButtonText: confirmButtonText,
            cancelButtonText: cancelButtonText,
            reverseButtons: true,
            heightAuto: false,
            customClass: {
                container: 'swal-custom-container',
                popup: 'swal-custom-popup rounded-2xl',
                title: 'swal-custom-title font-bold text-slate-800',
                htmlContainer: 'swal-custom-text text-slate-600',
                confirmButton: 'swal-confirm-btn px-6 py-2.5 rounded-xl font-semibold',
                cancelButton: 'swal-cancel-btn px-6 py-2.5 rounded-xl font-semibold'
            }
        });

        return result.isConfirmed;
    }

    /**
     * Message de succès avec redirection ou action après clic
     */
    async successWithAction(title: string, text: string): Promise<SweetAlertResult> {
        return Swal.fire({
            title: title,
            text: text,
            icon: 'success',
            confirmButtonColor: this.primaryColor,
            heightAuto: false
        });
    }
}
