import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { DossierPatient } from './dossier-patient';

describe('DossierPatient', () => {
  let component: DossierPatient;
  let fixture: ComponentFixture<DossierPatient>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DossierPatient],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(new Map([['id', '501']]))
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DossierPatient);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load patient data', () => {
    expect(component.patient).toBeDefined();
    expect(component.patient?.nom).toBe('Dubois');
  });

  it('should change active tab', () => {
    component.setActiveTab('documents');
    expect(component.activeTab).toBe('documents');
  });
});
