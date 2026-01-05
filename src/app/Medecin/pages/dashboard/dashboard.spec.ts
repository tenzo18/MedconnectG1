import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardDocteur } from './dashboard';

describe('DashboardDocteur', () => {
  let component: DashboardDocteur;
  let fixture: ComponentFixture<DashboardDocteur>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardDocteur]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardDocteur);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load stats on init', () => {
    expect(component.stats.patientsConnectes).toBe(45);
    expect(component.stats.nouveauxPatients).toBe(3);
    expect(component.stats.demandesEnAttente).toBe(5);
    expect(component.stats.messagesNonLus).toBe(8);
    expect(component.stats.diagnosticsRécents).toBe(12);
  });
});
