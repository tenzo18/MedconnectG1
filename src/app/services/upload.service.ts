import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface UploadProgress {
  percentage: number;
  message: string;
}

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Upload simple sans progression
   */
  uploadSimple(file: File, folder?: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }

    return this.http.post<any>(`${this.apiUrl}/upload/simple`, formData);
  }

  /**
   * Upload avec progression (utilise reportProgress)
   */
  uploadWithProgress(file: File, folder?: string): Observable<UploadProgress | UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }

    return this.http.post<any>(`${this.apiUrl}/upload/simple`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<any>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            const percentage = event.total
              ? Math.round((100 * event.loaded) / event.total)
              : 0;
            return {
              percentage,
              message: `Upload en cours: ${percentage}%`
            } as UploadProgress;

          case HttpEventType.Response:
            if (event.body.success && event.body.data) {
              return event.body.data as UploadResult;
            }
            throw new Error('Upload failed');

          default:
            return {
              percentage: 0,
              message: 'Préparation...'
            } as UploadProgress;
        }
      })
    );
  }

  /**
   * Supprimer un fichier
   */
  deleteFile(publicId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/upload/${encodeURIComponent(publicId)}`);
  }

  /**
   * Valider le type de fichier
   */
  validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => file.type.includes(type));
  }

  /**
   * Valider la taille du fichier
   */
  validateFileSize(file: File, maxSizeMB: number): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  /**
   * Obtenir une preview d'image
   */
  getImagePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
