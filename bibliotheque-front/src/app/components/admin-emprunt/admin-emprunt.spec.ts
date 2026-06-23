import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminEmprunt } from './admin-emprunt';

describe('AdminEmprunt', () => {
  let component: AdminEmprunt;
  let fixture: ComponentFixture<AdminEmprunt>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminEmprunt],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminEmprunt);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
