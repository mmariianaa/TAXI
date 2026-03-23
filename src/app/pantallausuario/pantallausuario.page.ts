import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HttpClient } from '@angular/common/http'; 
import { Router, RouterLink } from '@angular/router'; 
import * as L from 'leaflet';
import 'leaflet-routing-machine'; 
import { Geolocation } from '@capacitor/geolocation';
import { addIcons } from 'ionicons'; 
import { personOutline, carOutline, logOutOutline } from 'ionicons/icons'; 
import { io, Socket } from 'socket.io-client'; 

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
  origen: string = 'Mi ubicación';
  destino: string = '';
  miUbicacion: L.LatLng | null = null;
  mostrarTaxis: boolean = false;
  cargandoTaxis: boolean = false;

  socket: Socket;
  usuarioLogueado: any;
  listaTaxis: any[] = []; 
  viajeSolicitado: boolean = false;
  viajeEnCurso: boolean = false;

constructor(private http: HttpClient, private router: Router) {
  addIcons({ personOutline, carOutline, logOutOutline });
  
  try {
    const userData = localStorage.getItem('user');
    console.log('userData desde localStorage:', userData);
    if (userData) {
      this.usuarioLogueado = JSON.parse(userData);
    } else {
      console.warn('No se encontró "user" en localStorage');
    }
  } catch (e) {
    console.error('Error al parsear usuario del localStorage:', e);
    this.usuarioLogueado = null;
  }
  console.log('usuarioLogueado después de parsear:', this.usuarioLogueado);
  
  this.socket = io('http://localhost:3000');
}
  ngOnInit() {
    // ===== NUEVO: UNIRSE A LA SALA CON EL ID DEL USUARIO =====
    if (this.usuarioLogueado) {
      console.log('🔌 Usuario conectándose a sala con ID:', this.usuarioLogueado.id);
      this.socket.emit('unirse_sala', this.usuarioLogueado.id);
    } else {
      console.warn('⚠️ No hay usuario logueado, no se puede unir a sala');
    }
    // ===== FIN NUEVO =====

    // Escuchar notificaciones del chofer
    this.socket.on('notificacion_chofer', (data) => {
      console.log('Notificación del chofer:', data);
    });

    // Escuchar cuando el chofer acepta el viaje
    this.socket.on('viaje_aceptado', (data: any) => {
      console.log('🔥🔥🔥 VIAJE ACEPTADO RECIBIDO 🔥🔥🔥', data);
      this.viajeSolicitado = false;
      this.viajeEnCurso = true;
      
      // Mostrar notificación
      this.mostrarNotificacion(
        '¡Viaje Aceptado! 🚖', 
        `Tu chofer ${data.chofer?.nombre || 'está'} en camino.\nVehículo: ${data.chofer?.vehiculo || 'Taxi'} - Placa: ${data.chofer?.placa || '---'}`
      );
      
      // Redirigir a pantalla de seguimiento
      this.router.navigate(['/viajenotificacion'], { 
        state: { 
          viaje: data,
          estado: 'aceptado'
        } 
      });
    });

    // Escuchar cuando el chofer rechaza el viaje
    this.socket.on('viaje_rechazado', (data: any) => {
      console.log('❌ Viaje rechazado:', data);
      this.viajeSolicitado = false;
      this.mostrarTaxis = true;
      
      this.mostrarNotificacion(
        'Viaje Rechazado ❌', 
        'El chofer no pudo tomar tu viaje. Por favor intenta con otro.'
      );
    });

    // Escuchar errores
    this.socket.on('error_solicitud', (data: any) => {
      console.error('Error en solicitud:', data);
      this.viajeSolicitado = false;
      this.mostrarTaxis = true;
      
      this.mostrarNotificacion(
        'Error', 
        data.mensaje || 'No se pudo procesar tu solicitud'
      );
    });
  }

  ionViewDidEnter() {
    this.obtenerUbicacionActual();
    setTimeout(() => {
      if (this.map) this.map.invalidateSize();
    }, 300);
  }

  ngOnDestroy() {
    // Desconectar socket al salir de la página
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  // Función para mostrar notificaciones (puedes personalizarla)
  mostrarNotificacion(titulo: string, mensaje: string) {
    // Puedes usar AlertController de Ionic aquí
    alert(`${titulo}\n\n${mensaje}`);
  }

  irANotificaciones() {
    this.router.navigate(['/viajenotificacion']); 
  }

  async obtenerUbicacionActual() {
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000 
      });
      this.miUbicacion = L.latLng(coordinates.coords.latitude, coordinates.coords.longitude);
      this.initMap();
    } catch (error) {
      console.warn('Error ubicación, usando CDMX', error);
      this.miUbicacion = L.latLng(19.4326, -99.1332); 
      this.initMap();
    }
  }

  initMap() {
    if (!this.miUbicacion) return;
    if (this.map) { this.map.remove(); }
    
    this.map = L.map('map').setView([this.miUbicacion.lat, this.miUbicacion.lng], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
    
    // Marcador personalizado para la ubicación del usuario
    const usuarioIcon = L.divIcon({
      className: 'ubicacion-usuario',
      html: '<div style="background-color: #4285F4; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
      iconSize: [22, 22]
    });
    
    L.marker([this.miUbicacion.lat, this.miUbicacion.lng], { icon: usuarioIcon })
      .addTo(this.map)
      .bindPopup('Estás aquí 📍')
      .openPopup();
  }

  buscarDestino() {
    if (!this.destino || !this.miUbicacion) {
      alert('Por favor ingresa un destino');
      return;
    }
    
    this.cargandoTaxis = true;
    
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.destino)}&limit=1`;

    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        if (data.length > 0) {
          const coordsDestino = L.latLng(parseFloat(data[0].lat), parseFloat(data[0].lon));
          this.dibujarRuta(coordsDestino);

          // Obtener taxis disponibles
          this.http.get<any[]>('http://localhost:3000/api/taxis/disponibles').subscribe({
            next: (res) => {
              this.listaTaxis = res; 
              this.mostrarTaxis = true;
              this.cargandoTaxis = false;
              
              if (res.length === 0) {
                this.mostrarNotificacion(
                  'Sin taxis disponibles', 
                  'No hay choferes disponibles en este momento'
                );
              }
            },
            error: (err) => {
              console.error('Error al obtener taxis:', err);
              this.cargandoTaxis = false;
              this.mostrarNotificacion(
                'Error', 
                'No se pudieron cargar los taxis disponibles'
              );
            }
          });

        } else {
          this.cargandoTaxis = false;
          alert('No se encontró la dirección. Intenta con otra.');
        }
      },
      error: (err) => {
        console.error('Error al buscar destino:', err);
        this.cargandoTaxis = false;
        alert('Error al buscar la dirección');
      }
    });
  }

  dibujarRuta(destino: L.LatLng) {
    if (this.routingControl) { 
      this.map.removeControl(this.routingControl); 
    }
    
    this.routingControl = (L as any).Routing.control({
      waypoints: [this.miUbicacion!, destino],
      show: false,
      fitSelectedRoutes: true,
      lineOptions: { 
        styles: [{ color: '#c738ff', weight: 6 }] 
      },
      router: new (L as any).Routing.OSRMv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1'
      })
    }).addTo(this.map);
  }

  seleccionarTaxi(taxi: any) {
    if (this.viajeSolicitado) {
      this.mostrarNotificacion(
        'Viaje en proceso', 
        'Ya tienes un viaje solicitado. Espera la respuesta del chofer.'
      );
      return;
    }

    if (!this.usuarioLogueado) {
      this.mostrarNotificacion(
        'No has iniciado sesión', 
        'Por favor inicia sesión para solicitar un taxi'
      );
      this.router.navigate(['/home']);
      return;
    }

    const dataNotificacion = {
      id_chofer_usuario: taxi.id_chofer,
      nombre_cliente: `${this.usuarioLogueado?.nombre || 'Cliente'} ${this.usuarioLogueado?.apellido || ''}`.trim(),
      id_cliente: this.usuarioLogueado?.id || this.usuarioLogueado?.id,
      placa_taxi: taxi.placa,
      origen: {
        lat: this.miUbicacion?.lat,
        lng: this.miUbicacion?.lng,
        direccion: this.origen
      },
      destino: {
        direccion: this.destino
      }
    };

    console.log('Enviando solicitud:', dataNotificacion);
    
    this.socket.emit('solicitar_taxi', dataNotificacion);
    
    this.viajeSolicitado = true;
    this.mostrarTaxis = false;
    
    this.mostrarNotificacion(
      'Solicitud enviada', 
      `Esperando respuesta de ${taxi.nombre}...`
    );
  }

  cancelarSolicitud() {
    this.viajeSolicitado = false;
    this.mostrarTaxis = true;
  }

  logout() {
    if (this.socket) {
      this.socket.disconnect();
    }
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.router.navigate(['/home']);
  }

  sugerirRuta() {
    this.destino = "Palacio de Bellas Artes, Ciudad de México"; 
    this.buscarDestino();
  }

  // Función para obtener iniciales del nombre
  getIniciales(nombre: string, apellido: string): string {
    return (nombre?.charAt(0) || '') + (apellido?.charAt(0) || '');
  }
  
}