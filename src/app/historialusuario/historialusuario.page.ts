import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonIcon, 
  IonBackButton, IonSpinner, IonButton, IonCard, IonItem, IonLabel, 
  IonBadge, IonCardContent, IonList, IonRefresher, IonRefresherContent 
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth'; 
import { addIcons } from 'ionicons';
import { 
  arrowBackOutline, navigateCircleOutline, timeOutline, 
  pinOutline, carOutline, cardOutline, alertCircleOutline,
  cashOutline, personOutline, carSportOutline, locationOutline
} from 'ionicons/icons';

// Definir interfaz para tipado seguro
interface Viaje {
  id_viaje: number;
  origen?: string;           // ← Campo que puede faltar
  destino: string;
  fecha_viaje: string;
  estado: string;
  precio: number;
  nombre_pasajero?: string;
  nombre_chofer?: string;
  placa_taxi?: string;
  modelo_taxi?: string;
  tipo_pago?: string;
  id_pago?: number;
  id_ruta?: number;
}

@Component({
  selector: 'app-historialusuario',
  templateUrl: './historialusuario.page.html',
  styleUrls: ['./historialusuario.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, 
    IonContent, IonButtons, IonBackButton, IonIcon, IonSpinner, 
    IonButton, IonCard, IonItem, IonLabel, IonBadge, IonCardContent,
    IonList, IonRefresher, IonRefresherContent
  ]
})
export class HistorialusuarioPage implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);

  viajes: Viaje[] = [];
  cargando = true;
  errorMsg = '';
  userId: number | null = null;

  constructor() {
    addIcons({ 
      'arrow-back-outline': arrowBackOutline,
      'navigate-circle-outline': navigateCircleOutline,
      'time-outline': timeOutline,
      'pin-outline': pinOutline,
      'car-outline': carOutline,
      'card-outline': cardOutline,
      'alert-circle-outline': alertCircleOutline,
      'cash-outline': cashOutline,
      'person-outline': personOutline,
      'car-sport-outline': carSportOutline,
      'location-outline': locationOutline  // ← Agregar icono de ubicación
    });
  }

  ngOnInit() {
    this.cargarDatos();
  }

  ionViewWillEnter() {
    this.cargarDatos();
  }

  async cargarDatos() {
    this.cargando = true;
    this.errorMsg = '';
    
    // Mejorar la obtención del userId
    this.userId = this.obtenerUserId();
    
    if (this.userId) {
      console.log('📡 Pidiendo viajes al servidor para el ID:', this.userId);
      await this.obtenerViajesDesdeAPI();
    } else {
      this.errorMsg = 'No se pudo identificar al usuario logueado.';
      this.cargando = false;
      console.error('❌ No se encontró userId en session storage');
    }
  }

  obtenerUserId(): number | null {
    // Intentar obtener desde AuthService
    const authData = this.authService.getUserData();
    let id = authData?.id_usuario || authData?.id;
    
    if (id) return id;
    
    // Intentar desde localStorage
    const localData = localStorage.getItem('user_session');
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        id = parsed.id_usuario || parsed.id;
        if (id) return id;
      } catch (e) {
        console.error('Error parsing localStorage:', e);
      }
    }
    
    // Intentar desde sessionStorage
    const sessionData = sessionStorage.getItem('user_session');
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        id = parsed.id_usuario || parsed.id;
        if (id) return id;
      } catch (e) {
        console.error('Error parsing sessionStorage:', e);
      }
    }
    
    return null;
  }

  obtenerViajesDesdeAPI() {
    const url = `http://localhost:3000/api/historialusuario/${this.userId}?tipo=usuario`;
    
    console.log('🌐 Haciendo petición a:', url);
    
    this.http.get<any[]>(url).subscribe({
      next: (resultado) => {
        console.log('✅ Viajes recibidos (raw):', resultado);
        
        // Transformar los datos para asegurar que todos los campos existan
        this.viajes = resultado.map(viaje => this.procesarViaje(viaje));
        
        console.log('✅ Viajes procesados:', this.viajes);
        
        // Verificar si hay campos vacíos
        if (this.viajes.length > 0) {
          const primerViaje = this.viajes[0];
          console.log('🔍 Campos del primer viaje:', Object.keys(primerViaje));
          console.log('📍 Origen:', primerViaje.origen || 'No tiene origen');
          console.log('🎯 Destino:', primerViaje.destino);
          console.log('💰 Precio:', primerViaje.precio);
        }
        
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error en la petición HTTP:', err);
        this.errorMsg = `Error al conectar con el servidor: ${err.message}`;
        this.cargando = false;
      }
    });
  }

  // Procesar cada viaje para asegurar que tenga todos los campos necesarios
  procesarViaje(viaje: any): Viaje {
    return {
      id_viaje: viaje.id_viaje,
      origen: viaje.origen || 'Origen no especificado',
      destino: viaje.destino || 'Destino no especificado',
      fecha_viaje: this.formatearFecha(viaje.fecha_viaje),
      estado: viaje.estado || 'pendiente',
      precio: viaje.precio || 0,
      nombre_pasajero: viaje.nombre_pasajero || 'Usuario',
      nombre_chofer: viaje.nombre_chofer || 'No asignado',
      placa_taxi: viaje.placa_taxi || 'N/A',
      modelo_taxi: viaje.modelo_taxi || 'N/A',
      tipo_pago: viaje.tipo_pago || 'No registrado',
      id_pago: viaje.id_pago,
      id_ruta: viaje.id_ruta
    };
  }

  // Formatear fecha para mejor visualización
  formatearFecha(fecha: string): string {
    if (!fecha) return 'Fecha no disponible';
    
    try {
      const date = new Date(fecha);
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return fecha;
    }
  }

  getBadgeColor(estado: string): string {
    if (!estado) return 'medium';
    const e = estado.toLowerCase();
    if (e === 'aceptado' || e === 'completado' || e === 'finalizado') return 'success';
    if (e === 'rechazado' || e === 'cancelado' || e === 'canceled') return 'danger';
    if (e === 'solicitado' || e === 'pendiente') return 'warning';
    return 'medium';
  }

  // Método para obtener el ícono según el tipo de pago
  getPagoIcon(tipoPago: string): string {
    if (!tipoPago) return 'cash-outline';
    const tp = tipoPago.toLowerCase();
    if (tp.includes('tarjeta') || tp.includes('card')) return 'card-outline';
    if (tp.includes('efectivo') || tp.includes('cash')) return 'cash-outline';
    return 'cash-outline';
  }

  doRefresh(event: any) {
    this.cargarDatos();
    setTimeout(() => {
      if (event && event.target) {
        event.target.complete();
      }
    }, 800);
  }

  irAPantallausuario() {
    this.router.navigate(['/pantallausuario']);
  }
}