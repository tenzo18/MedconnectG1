import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreationPrescription } from './creation-prescription';

describe('CreationPrescription', () => {
  let component: CreationPrescription;
  let fixture: ComponentFixture<CreationPrescription>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreationPrescription]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreationPrescription);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
