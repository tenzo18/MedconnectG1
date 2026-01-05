import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-teleconsultation',
  imports: [CommonModule],
  templateUrl: './teleconsultation.html',
  styleUrl: './teleconsultation.scss',
})
export class Teleconsultation implements OnInit, OnDestroy {
  patientId: number | null = null;
  patientName: string = 'Patient Inconnu';
  callStatus: 'connecting' | 'active' | 'ended' = 'connecting';
  isMuted: boolean = false;
  isVideoOn: boolean = true;
  callDuration: number = 0;
  private intervalId: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Récupérer l'ID du patient
    this.route.paramMap.subscribe(params => {
      this.patientId = Number(params.get('patientId'));
      if (this.patientId === 501) {
        this.patientName = 'Alice Dubois';
      }
      this.startCallSimulation();
    });
  }

  ngOnDestroy(): void {
    // S'assurer que le compteur et l'appel sont nettoyés lorsque l'utilisateur quitte la page
    this.endCall();
  }

  startCallSimulation(): void {
    // 1. Logique d'initialisation du service tiers (ex: connexion à la salle Jitsi)
    console.log(`Tentative de connexion à la salle pour le patient ${this.patientId}...`);

    // 2. Simulation de la connexion réussie après un délai
    setTimeout(() => {
      this.callStatus = 'active';
      this.startTimer();
      console.log('Appel actif.');
    }, 2000);
  }

  startTimer(): void {
    this.intervalId = setInterval(() => {
      this.callDuration++;
    }, 1000);
  }

  endCall(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.callStatus = 'ended';
    console.log('Appel terminé. Durée: ' + this.formatDuration(this.callDuration));

    // 3. Redirection vers le dossier patient (pour ajouter les notes de consultation)
    this.router.navigate(['/medecin/dossier-patient', this.patientId]);
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
    // Logique d'envoi de commande au service vidéo
  }

  toggleVideo(): void {
    this.isVideoOn = !this.isVideoOn;
    // Logique d'envoi de commande au service vidéo
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }
}
