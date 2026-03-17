import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth'; 
import { 
  IonContent, IonIcon, IonButtons, IonHeader, IonTitle, 
  IonToolbar, IonMenuButton, IonList, IonItem, IonLabel,
  IonMenu, IonMenuToggle, IonTextarea // Añadido IonTextarea
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  menuOutline, personCircleOutline, logOutOutline, personOutline, 
  timeOutline, carOutline, radioButtonOn, location, mapOutline,
  star, starOutline // Iconos para la calificación
} from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-chofer',
  templateUrl: './chofer.page.html',
  styleUrls: ['./chofer.page.scss'],
  standalone: true,
  imports: [
    FormsModule, CommonModule, IonMenu, IonMenuToggle, IonMenuButton, 
    IonLabel, IonItem, IonList, IonToolbar, IonTitle, 
    IonHeader, IonButtons, IonIcon, IonContent, IonTextarea
  ]
})
export class ChoferPage implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  activeTab: string = 'perfil';
  isActive: boolean = true;
  viajePendiente: any = null;
  viajeAceptado: boolean = false;
  
  // Variables para la Calificación
  mostrarModalCalificar: boolean = false;
  ratingActual: number = 0;
  comentarioUsuario: string = '';

  map!: L.Map;
  viajesRechazados: any[] = [];
  driverInfo: any = { nombre: 'Juan Pablo', vehiculo: { placa: 'UTC-2026', marca: 'Nissan Versa' } };

  constructor() {
    addIcons({ 
      personOutline, carOutline, logOutOutline, personCircleOutline, 
      timeOutline, menuOutline, radioButtonOn, location, mapOutline,
      star, starOutline 
    });
  }

  ngOnInit() {
    const data = this.authService.getUserData();
    if (data) { this.driverInfo = data; }
    this.simularLlegadaDeViaje();
  }

  setTab(tab: string) { this.activeTab = tab; }

  toggleStatus() {
    this.isActive = !this.isActive;
    if (!this.isActive) { 
      this.viajePendiente = null; 
      this.viajeAceptado = false; 
    } else { 
      this.simularLlegadaDeViaje(); 
    }
  }

  simularLlegadaDeViaje() {
    if (this.isActive && !this.viajePendiente && !this.viajeAceptado) {
      setTimeout(() => {
        this.viajePendiente = { 
          id: Date.now(),
          pasajero: 'María López', 
          ganancia: '$120.00',
          origen: 'Plaza Principal, Calvillo',
          destino: 'Fracc. Popular'
        };
      }, 2000);
    }
  }

  aceptarViaje() { 
    this.viajeAceptado = true; 
    setTimeout(() => { this.initMap(); }, 500);
  }

  initMap() {
    const lat = 21.8468;
    const lng = -102.7188;
    if (this.map) { this.map.remove(); }
    this.map = L.map('map').setView([lat, lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);
    L.marker([lat, lng]).addTo(this.map)
      .bindPopup('Recoger a ' + this.viajePendiente?.pasajero)
      .openPopup();
    setTimeout(() => { this.map.invalidateSize(); }, 200);
  }

  rechazarViaje() { 
    if (this.viajePendiente) {
      this.viajesRechazados.unshift({ ...this.viajePendiente, hora: new Date().toLocaleTimeString() });
      this.viajePendiente = null; 
      this.simularLlegadaDeViaje(); 
    }
  }

  // Ahora esta función solo abre el modal
  finalizarViaje() { 
    this.mostrarModalCalificar = true; 
  }

  setRating(estrellas: number) {
    this.ratingActual = estrellas;
  }

  // Esta función confirma y limpia todo
  enviarCalificacion() {
    console.log('Calificación enviada:', this.ratingActual, this.comentarioUsuario);
    
    // Resetear estados
    this.mostrarModalCalificar = false;
    this.viajeAceptado = false; 
    this.viajePendiente = null; 
    this.ratingActual = 0;
    this.comentarioUsuario = '';

    if (this.map) { this.map.remove(); }
    this.simularLlegadaDeViaje(); 
  }

  logout() {
    localStorage.removeItem('user_session'); 
    this.router.navigate(['/home']);
  }
}