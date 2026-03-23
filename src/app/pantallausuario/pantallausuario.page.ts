import { Component, OnInit, OnDestroy, Injectable, Input } from '@angular/core';
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
  bulbOutline, refreshOutline, closeCircleOutline, alarmOutline 
} from 'ionicons/icons'; 
import { io, Socket } from 'socket.io-client';

// ============================================
// 1. INTERFACES
// ============================================
interface Usuario { id: number; nombre: string; apellido: string; correo: string; }
interface Taxi { 
  id_chofer: number; nombre: string; apellido?: string; placa: string; 
  marca?: string; precio?: number; tiempoEstimadoLlegada?: number; 
}

// ============================================
// 2. SERVICIO DE TARIFAS
// ============================================
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

// ============================================
// 3. COMPONENTES MODALES (Notificación y Confirmación)
// ============================================
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

// ============================================
// 4. PÁGINA PRINCIPAL (Fusionada)
// ============================================
@Component({
  selector: 'app-pantallausuario',
  templateUrl: './pantallausuario.page.html',
  styleUrls: ['./pantallausuario.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink]
})
export class PantallausuarioPage implements OnInit, OnDestroy {
  map!: L.Map;
  routingControl: any;
  miUbicacion: L.LatLng | null = null;
  origen: string = 'Mi ubicación';
  destino: string = '';
  
  // Estados de interfaz
  viajeSolicitado = false;
  viajeEnCurso = false;
  mostrarTaxis = false;
  cargandoTaxis = false;
  mostrandoPrecio = false;
  
  distanciaActual = 0;
  precioEstimado = 0;
  tiempoEstimado = 0;
  listaTaxis: Taxi[] = [];
  
  socket: Socket;
  usuarioLogueado: Usuario | null = null;

  // Configuración de Cobertura
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
      closeCircleOutline, alarmOutline 
    });
    this.socket = io('http://localhost:3000');
    this.cargarUsuario();
  }

  ngOnInit() {
    this.socket.on('viaje_aceptado', (data) => {
      this.viajeSolicitado = false;
      this.viajeEnCurso = true;
      this.abrirModalNotificacion('¡Viaje Aceptado!', 'Tu chofer está en camino', 'checkmark-circle', 'success');
      this.router.navigate(['/viajenotificacion'], { state: { viaje: data, precio: this.precioEstimado } });
    });

    this.socket.on('viaje_rechazado', () => {
      this.viajeSolicitado = false;
      this.mostrarTaxis = true;
      this.abrirModalNotificacion('Lo sentimos', 'El chofer no pudo tomar tu viaje.', 'close-circle', 'error');
    });
  }

  cargarUsuario() {
    const data = localStorage.getItem('user');
    if (data) this.usuarioLogueado = JSON.parse(data);
  }

  // --- Lógica de Localización y Mapa ---
  async obtenerUbicacionActual() {
    try {
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      this.miUbicacion = L.latLng(pos.coords.latitude, pos.coords.longitude);
      this.initMap();
    } catch {
      this.miUbicacion = L.latLng(21.8469, -102.7188); // Default Calvillo
      this.initMap();
    }
  }

  initMap() {
    if (!this.miUbicacion) return;
    if (this.map) this.map.remove();
    this.map = L.map('map').setView([this.miUbicacion.lat, this.miUbicacion.lng], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
    
    // Círculo de cobertura
    L.circle([this.CENTRO_OPERATIVO.lat, this.CENTRO_OPERATIVO.lng], {
      color: '#2dd36f', radius: this.RADIO_MAXIMO_METROS, fillOpacity: 0.1
    }).addTo(this.map);

    const icon = L.divIcon({ 
      className: 'user-marker', 
      html: '<div style="background:#4285F4;width:14px;height:14px;border-radius:50%;border:2px solid white"></div>' 
    });
    L.marker([this.miUbicacion.lat, this.miUbicacion.lng], { icon }).addTo(this.map);
  }

  // --- Lógica de Negocio ---
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
            // Simulación de distancia para el precio (o puedes obtenerla de routingControl)
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

  // --- Utilidades ---
  async abrirModalNotificacion(titulo: string, mensaje: string, icono: string, tipo: string) {
    const modal = await this.modalCtrl.create({
      component: NotificacionModalComponent,
      componentProps: { titulo, mensaje, icono, tipo }
    });
    await modal.present();
  }

  logout() {
    this.socket.disconnect();
    localStorage.clear();
    this.router.navigate(['/home']);
  }

  cancelarSolicitud() {
    this.viajeSolicitado = false;
    this.socket.emit('cancelar_viaje', { id_cliente: this.usuarioLogueado?.id });
  }
  // Función para sugerir una ruta rápida al centro
  sugerirRuta() {
    this.destino = "Centro Histórico, Aguascalientes"; // O el destino que prefieras
    this.buscarDestino(); // Llama automáticamente a la búsqueda
  }

  ionViewDidEnter() { this.obtenerUbicacionActual(); }
  ngOnDestroy() { if (this.socket) this.socket.disconnect(); }
  irANotificaciones() { this.router.navigate(['/cambiarrutaanotiusuario']); }
}