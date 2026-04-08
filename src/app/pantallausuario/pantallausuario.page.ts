import { Component, OnInit, OnDestroy, Injectable, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http'; 
import { Router, RouterLink } from '@angular/router'; 
import * as L from 'leaflet';
import 'leaflet-routing-machine'; 
import { Geolocation } from '@capacitor/geolocation';
import { addIcons } from 'ionicons'; 
import { 
  personOutline, carOutline, logOutOutline, locationOutline, 
  flagOutline, searchOutline, notificationsOutline, mapOutline, 
  carSport, timeOutline, cashOutline, closeOutline, 
  checkmarkCircle, warningOutline, informationCircle, closeCircle,
  bulbOutline, refreshOutline, closeCircleOutline, alarmOutline, star, starOutline 
} from 'ionicons/icons'; 
import { io, Socket } from 'socket.io-client';
import { AlertController } from '@ionic/angular/standalone';

//interfaces
interface Usuario { id: number; nombre: string; apellido: string; correo: string; }
interface Taxi { 
  id_chofer: number; nombre: string; apellido?: string; placa: string; 
  marca?: string; precio?: number; tiempoEstimadoLlegada?: number; 
}

//servicios de tarifas 
@Injectable({ providedIn: 'root' })
export class TaxiFareService {
  private readonly TARIFA_BASE = 15;
  calcularTarifaEscalonada(distanciaKm: number, esNocturno: boolean = false): number {
    let factorPorKm = distanciaKm <= 2 ? 5 : distanciaKm <= 5 ? 6 : distanciaKm <= 10 ? 7 : 8;
    if (esNocturno) factorPorKm++;
    let tarifa = this.TARIFA_BASE + (distanciaKm * factorPorKm);
    return Math.round(tarifa / 5) * 5; 
  }
}

//modales 
@Component({
  selector: 'app-notificacion-modal',
  template: `
    <ion-header><ion-toolbar [color]="tipo === 'success' ? 'success' : tipo === 'error' ? 'danger' : 'primary'"><ion-title>{{ titulo }}</ion-title></ion-toolbar></ion-header>
    <ion-content class="ion-padding ion-text-center">
      <ion-icon [name]="icono" size="large" [color]="tipo === 'success' ? 'success' : 'primary'"></ion-icon>
      <p [innerHTML]="mensaje.replace('\\n', '<br>')"></p>
      <ion-button expand="block" (click)="cerrar()">Entendido</ion-button>
    </ion-content>
  `,
  standalone: true, imports: [IonicModule, CommonModule]
})
export class NotificacionModalComponent {
  @Input() titulo: string = ''; @Input() mensaje: string = ''; @Input() icono: string = ''; @Input() tipo: string = '';
  constructor(private modalCtrl: ModalController) {}
  cerrar() { this.modalCtrl.dismiss(); }
}

@Component({
  selector: 'app-confirmar-viaje-modal',
  template: `
    <ion-header><ion-toolbar color="primary"><ion-title>Detalles del Viaje</ion-title></ion-toolbar></ion-header>
    <ion-content class="ion-padding">
      <div style="text-align: center; background: #f4f5f8; padding: 15px; border-radius: 15px;">
        <ion-icon name="car-sport" color="warning" size="large"></ion-icon>
        <h2>{{ taxi?.nombre }}</h2>
        <ion-badge color="dark">Placa: {{ taxi?.placa }}</ion-badge>
      </div>
      <ion-list lines="none">
        <ion-item><ion-icon name="map-outline" slot="start"></ion-icon><ion-label>Distancia: {{ distancia.toFixed(2) }} km</ion-label></ion-item>
        <ion-item><ion-icon name="cash-outline" slot="start" color="success"></ion-icon><ion-label><b>Precio: \${{ precio }} MXN</b></ion-label></ion-item>
      </ion-list>
      <ion-button expand="block" color="success" (click)="confirmar()">Confirmar Viaje</ion-button>
      <ion-button expand="block" fill="clear" (click)="cancelar()">Cancelar</ion-button>
    </ion-content>
  `,
  standalone: true, imports: [IonicModule, CommonModule]
})
export class ConfirmarViajeModalComponent {
  @Input() taxi: any; @Input() distancia: number = 0; @Input() precio: number = 0;
  constructor(private modalCtrl: ModalController) {}
  confirmar() { this.modalCtrl.dismiss({ confirmado: true }); }
  cancelar() { this.modalCtrl.dismiss({ confirmado: false }); }
}

//pagina principal
@Component({
  selector: 'app-pantallausuario',
  templateUrl: './pantallausuario.page.html',
  styleUrls: ['./pantallausuario.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink]
})
export class PantallausuarioPage implements OnInit, OnDestroy {
  private alertCtrl = inject(AlertController);

  map!: L.Map;
  routingControl: any;
  miUbicacion: L.LatLng | null = null;
  origen: string = 'Mi ubicación';
  destino: string = '';
  
  mostrarModalCalificarChofer: boolean = false;
  ratingActual: number = 0;
  comentarioChofer: string = '';

  viajeActivo: any = null;
  viajeSolicitado = false;
  viajeEnCurso = false;
  mostrarTaxis = false;
  cargandoTaxis = false;
  mostrandoPrecio = false;
  
  distanciaActual = 0;
  precioEstimado = 0;
  tiempoEstimado = 0;
  listaTaxis: Taxi[] = [];
  
  socket!: Socket;
  usuarioLogueado: Usuario | null = null;

  readonly CENTRO_OPERATIVO = { lat: 21.8600, lng: -102.5000 }; 
  readonly RADIO_MAXIMO_METROS = 45000; 

  constructor(
    private http: HttpClient,
    private router: Router,
    private fareService: TaxiFareService,
    private modalCtrl: ModalController
  ) {
    addIcons({ 
      personOutline, carOutline, logOutOutline, locationOutline, flagOutline, 
      searchOutline, notificationsOutline, mapOutline, carSport, timeOutline, 
      cashOutline, closeOutline, checkmarkCircle, warningOutline, 
      informationCircle, closeCircle, bulbOutline, refreshOutline, 
      closeCircleOutline, alarmOutline, star, starOutline
    });

    this.cargarUsuarioDesdeStorage();
  }

  ngOnInit() {
    this.initSocket();
  }

  private cargarUsuarioDesdeStorage() {
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        this.usuarioLogueado = JSON.parse(userData);
        console.log('Usuario cargado:', this.usuarioLogueado);
      }
    } catch (e) {
      console.error('Error al cargar usuario del storage', e);
    }
  }

  private initSocket() {
    this.socket = io('http://localhost:3000');

    if (this.usuarioLogueado) {
      this.socket.emit('unirse_sala', this.usuarioLogueado.id);
    }

    // Escuchar cuando el chofer acepta el viaje
    this.socket.on('viaje_aceptado', (data: any) => {
      this.viajeSolicitado = false;
      this.viajeEnCurso = true;
      this.abrirModalNotificacion(
        '¡Viaje Aceptado! ', 
        `Tu chofer ${data.chofer?.nombre || 'está'} en camino.\nVehículo: ${data.chofer?.vehiculo || 'Taxi'} - Placa: ${data.chofer?.placa || '---'}`,
        'checkmark-circle',
        'success'
      );
      
      this.router.navigate(['/viajenotificacion'], { 
        state: { viaje: data, precio: this.precioEstimado, estado: 'aceptado' } 
      });
    });

    // Escuchar cuando el chofer rechaza el viaje
    this.socket.on('viaje_rechazado', (data: any) => {
      this.viajeSolicitado = false;
      this.mostrarTaxis = true;
      this.abrirModalNotificacion(
        'Lo sentimos 😔', 
        'El chofer no pudo tomar tu viaje. Por favor intenta con otro.',
        'close-circle',
        'error'
      );
    });

    this.socket.on('error_solicitud', (data: any) => {
      this.viajeSolicitado = false;
      this.abrirModalNotificacion('Error', data.mensaje || 'No se pudo procesar tu solicitud', 'warning-outline', 'error');
    });
    
    // El chofer solicita el pago al finalizar el viaje
    this.socket.on('solicitar_metodo_pago', async (data: any) => {
      console.log('El chofer está solicitando el pago:', data);
      this.viajeActivo = data;
      await this.mostrarOpcionesDePago();
    });

    // El chofer confirma que recibió el pago
    this.socket.on('viaje_completado_exito', async (data: any) => {
      console.log('¡Viaje completado y pagado!', data);
      
      const alert = await this.alertCtrl.create({
        header: '¡Viaje Finalizado! ',
        message: 'Tu pago ha sido procesado correctamente. ¡Gracias por viajar con nosotros!',
        buttons: ['OK']
      });
      await alert.present();

      // Cuando el usuario cierra la alerta de éxito, activamos la calificación
      await alert.onDidDismiss();
      this.mostrarModalCalificarChofer = true; 
      
      // Limpiamos el mapa y las variables
      this.viajeActivo = null;
      this.viajeEnCurso = false;
      this.destino = '';
      if (this.routingControl) this.map.removeControl(this.routingControl);
    });

  }

  //localizacion del mapa
  async obtenerUbicacionActual() {
    try {
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      this.miUbicacion = L.latLng(pos.coords.latitude, pos.coords.longitude);
    } catch {
      this.miUbicacion = L.latLng(21.8469, -102.7188); // Default
    }
    this.initMap();
  }

  initMap() {
    if (!this.miUbicacion) return;
    if (this.map) this.map.remove();
    this.map = L.map('map').setView([this.miUbicacion.lat, this.miUbicacion.lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
    
    L.circle([this.CENTRO_OPERATIVO.lat, this.CENTRO_OPERATIVO.lng], {
      color: '#2dd36f', radius: this.RADIO_MAXIMO_METROS, fillOpacity: 0.1
    }).addTo(this.map);

    const icon = L.divIcon({ 
      className: 'user-marker', 
      html: '<div style="background:#4285F4;width:14px;height:14px;border-radius:50%;border:2px solid white"></div>' 
    });
    L.marker([this.miUbicacion.lat, this.miUbicacion.lng], { icon }).addTo(this.map);
  }

  buscarDestino() {
    if (!this.destino || !this.miUbicacion) return;
    this.cargandoTaxis = true;

    const query = `${this.destino}, Aguascalientes, Mexico`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        if (data.length > 0) {
          const coordsDestino = L.latLng(parseFloat(data[0].lat), parseFloat(data[0].lon));
          if (this.estaEnZonaPermitida(coordsDestino)) {
            this.dibujarRuta(coordsDestino);
            this.distanciaActual = this.miUbicacion!.distanceTo(coordsDestino) / 1000;
            this.precioEstimado = this.fareService.calcularTarifaEscalonada(this.distanciaActual);
            this.obtenerTaxis();
          } else {
            this.cargandoTaxis = false;
            this.abrirModalNotificacion('Fuera de Rango', 'El destino está fuera de nuestra zona de servicio.', 'warning-outline', 'error');
          }
        } else {
          this.cargandoTaxis = false;
          this.abrirModalNotificacion('No encontrado', 'No pudimos localizar esa dirección.', 'search-outline', 'primary');
        }
      },
      error: () => this.cargandoTaxis = false
    });
  }

  estaEnZonaPermitida(coords: L.LatLng): boolean {
    const centro = L.latLng(this.CENTRO_OPERATIVO.lat, this.CENTRO_OPERATIVO.lng);
    return centro.distanceTo(coords) <= this.RADIO_MAXIMO_METROS;
  }

  dibujarRuta(destino: L.LatLng) {
    if (this.routingControl) this.map.removeControl(this.routingControl);
    this.routingControl = (L as any).Routing.control({
      waypoints: [this.miUbicacion!, destino],
      show: false,
      addWaypoints: false,
      router: new (L as any).Routing.OSRMv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' })
    }).addTo(this.map);
  }

  obtenerTaxis() {
    this.http.get<Taxi[]>('http://localhost:3000/api/taxis/disponibles').subscribe({
      next: (res) => {
        this.listaTaxis = res.map(t => ({ ...t, precio: this.precioEstimado }));
        this.mostrarTaxis = true;
        this.cargandoTaxis = false;
        this.mostrandoPrecio = true;
      },
      error: () => {
        this.cargandoTaxis = false;
        this.abrirModalNotificacion('Error', 'No hay taxis conectados actualmente.', 'car-outline', 'error');
      }
    });
  }

  async seleccionarTaxi(taxi: Taxi) {
    if (this.viajeSolicitado) return;

    const modal = await this.modalCtrl.create({
      component: ConfirmarViajeModalComponent,
      componentProps: { taxi, distancia: this.distanciaActual, precio: this.precioEstimado }
    });

    await modal.present();
    const { data } = await modal.onWillDismiss();

    if (data?.confirmado) {
      this.socket.emit('solicitar_taxi', {
        id_chofer_usuario: taxi.id_chofer,
        id_cliente: this.usuarioLogueado?.id,
        nombre_cliente: this.usuarioLogueado?.nombre,
        precio: this.precioEstimado,
        origen: { lat: this.miUbicacion?.lat, lng: this.miUbicacion?.lng, direccion: this.origen },
        destino: { direccion: this.destino }
      });
      this.viajeSolicitado = true;
      this.mostrarTaxis = false;
    }
  }

 // método retorne la promesa del modal
