import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminUtilisateursComponent } from './admin-utilisateurs.component';

describe('AdminUtilisateursComponent', () => {
  let component: AdminUtilisateursComponent;
  let fixture: ComponentFixture<AdminUtilisateursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminUtilisateursComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminUtilisateursComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
