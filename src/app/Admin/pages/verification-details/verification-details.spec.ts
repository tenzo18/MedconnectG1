import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerificationDetails } from './verification-details';

describe('VerificationDetails', () => {
  let component: VerificationDetails;
  let fixture: ComponentFixture<VerificationDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerificationDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerificationDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
