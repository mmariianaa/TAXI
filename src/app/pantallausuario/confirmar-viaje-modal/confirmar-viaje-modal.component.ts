import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
// IMPORTANTE: Asegúrate de que ModalController esté aquí
import { IonicModule, ModalController } from '@ionic/angular'; 

@Component({
  selector: 'app-confirmar-viaje-modal',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Confirmar Viaje</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="cancelar()">
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="taxi-info">
        <div class="icono-taxi">
          <ion-icon name="car-sport" size="large"></ion-icon>
        </div>
        <h2>{{ taxi?.nombre || 'Chofer' }} {{ taxi?.apellido || '' }}</h2>
        <p class="placa">🚗 Placa: {{ taxi?.placa || 'N/A' }}</p>
      </div>

      <ion-list>
        <ion-item>
          <ion-icon name="map-outline" slot="start" color="primary"></ion-icon>
          <ion-label>
            <h3>Distancia</h3>
            <p>{{ distancia?.toFixed(2) }} km</p>
          </ion-label>
        </ion-item>

        <ion-item>
          <ion-icon name="time-outline" slot="start" color="warning"></ion-icon>
          <ion-label>
            <h3>Tiempo de viaje</h3>
            <p>{{ tiempoEstimado }} min</p>
          </ion-label>
        </ion-item>

        <ion-item>
          <ion-icon name="alarm-outline" slot="start" color="warning"></ion-icon>
          <ion-label>
            <h3>El taxi llegará en</h3>
            <p>{{ tiempoLlegadaTaxi }} min</p>
          </ion-label>
        </ion-item>

        <ion-item>
          <ion-icon name="cash-outline" slot="start" color="success"></ion-icon>
          <ion-label>
            <h3>Precio estimado</h3>
            <p class="precio">\${{ precio }} MXN</p>
          </ion-label>
        </ion-item>
      </ion-list>

      <div class="button-group">
        <ion-button expand="block" color="success" (click)="confirmar()">
          <ion-icon name="checkmark-circle" slot="start"></ion-icon>
          Confirmar Viaje
        </ion-button>
        <ion-button expand="block" color="light" (click)="cancelar()">
          <ion-icon name="close-circle" slot="start"></ion-icon>
          Cancelar
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .taxi-info { text-align: center; margin-bottom: 20px; padding: 20px; background: var(--ion-color-light); border-radius: 12px; }
    .icono-taxi { width: 60px; height: 60px; background: #ffc31f20; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; }
    .icono-taxi ion-icon { font-size: 32px; color: #ffc31f; }
    .placa { color: var(--ion-color-medium); font-size: 14px; }
    .precio { font-size: 18px; font-weight: bold; color: var(--ion-color-success); }
    .button-group { margin-top: 20px; display: flex; flex-direction: column; gap: 10px; }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class ConfirmarViajeModalComponent {
  // Usar @Input() es mejor práctica para recibir datos de componentProps
  @Input() taxi: any;
  @Input() distancia: number = 0;
  @Input() precio: number = 0;
  @Input() tiempoEstimado: number = 0;
  @Input() tiempoLlegadaTaxi: number = 0;

  constructor(private modalController: ModalController) {}

  confirmar() {
    this.modalController.dismiss({ confirmado: true });
  }

  cancelar() {
    this.modalController.dismiss({ confirmado: false });
  }
}