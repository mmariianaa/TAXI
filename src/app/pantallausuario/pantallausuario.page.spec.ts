import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PantallausuarioPage } from './pantallausuario.page'; // <--- CAMBIADO EL NOMBRE AQUÍ

describe('PantallausuarioPage', () => { // <--- CAMBIADO EL NOMBRE AQUÍ
  let component: PantallausuarioPage;
  let fixture: ComponentFixture<PantallausuarioPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PantallausuarioPage],
    }).compileComponents();

    fixture = TestBed.createComponent(PantallausuarioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});