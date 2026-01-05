import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MessagerieConfig } from '../config/messagerie.config';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private cacheUpdates = new BehaviorSubject<{ key: string; data: any } | null>(null);

  /**
   * Observable pour écouter les mises à jour du cache
   */
  public cacheUpdates$ = this.cacheUpdates.asObservable();

  /**
   * Obtenir une valeur du cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Vérifier si l'entrée a expiré
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Stocker une valeur dans le cache
   */
  set<T>(key: string, data: T, ttl: number = MessagerieConfig.CACHE_TTL): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };

    this.cache.set(key, entry);
    
    // Notifier les abonnés de la mise à jour
    this.cacheUpdates.next({ key, data });
  }

  /**
   * Supprimer une entrée du cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Vider tout le cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Obtenir ou exécuter une fonction avec mise en cache
   */
  getOrSet<T>(
    key: string, 
    factory: () => Observable<T>, 
    ttl: number = MessagerieConfig.CACHE_TTL
  ): Observable<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      console.log(`📦 Cache hit pour ${key}`);
      return of(cached);
    }

    console.log(`🔄 Cache miss pour ${key}, exécution de la factory`);
    return factory().pipe(
      tap(data => {
        this.set(key, data, ttl);
      })
    );
  }

  /**
   * Invalider le cache pour les clés correspondant à un pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`🗑️ Cache invalidé pour le pattern ${pattern}: ${keysToDelete.length} entrées supprimées`);
  }

  /**
   * Obtenir les statistiques du cache
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}