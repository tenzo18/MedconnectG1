import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Teleconsultation } from './teleconsultation';

describe('Teleconsultation', () => {
  let component: Teleconsultation;
  let fixture: ComponentFixture<Teleconsultation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Teleconsultation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Teleconsultation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
