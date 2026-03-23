import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';
import { io } from 'socket.io-client';
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
    IonMenu, IonMenuButton,
    IonLabel, IonItem, IonList, IonToolbar, IonTitle,
    IonHeader, IonButtons, IonIcon, IonContent, IonTextarea,
    FormsModule, CommonModule
  ]
})
export class ChoferPage implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  activeTab: string = 'perfil';
  isActive: boolean = true;

  socket: any;
  solicitudesPendientes: any[] = [];
  mostrarAlertaSolicitud: boolean = false;

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

  mostrarModalCalificar: boolean = false;
  ratingActual: number = 0;
  comentarioUsuario: string = '';

  map!: L.Map;
  viajesRechazados: any[] = [];

  // ===== NUEVO: variables para controlar las rutas =====
  routingControlChofer!: any;
  routingControlUsuario!: any;
  // ===== FIN NUEVO =====

  constructor() {
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
  const data = this.authService.getUserData();

  if (data) {
    this.driverInfo = data;
    console.log('Panel cargado para:', this.driverInfo.nombre);

    this.socket = io('http://localhost:3000');
    
    // ✅ CORRECTO: Usar el ID del USUARIO (this.driverInfo.id)
    const idParaSala = this.driverInfo?.id;
    console.log('🔌 Conectando a sala con ID (usuario):', idParaSala);
    this.socket.emit('unirse_sala', idParaSala);

    this.socket.on('notificacion_chofer', (data: any) => {
      console.log('🔥 ¡VIAJE RECIBIDO!', data);
      this.solicitudesPendientes.push(data);
      this.mostrarAlertaSolicitud = true;
    });

  } else {
    this.router.navigate(['/home']);
  }

    
    // ❌ ELIMINADO: this.simularLlegadaDeViaje();
  }

  // Funciones para notificaciones
  verSolicitudes() {
    this.mostrarAlertaSolicitud = false;
    this.activeTab = 'viajes';
  }

  cerrarAlerta() {
    this.mostrarAlertaSolicitud = false;
  }

  aceptarViajeSocket(solicitud: any) {
    console.log('✅ Aceptando viaje:', solicitud);

    this.socket.emit('aceptar_viaje', {
      id_viaje: solicitud.id_viaje,
      id_chofer: this.driverInfo?.id_chofer || this.driverInfo?.id,
      id_cliente: solicitud.id_cliente
    });

    // ===== NUEVO: guardar coordenadas reales =====
    this.viajePendiente = {
      id: solicitud.id_viaje,
      pasajero: solicitud.nombre_cliente,
      ganancia: '$120.00',
      origen: solicitud.origen?.direccion || 'Punto de encuentro',
      destino: solicitud.destino?.direccion || 'Destino',
      // Coordenadas del punto de recogida (usuario)
      origenLat: solicitud.origen?.lat || 21.8468,
      origenLng: solicitud.origen?.lng || -102.7188,
      // Coordenadas del destino final
      destinoLat: solicitud.destino?.lat || 21.8468,
      destinoLng: solicitud.destino?.lng || -102.7188
    };
    // ===== FIN NUEVO =====

    this.solicitudesPendientes = this.solicitudesPendientes.filter(s => s.id_viaje !== solicitud.id_viaje);
    this.viajeAceptado = true;

    alert('¡Viaje aceptado! Dirígete al punto de encuentro.');
    setTimeout(() => { this.initMap(); }, 500);
  }

  rechazarViajeSocket(solicitud: any) {
    console.log('❌ Rechazando viaje:', solicitud);

    this.socket.emit('rechazar_viaje', {
      id_viaje: solicitud.id_viaje,
      id_cliente: solicitud.id_cliente
    });

    this.viajesRechazados.unshift({
      ...solicitud,
      ganancia: '$120.00',
      destino: solicitud.destino?.direccion || 'Destino',
      hora: new Date().toLocaleTimeString()
    });

    this.solicitudesPendientes = this.solicitudesPendientes.filter(s => s.id_viaje !== solicitud.id_viaje);

    alert('Viaje rechazado');
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }

  toggleStatus() {
    console.log('Disponibilidad:', this.isActive ? 'ACTIVO' : 'INACTIVO');
    this.isActive = !this.isActive;

    if (!this.isActive) {
      this.viajePendiente = null;
      this.viajeAceptado = false;
    }
    // ❌ ELIMINADO: this.simularLlegadaDeViaje();
  }

  // ❌ ELIMINADA: simularLlegadaDeViaje()

  aceptarViaje() {
    this.viajeAceptado = true;
    setTimeout(() => { this.initMap(); }, 500);
  }

  saveProfile() {
    alert(`Estado de ${this.driverInfo.nombre} guardado en el servidor.`);
  }

  // ===== NUEVO: función para dibujar ambas rutas =====
  dibujarAmbasRutas(origenChofer: L.LatLng, origenUsuario: L.LatLng, destinoUsuario: L.LatLng) {
    if (!this.map) return;
    
    // Limpiar rutas anteriores
    if (this.routingControlChofer) this.map.removeControl(this.routingControlChofer);
    if (this.routingControlUsuario) this.map.removeControl(this.routingControlUsuario);

    // 1. Ruta del chofer al punto de recogida (color naranja)
    this.routingControlChofer = (L as any).Routing.control({
      waypoints: [origenChofer, origenUsuario],
      show: false,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [{ color: '#FFC31F', weight: 6, opacity: 0.8 }]
      },
      router: new (L as any).Routing.OSRMv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1'
      }),
      createMarker: function() { return null; }
    }).addTo(this.map);

    // 2. Ruta del usuario a su destino (color azul)
    this.routingControlUsuario = (L as any).Routing.control({
      waypoints: [origenUsuario, destinoUsuario],
      show: false,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [{ color: '#4285F4', weight: 6, opacity: 0.8 }]
      },
      router: new (L as any).Routing.OSRMv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1'
      }),
      createMarker: function() { return null; }
    }).addTo(this.map);

    // Agregar marcadores personalizados
    L.marker(origenChofer, {
      icon: L.divIcon({
        className: 'marker-chofer',
        html: '<div style="background-color: #FFC31F; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 2px solid white;">🚕</div>',
        iconSize: [34, 34]
      })
    }).addTo(this.map).bindPopup('Tu ubicación');

    L.marker(origenUsuario, {
      icon: L.divIcon({
        className: 'marker-recogida',
        html: '<div style="background-color: #34C759; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 2px solid white;">📍</div>',
        iconSize: [34, 34]
      })
    }).addTo(this.map).bindPopup('Punto de recogida');

    L.marker(destinoUsuario, {
      icon: L.divIcon({
        className: 'marker-destino',
        html: '<div style="background-color: #FF3B30; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 2px solid white;">🏁</div>',
        iconSize: [34, 34]
      })
    }).addTo(this.map).bindPopup('Destino final');
  }
  // ===== FIN NUEVO =====

  initMap() {
    if (!this.viajePendiente) return;
    
    // ===== NUEVO: usar coordenadas reales para el mapa =====
    const lat = this.viajePendiente.origenLat || 21.8468;
    const lng = this.viajePendiente.origenLng || -102.7188;

    if (this.map) {
      this.map.remove();
    }

    this.map = L.map('map').setView([lat, lng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    // ===== NUEVO: dibujar ambas rutas =====
    // Ubicación del chofer (puedes usar geolocalización real)
    const ubicacionChofer = L.latLng(21.8468, -102.7188); // TODO: usar ubicación real
    
    // Punto de recogida (ubicación del usuario)
    const ubicacionUsuario = L.latLng(
      this.viajePendiente.origenLat,
      this.viajePendiente.origenLng
    );
    
    // Destino final
    const destinoUsuario = L.latLng(
      this.viajePendiente.destinoLat,
      this.viajePendiente.destinoLng
    );
    
    this.dibujarAmbasRutas(ubicacionChofer, ubicacionUsuario, destinoUsuario);
    // ===== FIN NUEVO =====

    setTimeout(() => { this.map.invalidateSize(); }, 200);
  }

  rechazarViaje() {
    if (this.viajePendiente) {
      this.viajesRechazados.unshift({
        ...this.viajePendiente,
        hora: new Date().toLocaleTimeString()
      });
      this.viajePendiente = null;
    }
    // ❌ ELIMINADO: this.simularLlegadaDeViaje();
  }

  finalizarViaje() {
    this.mostrarModalCalificar = true;
  }

  setRating(estrellas: number) {
    this.ratingActual = estrellas;
  }

  enviarCalificacion() {
    console.log('Calificación enviada:', this.ratingActual, this.comentarioUsuario);

    this.mostrarModalCalificar = false;
    this.viajeAceptado = false;
    this.viajePendiente = null;
    this.ratingActual = 0;
    this.comentarioUsuario = '';

    if (this.map) {
      this.map.remove();
    }
  }

  logout() {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.authService.logout();
    localStorage.removeItem('user_session');
    this.router.navigate(['/home']);
  }

  irAPerfil() {
    this.router.navigate(['/perfil-chofer']);
  }
}