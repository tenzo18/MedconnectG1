import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DebugMessagerieService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.apiUrl;

  /**
   * Diagnostiquer les conversations d'un médecin
   */
  debugDoctorConversations(doctorId?: string): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    const targetDoctorId = doctorId || currentUser?.id;
    
    console.log('🔍 Debug conversations pour médecin:', targetDoctorId);
    
    return this.http.get<any>(`${this.apiUrl}/debug/doctor-conversations/${targetDoctorId}`);
  }

  /**
   * Créer des messages de test
   */
  createTestMessages(doctorId?: string, patientEmail?: string): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    const targetDoctorId = doctorId || currentUser?.id;
    
    const payload = {
      patientEmail: patientEmail || 'patient.test@example.com',
      messageCount: 5
    };
    
    console.log('🧪 Création de messages de test pour médecin:', targetDoctorId);
    
    return this.http.post<any>(`${this.apiUrl}/debug/create-test-messages/${targetDoctorId}`, payload);
  }

  /**
   * Tester l'API de conversations directement
   */
  testConversationsAPI(): Observable<any> {
    console.log('🔍 Test direct de l\'API conversations');
    return this.http.get<any>(`${this.apiUrl}/messages/conversations`);
  }

  /**
   * Obtenir les informations de l'utilisateur actuel
   */
  getCurrentUserInfo(): any {
    const user = this.authService.getCurrentUser();
    const token = this.authService.getAccessToken();
    
    return {
      user: user,
      hasToken: !!token,
      tokenLength: token?.length || 0,
      isDoctor: user?.role === 'DOCTOR',
      userId: user?.id
    };
  }

  /**
   * Tester la connectivité avec le backend
   */
  testBackendConnectivity(): Observable<any> {
    console.log('🌐 Test de connectivité backend');
    return this.http.get<any>(`${this.apiUrl}/health`);
  }

  /**
   * Diagnostic complet de la messagerie
   */
  async runFullDiagnostic(): Promise<any> {
    const results: any = {
      timestamp: new Date().toISOString(),
      userInfo: this.getCurrentUserInfo(),
      tests: {}
    };

    console.log('🔍 === DIAGNOSTIC COMPLET MESSAGERIE ===');
    console.log('👤 Utilisateur actuel:', results.userInfo);

    try {
      // Test 1: Connectivité backend
      console.log('\n🌐 Test 1: Connectivité backend...');
      const healthResponse = await this.testBackendConnectivity().toPromise();
      results.tests.connectivity = {
        success: true,
        data: healthResponse
      };
      console.log('✅ Backend accessible');
    } catch (error) {
      results.tests.connectivity = {
        success: false,
        error: error
      };
      console.error('❌ Backend inaccessible:', error);
    }

    try {
      // Test 2: API conversations
      console.log('\n💬 Test 2: API conversations...');
      const conversationsResponse = await this.testConversationsAPI().toPromise();
      results.tests.conversationsAPI = {
        success: conversationsResponse.success,
        data: conversationsResponse,
        conversationsCount: conversationsResponse.data?.length || 0
      };
      console.log('✅ API conversations:', conversationsResponse);
    } catch (error) {
      results.tests.conversationsAPI = {
        success: false,
        error: error
      };
      console.error('❌ Erreur API conversations:', error);
    }

    if (results.userInfo.isDoctor && results.userInfo.userId) {
      try {
        // Test 3: Debug spécifique médecin
        console.log('\n🩺 Test 3: Debug médecin...');
        const debugResponse = await this.debugDoctorConversations().toPromise();
        results.tests.doctorDebug = {
          success: debugResponse.success,
          data: debugResponse,
          statistics: debugResponse.data?.statistics
        };
        console.log('✅ Debug médecin:', debugResponse);
      } catch (error) {
        results.tests.doctorDebug = {
          success: false,
          error: error
        };
        console.error('❌ Erreur debug médecin:', error);
      }
    }

    console.log('\n📊 === RÉSULTATS DIAGNOSTIC ===');
    console.log(results);

    return results;
  }
}