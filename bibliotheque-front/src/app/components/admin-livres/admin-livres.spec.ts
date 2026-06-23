import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminLivres } from './admin-livres';

describe('AdminLivres', () => {
  let component: AdminLivres;
  let fixture: ComponentFixture<AdminLivres>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLivres],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLivres);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
