import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminEmpruntsComponent } from './admin-emprunt.component';

describe('AdminEmpruntsComponent', () => {
  let component: AdminEmpruntsComponent;
  let fixture: ComponentFixture<AdminEmpruntsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminEmpruntsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminEmpruntsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
