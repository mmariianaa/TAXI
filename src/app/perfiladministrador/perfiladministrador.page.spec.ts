import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PerfiladministradorPage } from './perfiladministrador.page';

describe('PerfiladministradorPage', () => {
  let component: PerfiladministradorPage;
  let fixture: ComponentFixture<PerfiladministradorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PerfiladministradorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
