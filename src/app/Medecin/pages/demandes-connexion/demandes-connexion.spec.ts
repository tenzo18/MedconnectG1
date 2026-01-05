import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DemandesConnexion } from './demandes-connexion';

describe('DemandesConnexion', () => {
  let component: DemandesConnexion;
  let fixture: ComponentFixture<DemandesConnexion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemandesConnexion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DemandesConnexion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load demandes on init', () => {
    expect(component.demandesEnAttente.length).toBe(3);
  });

  it('should accept demande', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.accepterDemande(1);
    expect(component.demandesEnAttente.length).toBe(2);
  });

  it('should refuse demande', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.refuserDemande(1);
    expect(component.demandesEnAttente.length).toBe(2);
  });
});
