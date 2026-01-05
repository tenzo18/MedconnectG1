import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MesPatients } from './mes-patients';

describe('MesPatients', () => {
  let component: MesPatients;
  let fixture: ComponentFixture<MesPatients>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MesPatients]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MesPatients);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load patients on init', () => {
    expect(component.mesPatients.length).toBe(3);
  });

  it('should have correct patient data', () => {
    const firstPatient = component.mesPatients[0];
    expect(firstPatient.nom).toBe('Alice Dubois');
    expect(firstPatient.niveauPartage).toBe('Complet');
  });
});
