import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Verifications } from './verifications';

describe('Verifications', () => {
  let component: Verifications;
  let fixture: ComponentFixture<Verifications>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Verifications]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Verifications);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
