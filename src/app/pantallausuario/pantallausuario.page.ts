import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HttpClient} from '@angular/common/http'; 
import { Router, RouterLink } from '@angular/router'; // Añadimos RouterLink para el menú
import * as L from 'leaflet';
import 'leaflet-routing-machine'; 
import { Geolocation } from '@capacitor/geolocation';
import { addIcons } from 'ionicons'; // Necesario para los iconos del menú
import { personOutline, carOutline, logOutOutline } from 'ionicons/icons'; // Iconos del menú

@Component({
  selector: 'app-pantallausuario',
  templateUrl: './pantallausuario.page.html',
  styleUrls: ['./pantallausuario.page.scss'],
  standalone: true,
  // Añadimos HttpClientModule y RouterLink a los imports
  imports: [IonicModule, CommonModule, FormsModule,RouterLink]
})
export class PantallausuarioPage implements OnInit {
  map!: L.Map;
  routingControl: any;
  origen: string = 'Mi ubicación';
  destino: string = '';
  miUbicacion: L.LatLng | null = null;
  mostrarTaxis: boolean = false;

  listaTaxis = [
    { conductor: 'Maty', modelo: 'Toyota Prius', precio: 15.00 },
    { conductor: 'Vale', modelo: 'Ford Focus', precio: 12.50 },
    { conductor: 'Mon', modelo: 'Hyundai Accent', precio: 14.00 }
  ];

  constructor(private http: HttpClient, private router: Router) {
    // Registramos los iconos que usa el menú que me diste
    addIcons({ personOutline, carOutline, logOutOutline });
  }

  ngOnInit() {}

  // Función de logout para el botón del menú
  logout() {
    console.log('Cerrando sesión...');
    this.router.navigate(['/home']);
  }

  ionViewDidEnter() {
    this.obtenerUbicacionActual();
    // Reajusta el mapa por si el menú cambió el tamaño del contenedor
    setTimeout(() => {
      if (this.map) this.map.invalidateSize();
    }, 300);
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
      console.warn('Usando CDMX por defecto', error);
      this.miUbicacion = L.latLng(19.4326, -99.1332); 
      this.initMap();
    }
  }

  initMap() {
    if (!this.miUbicacion) return;
    if (this.map) { this.map.remove(); }

    this.map = L.map('map').setView([this.miUbicacion.lat, this.miUbicacion.lng], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
    
    L.marker([this.miUbicacion.lat, this.miUbicacion.lng])
      .addTo(this.map)
      .bindPopup('Estás aquí')
      .openPopup();
      
    this.map.invalidateSize();
  }

  buscarDestino() {
    if (!this.destino || !this.miUbicacion) return;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.destino)}`;

    this.http.get<any[]>(url).subscribe(data => {
      if (data.length > 0) {
        const latDestino = parseFloat(data[0].lat);
        const lonDestino = parseFloat(data[0].lon);
        const coordsDestino = L.latLng(latDestino, lonDestino);
        this.dibujarRuta(coordsDestino);
        this.mostrarTaxis = true; 
      } else {
        alert('No se encontró la dirección.');
      }
    });
  }

  dibujarRuta(destino: L.LatLng) {
    if (this.routingControl) { this.map.removeControl(this.routingControl); }

    this.routingControl = (L as any).Routing.control({
      waypoints: [this.miUbicacion!, destino],
      show: false,
      addWaypoints: false,
      routeWhileDragging: false,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [{ color: '#3880ff', weight: 6 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      }
    }).addTo(this.map);
  }

  seleccionarTaxi(taxi: any) {
    alert('Has seleccionado a ' + taxi.conductor);
  }

  sugerirRuta() {
    this.destino = "Palacio de Bellas Artes, CDMX"; 
    this.buscarDestino();
  }
}