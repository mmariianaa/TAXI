import { Component, Input } from '@angular/core'; // Añadimos Input para recibir datos
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  closeOutline, 
  checkmarkCircle, 
  closeCircle, 
  warningOutline, 
  informationCircle 
} from 'ionicons/icons';

@Component({
  selector: 'app-notificacion-modal',
  template: `
    <ion-header>
      <ion-toolbar [color]="tipo === 'success' ? 'success' : tipo === 'error' ? 'danger' : tipo === 'warning' ? 'warning' : 'primary'">
        <ion-title>{{ titulo }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="cerrar()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding ion-text-center">
      <div class="modal-content">
        <div class="icon-container" [class]="tipo">
          <ion-icon [name]="icono" size="large"></ion-icon>
        </div>
        
        <h3 class="ion-margin-top">{{ titulo }}</h3>
        <p class="mensaje" [innerHTML]="mensajeFormateado"></p>

        <ion-button 
          expand="block" 
          (click)="cerrar()" 
          class="ion-margin-top" 
          [color]="tipo === 'success' ? 'success' : tipo === 'error' ? 'danger' : 'primary'">
          Entendido
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .modal-content { padding: 10px; }
    .icon-container { 
      width: 80px; height: 80px; border-radius: 50%; 
      display: flex; align-items: center; justify-content: center; 
      margin: 0 auto 15px; 
    }
    .success { background-color: rgba(45, 211, 111, 0.2); color: #2dd36f; }
    .error { background-color: rgba(235, 68, 90, 0.2); color: #eb445a; }
    .warning { background-color: rgba(255, 196, 9, 0.2); color: #ffc409; }
    .info { background-color: rgba(56, 128, 255, 0.2); color: #3880ff; }
    .mensaje { font-size: 16px; color: var(--ion-color-medium); }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class NotificacionModalComponent {
  // Usamos @Input para que Angular reconozca las propiedades que pasamos desde componentProps
  @Input() titulo: string = 'Aviso';
  @Input() mensaje: string = '';
  @Input() tipo: 'success' | 'error' | 'warning' | 'info' = 'info';
  @Input() icono: string = 'information-circle';

  constructor(private modalController: ModalController) {
    // Es vital registrar los iconos que usa el modal internamente
    addIcons({ 
      closeOutline, 
      checkmarkCircle, 
      closeCircle, 
      warningOutline, 
      informationCircle 
    });
  }

  get mensajeFormateado(): string {
    return this.mensaje ? this.mensaje.replace(/\n/g, '<br>') : '';
  }

  cerrar() {
    this.modalController.dismiss();
  }
}