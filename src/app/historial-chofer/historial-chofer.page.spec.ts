import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistorialChoferPage } from './historial-chofer.page';

describe('HistorialChoferPage', () => {
  let component: HistorialChoferPage;
  let fixture: ComponentFixture<HistorialChoferPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HistorialChoferPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
