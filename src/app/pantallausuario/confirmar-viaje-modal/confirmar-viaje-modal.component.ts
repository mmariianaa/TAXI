import { Component, Input } from '@angular/core'; 
import { CommonModule } from '@angular/common';
// IMPORTANTE: Importamos desde /standalone
import { 
  ModalController, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonButton, 
  IonIcon, 
  IonContent, 
  IonList, 
  IonItem, 
  IonLabel 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  closeOutline, carSport, mapOutline, timeOutline, 
  alarmOutline, cashOutline, checkmarkCircle, closeCircle 
} from 'ionicons/icons';

@Component({
  selector: 'app-confirmar-viaje',
  templateUrl: './confirmar-viaje-modal.component.html',
  styleUrls: ['./confirmar-viaje-modal.component.scss'],
  standalone: true, // Esto indica que es independiente
  imports: [
    CommonModule, 
    IonHeader, IonToolbar, IonTitle, IonButtons, 
    IonButton, IonIcon, IonContent, IonList, 
    IonItem, IonLabel
    // NOTA: Aquí NO va IonicModule
  ],
  providers: [ModalController] // Proveedor local si no está en el main.ts
})
export class ConfirmarViajeComponent {
  @Input() taxi: any = {};
  @Input() distancia: number = 0;
  @Input() tiempoEstimado: number = 0;
  @Input() tiempoLlegadaTaxi: number = 0;
  @Input() precio: number = 0;

  // Inyectamos el ModalController de forma moderna
  constructor(private modalCtrl: ModalController) {
    // Registramos los iconos uno por uno
    addIcons({
      'close-outline': closeOutline,
      'car-sport': carSport,
      'map-outline': mapOutline,
      'time-outline': timeOutline,
      'alarm-outline': alarmOutline,
      'cash-outline': cashOutline,
      'checkmark-circle': checkmarkCircle,
      'close-circle': closeCircle
    });
  }

  confirmar() {
    // Cerramos el modal pasando datos de éxito
    this.modalCtrl.dismiss({ confirmado: true });
  }

  cancelar() {
    // Cerramos el modal sin datos
    this.modalCtrl.dismiss();
  }
}