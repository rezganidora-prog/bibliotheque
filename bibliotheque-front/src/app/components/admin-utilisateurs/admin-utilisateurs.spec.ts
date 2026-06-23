import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminUtilisateurs } from './admin-utilisateurs';

describe('AdminUtilisateurs', () => {
  let component: AdminUtilisateurs;
  let fixture: ComponentFixture<AdminUtilisateurs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminUtilisateurs],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminUtilisateurs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
