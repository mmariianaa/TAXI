import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PerfilusuarioPage } from './pantallausuario.page'; // <--- CAMBIADO EL NOMBRE AQUÍ

describe('PerfilusuarioPage', () => { // <--- CAMBIADO EL NOMBRE AQUÍ
  let component: PerfilusuarioPage;
  let fixture: ComponentFixture<PerfilusuarioPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilusuarioPage],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilusuarioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});