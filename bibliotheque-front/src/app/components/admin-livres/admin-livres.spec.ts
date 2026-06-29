import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminLivresComponent } from './admin-livres.component';

describe('AdminLivresComponent', () => {
  let component: AdminLivresComponent;
  let fixture: ComponentFixture<AdminLivresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLivresComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLivresComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
