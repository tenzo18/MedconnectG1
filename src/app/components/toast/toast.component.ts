import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div 
        *ngFor="let toast of toasts" 
        class="toast"
        [ngClass]="'toast-' + toast.type"
      >
        <div class="toast-content">
          <div class="toast-header">
            <span class="toast-icon">
              <i [ngClass]="getIconClass(toast.type)"></i>
            </span>
            <strong class="toast-title">{{ toast.title }}</strong>
            <button 
              type="button" 
              class="toast-close"
              (click)="removeToast(toast.id)"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="toast-body">
            {{ toast.message }}
          </div>
          <div *ngIf="toast.action" class="toast-actions">
            <button 
              type="button" 
              class="btn btn-sm btn-outline-primary"
              (click)="executeAction(toast)"
            >
              {{ toast.action.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 400px;
    }

    .toast {
      margin-bottom: 10px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .toast-success {
      background-color: #d4edda;
      border-left: 4px solid #28a745;
      color: #155724;
    }

    .toast-error {
      background-color: #f8d7da;
      border-left: 4px solid #dc3545;
      color: #721c24;
    }

    .toast-warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      color: #856404;
    }

    .toast-info {
      background-color: #d1ecf1;
      border-left: 4px solid #17a2b8;
      color: #0c5460;
    }

    .toast-content {
      padding: 12px 16px;
    }

    .toast-header {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }

    .toast-icon {
      margin-right: 8px;
      font-size: 16px;
    }

    .toast-title {
      flex: 1;
      font-size: 14px;
      font-weight: 600;
    }

    .toast-close {
      background: none;
      border: none;
      font-size: 12px;
      cursor: pointer;
      opacity: 0.7;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toast-close:hover {
      opacity: 1;
    }

    .toast-body {
      font-size: 13px;
      line-height: 1.4;
      margin-bottom: 8px;
    }

    .toast-actions {
      margin-top: 8px;
      text-align: right;
    }

    .btn {
      padding: 4px 12px;
      font-size: 12px;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
    }

    .btn-outline-primary {
      color: #007bff;
      border: 1px solid #007bff;
      background: transparent;
    }

    .btn-outline-primary:hover {
      background-color: #007bff;
      color: white;
    }
  `]
})
export class ToastComponent implements OnInit {
  private toastService = inject(ToastService);
  toasts: Toast[] = [];

  ngOnInit(): void {
    this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  removeToast(id: string): void {
    this.toastService.remove(id);
  }

  executeAction(toast: Toast): void {
    if (toast.action) {
      toast.action.callback();
      this.removeToast(toast.id);
    }
  }

  getIconClass(type: string): string {
    switch (type) {
      case 'success':
        return 'fas fa-check-circle';
      case 'error':
        return 'fas fa-exclamation-circle';
      case 'warning':
        return 'fas fa-exclamation-triangle';
      case 'info':
        return 'fas fa-info-circle';
      default:
        return 'fas fa-info-circle';
    }
  }
}