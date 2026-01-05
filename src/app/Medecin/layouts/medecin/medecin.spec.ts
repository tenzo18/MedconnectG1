import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MedecinLayout } from './medecin';

describe('MedecinLayout', () => {
  let component: MedecinLayout;
  let fixture: ComponentFixture<MedecinLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedecinLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MedecinLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
