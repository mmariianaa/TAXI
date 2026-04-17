import { Component, OnInit, inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { io } from 'socket.io-client';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import 'leaflet-routing-machine';

// 1. Agregamos ModalController y IonButton
import {
  IonContent, IonIcon, IonButtons, IonHeader, IonTitle,
  IonToolbar, IonMenuButton, IonList, IonItem, IonLabel,
  IonMenu, IonTextarea, AlertController, ModalController, IonButton
} from '@ionic/angular/standalone';

// 2. Agregamos los íconos para el modal (checkmarkCircle, closeCircle, warningOutline)
import { addIcons } from 'ionicons';
import {
  menuOutline, notificationsOutline, personCircle,
  personCircleOutline, saveOutline, carOutline,
  logOutOutline, timeOutline, checkmarkOutline,
  personOutline, homeOutline, radioButtonOn, location, mapOutline,
  star, starOutline, checkmarkCircle, closeCircle, warningOutline
} from 'ionicons/icons';

// ==========================================
// COMPONENTE DEL MODAL DE NOTIFICACIÓN
// ==========================================
@Component({
  selector: 'app-notificacion-modal-chofer',
  template: `
    <ion-header>
      <ion-toolbar [color]="tipo === 'success' ? 'success' : tipo === 'error' ? 'danger' : 'primary'">
        <ion-title>{{ titulo }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding ion-text-center">
      <ion-icon [name]="icono" size="large" [color]="tipo === 'success' ? 'success' : 'primary'"></ion-icon>
      <p [innerHTML]="mensaje.replace('\\n', '<br>')"></p>
      <ion-button expand="block" (click)="cerrar()">Entendido</ion-button>
    </ion-content>
  `,
  standalone: true, 
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton]
})
export class NotificacionModalChoferComponent {
  @Input() titulo: string = ''; 
  @Input() mensaje: string = ''; 
  @Input() icono: string = ''; 
  @Input() tipo: string = '';
  
  private modalCtrl = inject(ModalController);
  cerrar() { this.modalCtrl.dismiss(); }
}

// ==========================================
// COMPONENTE PRINCIPAL: CHOFER PAGE
// ==========================================
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
  private modalCtrl = inject(ModalController); // Inyectamos el ModalController

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
      mapOutline, star, starOutline, checkmarkCircle, closeCircle, warningOutline
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

    setTimeout(() => { this.initMap(); }, 500);
  }

  initMap() {
    if (!this.viajePendiente) return;
    
    if (this.map) {
      this.map.remove();
    }

    this.map = L.map('map').setView([this.viajePendiente.origenLat, this.viajePendiente.origenLng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    const ubicacionChofer = L.latLng(21.8468, -102.7188);
    const ubicacionUsuario = L.latLng(this.viajePendiente.origenLat, this.viajePendiente.origenLng);
    const destinoUsuario = L.latLng(this.viajePendiente.destinoLat, this.viajePendiente.destinoLng);
    
    this.dibujarAmbasRutas(ubicacionChofer, ubicacionUsuario, destinoUsuario);

    setTimeout(() => { this.map.invalidateSize(); }, 300);
  }

  dibujarAmbasRutas(origenChofer: L.LatLng, origenUsuario: L.LatLng, destinoUsuario: L.LatLng) {
    if (!this.map) return;
    
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

  rechazarViajeSocket(solicitud: any) {
    this.socket.emit('rechazar_viaje', { id_viaje: solicitud.id_viaje, id_cliente: solicitud.id_cliente });
    this.viajesRechazados.unshift({ solicitud, ganancia: solicitud.precio, destino: solicitud.destino?.direccion, hora: new Date().toLocaleTimeString() });
    this.solicitudesPendientes = this.solicitudesPendientes.filter(s => s.id_viaje !== solicitud.id_viaje);
  }

  // FUNCIÓN PARA ABRIR EL MODAL DE NOTIFICACIÓN
  async abrirModalNotificacion(titulo: string, mensaje: string, icono: string, tipo: string) {
    const modal = await this.modalCtrl.create({
      component: NotificacionModalChoferComponent,
      componentProps: { titulo, mensaje, icono, tipo }
    });
    await modal.present();
    return modal.onDidDismiss();
  }

  // FUNCIÓN ACTUALIZADA DE CALIFICACIÓN (CORREGIDA)
  async enviarCalificacion() {
    if (this.ratingActual === 0) {
      await this.abrirModalNotificacion('Aviso', 'Por favor, selecciona una puntuación antes de enviar.', 'warning-outline', 'primary');
      return;
    }

    // 1. Construir los datos (Corregimos 'rol_evaluador' por 'rol' y quitamos 'id_viaje' de aquí)
    const dataCalificacion = {
      id_emisor: this.driverInfo.id_chofer || this.driverInfo.id, 
      id_receptor: this.viajePendiente.id_usuario,              
      rol: 'chofer',  // <-- CORREGIDO: el backend espera 'rol'                                        
      estrellas: this.ratingActual,
      comentario: this.comentarioUsuario
    };

    // 2. Construir la URL correcta inyectando el ID del viaje
    const urlCalificacion = `http://localhost:3000/api/viajes/${this.viajePendiente.id}/calificar`;

    // 3. Hacer la petición POST
    this.http.post(urlCalificacion, dataCalificacion)
      .subscribe({
        next: async (res) => {
          console.log('✅ Calificación guardada:', res);
          
          await this.abrirModalNotificacion(
            '¡Viaje Finalizado! 🚕',
            'Tu calificación hacia el pasajero ha sido guardada.',
            'checkmark-circle',
            'success'
          );
          
          this.resetearEstadoViaje();
        },
        error: async (err) => {
          console.error('❌ Error al guardar calificación:', err);
          
          // Mostrar mensaje específico si ya había calificado
          const mensajeError = err.error?.error || 'Hubo un problema al guardar tu calificación.';
          
          await this.abrirModalNotificacion(
            'Error',
            mensajeError,
            'close-circle',
            'error'
          );
          
          this.resetearEstadoViaje();
        }
      });
  }

  private resetearEstadoViaje() {
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
    if (this.socket) this.socket.disconnect();
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  setTab(tab: string) { this.activeTab = tab; }
  irAHistorial() { this.router.navigate(['/historial-chofer']); }
  irAPerfil() { this.router.navigate(['/perfil-chofer']); }
  setRating(e: number) { this.ratingActual = e; }
  
  verSolicitudes() {
    this.mostrarAlertaSolicitud = false;
    this.activeTab = 'viajes';
  }

  cerrarAlerta() {
    this.mostrarAlertaSolicitud = false;
  }

  toggleStatus() {
    console.log('Disponibilidad cambiada a:', this.isActive ? 'ACTIVO' : 'INACTIVO');
    if (!this.isActive) {
      this.viajePendiente = null;
      this.viajeAceptado = false;
      if (this.map) {
        this.map.remove();
      }
    }
  }
}