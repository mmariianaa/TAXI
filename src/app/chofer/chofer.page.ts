import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { io } from 'socket.io-client';
import { HttpClient } from '@angular/common/http';
import {
  IonContent, IonIcon, IonButtons, IonHeader, IonTitle,
  IonToolbar, IonMenuButton, IonList, IonItem, IonLabel,
  IonMenu, IonTextarea, AlertController
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
import 'leaflet-routing-machine';

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
  private alertCtrl = inject(AlertController);

  activeTab: string = 'perfil';
  isActive: boolean = true;

  socket: any;
  solicitudesPendientes: any[] = [];
  mostrarAlertaSolicitud: boolean = false;

  driverInfo: any = {
    nombre: '',
    apellido: '',
    vehiculo: { placa: '', marca: '', modelo: '' }
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
      menuOutline, notificationsOutline, personCircle,
      personCircleOutline, saveOutline, carOutline,
      logOutOutline, timeOutline, checkmarkOutline,
      personOutline, homeOutline, radioButtonOn, location,
      mapOutline, star, starOutline
    });
  }

  ngOnInit() {
    const data = this.authService.getUserData();
    if (data) {
      this.driverInfo = data;
      this.socket = io('http://localhost:3000');
      
      const idParaSala = this.driverInfo.id; 
      console.log('🔌 Chofer uniéndose a su sala:', idParaSala);
      this.socket.emit('unirse_sala', idParaSala);

      this.socket.on('notificacion_chofer', (data: any) => {
        console.log('🔥 ¡VIAJE RECIBIDO!', data);
        this.solicitudesPendientes.push(data);
        this.mostrarAlertaSolicitud = true;
      });

      // Eventos de Pago
      this.socket.on('chofer_confirma_efectivo', async (dataPago: any) => {
        const alert = await this.alertCtrl.create({
          header: 'Pago en Efectivo 💵',
          message: 'El usuario pagará en efectivo. ¿Ya recibiste el dinero?',
          backdropDismiss: false,
          buttons: [{ 
            text: 'Sí, pago recibido', 
            handler: () => {
              this.socket.emit('chofer_confirma_pago', dataPago);
              this.confirmarYGuardarViaje();
            } 
          }]
        });
        await alert.present();
      });

      this.socket.on('chofer_pago_recibido', async (dataPago: any) => {
        const alert = await this.alertCtrl.create({
          header: '¡Pago Exitoso! 💳',
          message: 'El usuario ha pagado con tarjeta.',
          buttons: [{ 
            text: 'Aceptar', 
            handler: () => {
              this.socket.emit('chofer_confirma_pago', dataPago);
              this.confirmarYGuardarViaje();
            } 
          }]
        });
        await alert.present();
      });

    } else {
      this.router.navigate(['/home']);
    }
  }

  aceptarViajeSocket(solicitud: any) {
    this.socket.emit('aceptar_viaje', {
      id_viaje: solicitud.id_viaje,
      id_chofer: this.driverInfo?.id_chofer || this.driverInfo?.id,
      id_cliente: solicitud.id_cliente
    });

    this.viajePendiente = {
      id: solicitud.id_viaje,
      id_usuario: solicitud.id_cliente,
      pasajero: solicitud.nombre_cliente,
      ganancia: solicitud.precio,
      origen: solicitud.origen?.direccion || 'Punto de encuentro',
      destino: solicitud.destino?.direccion || 'Destino',
      origenLat: solicitud.origen?.lat || 21.8468,
      origenLng: solicitud.origen?.lng || -102.7188,
      destinoLat: solicitud.destino?.lat || 21.8468,
      destinoLng: solicitud.destino?.lng || -102.7188
    };

    this.solicitudesPendientes = this.solicitudesPendientes.filter(s => s.id_viaje !== solicitud.id_viaje);
    this.viajeAceptado = true;
    this.mostrarAlertaSolicitud = false;

    // Inicializar el mapa después de un pequeño delay para asegurar que el DOM cargó
    setTimeout(() => { this.initMap(); }, 500);
  }

  initMap() {
    if (!this.viajePendiente) return;
    
    if (this.map) {
      this.map.remove();
    }

    // Centrar en la ubicación del usuario (Punto de recogida)
    this.map = L.map('map').setView([this.viajePendiente.origenLat, this.viajePendiente.origenLng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    // Ubicaciones
    const ubicacionChofer = L.latLng(21.8468, -102.7188); // Simulado, aquí iría GPS real
    const ubicacionUsuario = L.latLng(this.viajePendiente.origenLat, this.viajePendiente.origenLng);
    const destinoUsuario = L.latLng(this.viajePendiente.destinoLat, this.viajePendiente.destinoLng);
    
    this.dibujarAmbasRutas(ubicacionChofer, ubicacionUsuario, destinoUsuario);

    setTimeout(() => { this.map.invalidateSize(); }, 300);
  }

  dibujarAmbasRutas(origenChofer: L.LatLng, origenUsuario: L.LatLng, destinoUsuario: L.LatLng) {
    if (!this.map) return;
    
    // 1. Ruta Chofer -> Usuario (Amarilla)
    this.routingControlChofer = (L as any).Routing.control({
      waypoints: [origenChofer, origenUsuario],
      show: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [{ color: '#FFC31F', weight: 6, opacity: 0.8 }]
      },
      router: new (L as any).Routing.OSRMv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1'
      }),
      createMarker: () => null
    }).addTo(this.map);

    // 2. Ruta Usuario -> Destino (Azul)
    this.routingControlUsuario = (L as any).Routing.control({
      waypoints: [origenUsuario, destinoUsuario],
      show: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: false,
      lineOptions: {
        styles: [{ color: '#4285F4', weight: 6, opacity: 0.8 }]
      },
      router: new (L as any).Routing.OSRMv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1'
      }),
      createMarker: () => null
    }).addTo(this.map);

    // Marcadores Personalizados
    this.crearMarcador(origenChofer, '🚕', 'Tu ubicación', '#FFC31F');
    this.crearMarcador(origenUsuario, '📍', 'Recoger a ' + this.viajePendiente.pasajero, '#34C759');
    this.crearMarcador(destinoUsuario, '🏁', 'Destino final', '#FF3B30');
  }

  crearMarcador(latlng: L.LatLng, emoji: string, popup: string, color: string) {
    L.marker(latlng, {
      icon: L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${emoji}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      })
    }).addTo(this.map).bindPopup(popup);
  }

  finalizarViaje() {
    if (!this.viajePendiente) return; 
    alert('Esperando confirmación de pago del usuario...');
    const datosViaje = {
      id_viaje: this.viajePendiente.id,
      id_usuario: this.viajePendiente.id_usuario, 
      id_chofer: this.driverInfo.id 
    };
    this.socket.emit('finalizar_viaje', datosViaje);
  }

  confirmarYGuardarViaje() {
    const datosViajeBD = {
      id_usuario: this.viajePendiente.id_usuario, 
      id_chofer: this.driverInfo.id_chofer || this.driverInfo.id,
      origen: this.viajePendiente.origen,
      destino: this.viajePendiente.destino,
      precio: this.viajePendiente.ganancia, 
      id_pago: 1, 
      estado: 'completado'
    };

    this.http.post('http://localhost:3000/api/registrar-viaje', datosViajeBD)
      .subscribe({
        next: () => {
          this.mostrarModalCalificar = true;
        },
        error: (err) => console.error('Error BD:', err)
      });
  }

  // --- Helpers y Navegación ---
  rechazarViajeSocket(solicitud: any) {
    this.socket.emit('rechazar_viaje', { id_viaje: solicitud.id_viaje, id_cliente: solicitud.id_cliente });
    this.viajesRechazados.unshift({ solicitud, ganancia: solicitud.precio, destino: solicitud.destino?.direccion, hora: new Date().toLocaleTimeString() });
    this.solicitudesPendientes = this.solicitudesPendientes.filter(s => s.id_viaje !== solicitud.id_viaje);
  }

  enviarCalificacion() {
    this.mostrarModalCalificar = false;
    this.viajeAceptado = false;
    this.viajePendiente = null;
    if (this.map) this.map.remove();
  }

  logout() {
    if (this.socket) this.socket.disconnect();
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  setTab(tab: string) { this.activeTab = tab; }
  irAHistorial() { this.router.navigate(['/historial-chofer']); }
  irAPerfil() { this.router.navigate(['/perfil-chofer']); }
  setRating(e: number) { this.ratingActual = e; }
  // --- Métodos para manejar la alerta de nueva solicitud ---
  verSolicitudes() {
    this.mostrarAlertaSolicitud = false;
    this.activeTab = 'viajes';
    // Si tienes un ion-segment o similar, esto cambiará la vista a la lista de viajes
  }

  cerrarAlerta() {
    this.mostrarAlertaSolicitud = false;
  }

  // --- Método para el switch de Activo/Inactivo ---
  toggleStatus() {
    // Si isActive es true, pasará a false y viceversa
    console.log('Disponibilidad cambiada a:', this.isActive ? 'ACTIVO' : 'INACTIVO');
    
    if (!this.isActive) {
      // Si el chofer se pone inactivo, limpiamos el viaje actual por seguridad
      this.viajePendiente = null;
      this.viajeAceptado = false;
      if (this.map) {
        this.map.remove();
      }
    }
  }
}