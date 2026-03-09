import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViajenotificacionChoferPage } from './viajenotificacion-chofer.page';

describe('ViajenotificacionChoferPage', () => {
  let component: ViajenotificacionChoferPage;
  let fixture: ComponentFixture<ViajenotificacionChoferPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ViajenotificacionChoferPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
