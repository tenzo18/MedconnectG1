import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjoutDiagnostic } from './ajout-diagnostic';

describe('AjoutDiagnostic', () => {
  let component: AjoutDiagnostic;
  let fixture: ComponentFixture<AjoutDiagnostic>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AjoutDiagnostic]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AjoutDiagnostic);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
