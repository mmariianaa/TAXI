import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PerfilChoferPage } from './perfil-chofer.page';

describe('PerfilChoferPage', () => {
  let component: PerfilChoferPage;
  let fixture: ComponentFixture<PerfilChoferPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PerfilChoferPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
