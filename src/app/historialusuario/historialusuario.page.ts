import { Component, OnInit } from '@angular/core';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonIcon, IonBackButton, 
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common'; // Necesario para @for y @if
import { addIcons } from 'ionicons';
import { 
  carOutline, 
  locationOutline, 
  chevronForwardOutline, 
  arrowBackOutline,
  checkmarkCircle,
  closeCircle
} from 'ionicons/icons';

@Component({
  selector: 'app-historialusuario',
  templateUrl: './historialusuario.page.html',
  styleUrls: ['./historialusuario.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonButtons,
    IonBackButton, 
    IonIcon, // ← AGREGADO: Faltaba importar IonIcon
  ]
})
export class HistorialusuarioPage implements OnInit {

  // Definición del modelo de datos para los viajes
  trips = [
    {
      id: 101,
      date: '15 de Marzo, 2024 • 14:30',
      price: 125.50,
      origin: '📍 Calle Principal 45, Centro',
      destination: '🏁 Aeropuerto Internacional Terminal 1',
      status: 'completed'
    },
    {
      id: 102,
      date: '14 de Marzo, 2024 • 09:15',
      price: 85.00,
      origin: '📍 Plaza Central Sur',
      destination: '🏁 Gimnasio SmartFit, Av. Reforma',
      status: 'cancelled'
    },
    {
      id: 103,
      date: '12 de Marzo, 2024 • 20:45',
      price: 210.00,
      origin: '📍 Centro Comercial Las Torres',
      destination: '🏁 Residencia Los Olivos #12',
      status: 'completed'
    }
  ];

  constructor() {
    // Registramos todos los iconos que usa el HTML
    addIcons({ 
      carOutline, 
      locationOutline, 
      chevronForwardOutline, 
      arrowBackOutline,
      checkmarkCircle,
      closeCircle
    });
  }

  ngOnInit() {
    // Aquí podrías llamar a un servicio para cargar los datos reales:
    // this.tripService.getHistory().subscribe(res => this.trips = res);
  }

  /**
   * Maneja la acción de "Deslizar para actualizar"
   */
  handleRefresh(event: any) {
    setTimeout(() => {
      // Simulación de recarga de datos
      console.log('Historial actualizado');
      event.target.complete();
    }, 1500);
  }

  /**
   * Navega al detalle del viaje (opcional)
   */
  verDetalleViaje(tripId: number) {
    console.log('Navegando al detalle del viaje:', tripId);
    // this.router.navigate(['/detalle-viaje', tripId]);
  }
}