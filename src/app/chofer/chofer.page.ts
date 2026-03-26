import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';
import { io } from 'socket.io-client';
import { HttpClient } from '@angular/common/http';
import {
  IonContent, IonIcon, IonButtons, IonHeader, IonTitle,
  IonToolbar, IonMenuButton, IonList, IonItem, IonLabel,
  IonMenu, IonTextarea
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
  private http = inject(HttpClient);

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

  routingControlChofer!: any;
  routingControlUsuario!: any;

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
  this.socket = io('http://localhost:3000');
  
  // USAR EL ID DE USUARIO (id_usuario) para la sala
  const idParaSala = this.driverInfo.id; 
  console.log('🔌 Chofer uniéndose a su sala de notificaciones:', idParaSala);
  this.socket.emit('unirse_sala', idParaSala);

  this.socket.on('notificacion_chofer', (data: any) => {
    console.log('🔥 ¡VIAJE RECIBIDO!', data);
    this.solicitudesPendientes.push(data);
    this.mostrarAlertaSolicitud = true;
  });

    } else {
      this.router.navigate(['/home']);
    }
  }

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
      id_usuario: solicitud.id_cliente, // <- NUEVO: Guardamos el ID del cliente
      pasajero: solicitud.nombre_cliente,
      ganancia: 120, // <- SUGERENCIA: Manejarlo como número (120) en lugar de '$120.00' para que MySQL lo acepte en el campo Costos
      origen: solicitud.origen?.direccion || 'Punto de encuentro',
      destino: solicitud.destino?.direccion || 'Destino',
      origenLat: solicitud.origen?.lat || 21.8468,
      origenLng: solicitud.origen?.lng || -102.7188,
      destinoLat: solicitud.destino?.lat || 21.8468,
      destinoLng: solicitud.destino?.lng || -102.7188
    };

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
  }

  aceptarViaje() {
    this.viajeAceptado = true;
    setTimeout(() => { this.initMap(); }, 500);
  }

  saveProfile() {
    alert(`Estado de ${this.driverInfo.nombre} guardado en el servidor.`);
  }

  dibujarAmbasRutas(origenChofer: L.LatLng, origenUsuario: L.LatLng, destinoUsuario: L.LatLng) {
    if (!this.map) return;
    
    if (this.routingControlChofer) this.map.removeControl(this.routingControlChofer);
    if (this.routingControlUsuario) this.map.removeControl(this.routingControlUsuario);

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

  initMap() {
    if (!this.viajePendiente) return;
    
    const lat = this.viajePendiente.origenLat || 21.8468;
    const lng = this.viajePendiente.origenLng || -102.7188;

    if (this.map) {
      this.map.remove();
    }

    this.map = L.map('map').setView([lat, lng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    const ubicacionChofer = L.latLng(21.8468, -102.7188);
    
    const ubicacionUsuario = L.latLng(
      this.viajePendiente.origenLat,
      this.viajePendiente.origenLng
    );
    
    const destinoUsuario = L.latLng(
      this.viajePendiente.destinoLat,
      this.viajePendiente.destinoLng
    );
    
    this.dibujarAmbasRutas(ubicacionChofer, ubicacionUsuario, destinoUsuario);

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
  }

  finalizarViaje() {

    this.mostrarModalCalificar = true;

    this.mostrarModalCalificar = true; // Mostramos el modal al usuario
    
    if (!this.viajePendiente) return; // Validación de seguridad

    // 1. Armamos el objeto tal como lo espera el POST '/api/registrar-viaje'
    const datosViaje = {
      id_usuario: this.viajePendiente.id_usuario, 
      id_chofer: this.driverInfo.id_chofer || this.driverInfo.id,
      origen: this.viajePendiente.origen,
      destino: this.viajePendiente.destino,
      precio: this.viajePendiente.ganancia, // Sacamos el precio numérico
      id_pago: 1, // Reemplazar con el ID real si lo recibes del socket (ej: solicitud.id_pago)
      id_ruta: null, // Puedes enviar null si la base de datos lo permite o el ID de la ruta
      estado: 'completado'
    };

    console.log('Enviando datos a BD:', datosViaje);

    // 2. Hacemos la petición POST al backend
    // Asegúrate de cambiar el puerto (3000) por el que use tu backend si es diferente
    this.http.post('http://localhost:3000/api/registrar-viaje', datosViaje)
      .subscribe({
        next: (respuesta: any) => {
          console.log('✅ Viaje guardado en base de datos con éxito:', respuesta);
        },
        error: (error) => {
          console.error('❌ Error al guardar el viaje en la BD:', error);
        }
      });

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