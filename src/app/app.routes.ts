import { Routes } from '@angular/router';
import { authGuard, adminGuard, doctorGuard } from './guards/auth.guard';

// Importez les composants Admin
import { Admin } from './Admin/layouts/admin/admin';
import { Dashboard } from './Admin/pages/dashboard/dashboard';
import { Users } from './Admin/pages/users/users';
import { UserDetails } from './Admin/pages/user-details/user-details';
import { Verifications } from './Admin/pages/verifications/verifications';
import { VerificationDetails } from './Admin/pages/verification-details/verification-details';
import { Reports } from './Admin/pages/reports/reports';

// Importez les composants Medecin
import { MedecinLayout } from './Medecin/layouts/medecin/medecin';
import { DashboardDocteur } from './Medecin/pages/dashboard/dashboard';
import { DemandesConnexion } from './Medecin/pages/demandes-connexion/demandes-connexion';
import { MesPatients } from './Medecin/pages/mes-patients/mes-patients';
import { DossierPatient } from './Medecin/pages/dossier-patient/dossier-patient';
import { DossierDetailComponent } from './Medecin/pages/dossier-detail/dossier-detail';
import { AjoutDiagnostic } from './Medecin/pages/ajout-diagnostic/ajout-diagnostic';
import { CreationPrescription } from './Medecin/pages/creation-prescription/creation-prescription';
import { Messagerie } from './Medecin/pages/messagerie/messagerie';
import { Teleconsultation } from './Medecin/pages/teleconsultation/teleconsultation';
import { ProfilMedecin } from './Medecin/pages/profil-medecin/profil-medecin';
import { RendezVousComponent } from './Medecin/pages/rendez-vous/rendez-vous.component';

// Importez les pages publiques
import { Login } from './pages/login/login';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { Verify2FA } from './pages/verify-2fa/verify-2fa';
import { RegisterDoctor } from './pages/register-doctor/register-doctor';

export const routes: Routes = [
  // Pages publiques
  { path: 'login', component: Login },
  { path: 'forgot-password', component: ForgotPassword },
  { path: 'verify-2fa', component: Verify2FA },
  { path: 'register-doctor', component: RegisterDoctor },

  // Routes Admin (protégées par adminGuard)
  {
    path: 'admin',
    component: Admin,
    canActivate: [adminGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'users', component: Users },
      { path: 'user-details/:id', component: UserDetails },
      { path: 'verifications', component: Verifications },
      { path: 'verification-details/:id', component: VerificationDetails },
      { path: 'reports', component: Reports },
      { path: 'profil', component: ProfilMedecin },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Routes Medecin (protégées par doctorGuard)
  {
    path: 'medecin',
    component: MedecinLayout,
    canActivate: [doctorGuard],
    children: [
      { path: 'dashboard', component: DashboardDocteur },
      { path: 'demandes-connexion', component: DemandesConnexion },
      { path: 'mes-patients', component: MesPatients },
      { path: 'dossier-patient/:id', component: DossierPatient },
      { path: 'dossier-detail/:dossierId', component: DossierDetailComponent },
      { path: 'ajout-diagnostic/:patientId', component: AjoutDiagnostic },
      { path: 'creation-prescription/:patientId', component: CreationPrescription },
      { path: 'messagerie', component: Messagerie },
      { path: 'rendez-vous', component: RendezVousComponent },
      { path: 'teleconsultation/:patientId', component: Teleconsultation },
      { path: 'profil', component: ProfilMedecin },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Redirection globale vers la page de login
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // Gérer les 404
  { path: '**', redirectTo: '/login' }
];