async abrirModalNotificacion(titulo: string, mensaje: string, icono: string, tipo: string) {
  const modal = await this.modalCtrl.create({
    component: NotificacionModalComponent,
    componentProps: { titulo, mensaje, icono, tipo }
  });
  await modal.present();
  return modal.onDidDismiss(); // Devuelve esto para saber cuándo se cerró
}

// Método para mostrar opciones de pago al finalizar el viaje

  async mostrarOpcionesDePago() {
    const alert = await this.alertCtrl.create({
      header: 'Método de Pago ',
      message: 'Tu viaje ha terminado. ¿Cómo deseas pagar?',
      backdropDismiss: false, // Evita que cierre la alerta tocando fuera
      buttons: [
        {
          text: 'Efectivo ',
          handler: () => {
            this.socket.emit('usuario_elige_efectivo', {
              id_viaje: this.viajeActivo.id_viaje,
              id_chofer: this.viajeActivo.id_chofer,
              id_usuario: this.viajeActivo.id_usuario
            });
            this.mostrarMensajeEspera('Esperando a que el chofer confirme la recepción del efectivo...');
          }
        },
        {
          text: 'Tarjeta ',
          handler: () => {
            this.socket.emit('usuario_paga_tarjeta', {
              id_viaje: this.viajeActivo.id_viaje,
              id_chofer: this.viajeActivo.id_chofer,
              id_usuario: this.viajeActivo.id_usuario
            });
            this.mostrarMensajeEspera('Procesando pago con tarjeta y avisando al chofer...');
          }
        }
      ]
    });

    await alert.present();
  }

  async mostrarMensajeEspera(mensaje: string) {
    const alertEspera = await this.alertCtrl.create({
      header: 'Procesando...',
      message: mensaje,
      backdropDismiss: false,
      buttons: [] // Sin botones para obligar a esperar
    });
    await alertEspera.present();

    // Cuando el chofer confirme y llegue el evento, cerramos esta alerta de espera
    this.socket.once('viaje_completado_exito', () => {
      alertEspera.dismiss();
    });
  }

  logout() {
    if (this.socket) this.socket.disconnect();
    localStorage.clear();
    this.router.navigate(['/home']);
  }

  cancelarSolicitud() {
    this.viajeSolicitado = false;
    this.socket.emit('cancelar_viaje', { id_cliente: this.usuarioLogueado?.id });
  }

  sugerirRuta() {
    this.destino = "Centro Histórico, Aguascalientes";
    this.buscarDestino();
  }

  ionViewDidEnter() { this.obtenerUbicacionActual(); }
  ngOnDestroy() { if (this.socket) this.socket.disconnect(); }
  irANotificaciones() { this.router.navigate(['/cambiarrutaanotiusuario']); }

  setRating(estrellas: number) {
    this.ratingActual = estrellas;
  }

  enviarCalificacion() {
    console.log('Calificación enviada:', this.ratingActual, this.comentarioChofer);

    // Aquí mostramos el mensaje de agradecimiento
    this.abrirModalNotificacion(
      '¡Gracias por viajar con nosotros! ',
      'Tu calificación ha sido enviada.',
      'checkmark-circle',
      'success'
    );

    // Reseteamos todo para dejar la pantalla limpia
    this.mostrarModalCalificarChofer = false;
    this.ratingActual = 0;
    this.comentarioChofer = '';
    
    this.viajeActivo = null; 
    this.viajeEnCurso = false;
    this.destino = '';
  }
  historialusuario() {
    this.router.navigate(['/historialusuario']);
  }
}