import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistrousuarioPage } from './registrousuario.page';

describe('RegistrousuarioPage', () => {
  let component: RegistrousuarioPage;
  let fixture: ComponentFixture<RegistrousuarioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistrousuarioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
