import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';
import {
  IonContent, IonIcon, IonButtons, IonHeader, IonTitle,
  IonToolbar, IonMenuButton, IonList, IonItem, IonLabel,
  IonMenu, IonMenuToggle, IonTextarea
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  menuOutline, notificationsOutline, personCircle,
  personCircleOutline, saveOutline, carOutline,
  logOutOutline, timeOutline, checkmarkOutline,
  personOutline, homeOutline, radioButtonOn, location, mapOutline,
  star, starOutline,
} from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-chofer',
  templateUrl: './chofer.page.html',
  styleUrls: ['./chofer.page.scss'],
  standalone: true,
  imports: [
    // Componentes del Menú y Estructura
    IonMenu, IonMenuButton,
    // Componentes de la Página
    IonLabel, IonItem, IonList, IonToolbar, IonTitle,
    IonHeader, IonButtons, IonIcon, IonContent, IonTextarea,
    // Módulos extra
    FormsModule, CommonModule
  ]
})
export class ChoferPage implements OnInit {
  // Inyección de servicios
  private authService = inject(AuthService);
  private router = inject(Router);

  // Variables para la vista
  activeTab: string = 'perfil';
  isActive: boolean = true;

  driverInfo: any = {
    nombre: '',
    apellido: '',
    vehiculo: {
      placa: '',
      marca: '',
      modelo: ''
    }
  };

  viajePendiente: any = null;
  viajeAceptado: boolean = false;

  // Variables para la Calificación
  mostrarModalCalificar: boolean = false;
  ratingActual: number = 0;
  comentarioUsuario: string = '';

  map!: L.Map;
  viajesRechazados: any[] = [];

  constructor() {
    // Registramos todos los iconos necesarios
    addIcons({
      menuOutline,
      notificationsOutline,
      personCircle,
      personCircleOutline,
      saveOutline,
      carOutline,
      logOutOutline,
      timeOutline,
      checkmarkOutline,
      personOutline,
      homeOutline,
      radioButtonOn,
      location,
      mapOutline,
      star,
      starOutline
    });
  }

  ngOnInit() {
    // 1. Intentamos obtener los datos de la sesión
    const data = this.authService.getUserData();

    if (data) {
      // 2. Si existen, llenamos la info del chofer
      this.driverInfo = data;
      console.log('Panel cargado para:', this.driverInfo.nombre);
    } else {
      // 3. Si no hay datos, al Login
      this.router.navigate(['/home']);
    }

    this.simularLlegadaDeViaje();
  }

  // Control del Switch de disponibilidad (Online / Offline)
  setTab(tab: string) {
    this.activeTab = tab;
  }

  toggleStatus() {
    // Aquí podrías llamar a un servicio para avisar al backend
    // que el taxi está disponible en el mapa
    console.log('Disponibilidad:', this.isActive ? 'ACTIVO' : 'INACTIVO');
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

  // Acción del botón Guardar Cambios
  saveProfile() {
    alert(`Estado de ${this.driverInfo.nombre} guardado en el servidor.`);
  }

  initMap() {
    const lat = 21.8468;
    const lng = -102.7188;

    if (this.map) {
      this.map.remove();
    }

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
      this.viajesRechazados.unshift({
        ...this.viajePendiente,
        hora: new Date().toLocaleTimeString()
      });
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

    if (this.map) {
      this.map.remove();
    }

    this.simularLlegadaDeViaje();
  }

  // Función de cierre de sesión
  logout() {
    this.authService.logout();
    localStorage.removeItem('user_session');
    this.router.navigate(['/home']);
  }

  irAPerfil() {
    this.router.navigate(['/perfil-chofer']);
  }
}