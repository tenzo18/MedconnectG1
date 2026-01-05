import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfilMedecin } from './profil-medecin';

describe('ProfilMedecin', () => {
  let component: ProfilMedecin;
  let fixture: ComponentFixture<ProfilMedecin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilMedecin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfilMedecin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
