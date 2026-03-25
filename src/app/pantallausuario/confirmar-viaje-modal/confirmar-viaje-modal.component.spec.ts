import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/standalone'; // Cambio clave aquí
import { ConfirmarViajeComponent } from './confirmar-viaje-modal.component'; // Nombre real de la clase

describe('ConfirmarViajeComponent', () => {
  let component: ConfirmarViajeComponent;
  let fixture: ComponentFixture<ConfirmarViajeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ConfirmarViajeComponent], 
      providers: [provideIonicAngular()] // Proveedor necesario para Ionic
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmarViajeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});