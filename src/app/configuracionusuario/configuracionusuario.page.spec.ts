import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfiguracionusuarioPage } from './configuracionusuario.page';

describe('ConfiguracionusuarioPage', () => {
  let component: ConfiguracionusuarioPage;
  let fixture: ComponentFixture<ConfiguracionusuarioPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfiguracionusuarioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
