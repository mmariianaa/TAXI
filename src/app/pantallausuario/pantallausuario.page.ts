import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import * as L from 'leaflet';
import { addIcons } from 'ionicons';
import { menuOutline, locationOutline, flagOutline, diceOutline, carSport } from 'ionicons/icons';

// CONFIGURACIÓN GLOBAL DEL ICONO
const iconDefault = L.icon({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-perfilusuario',
  templateUrl: './pantallausuario.page.html',
  styleUrls: ['./pantallausuario.scss'], 
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class PantallausuarioPage implements OnInit { // <--- ESTE NOMBRE ES EL QUE IMPORTA
  map!: L.Map;
  origen: string = '';
  destino: string = '';

  listaTaxis = [
    { conductor: 'Maty', modelo: 'Toyota Prius', precio: 15.00 },
    { conductor: 'Vale', modelo: 'Ford Focus', precio: 12.50 },
    { conductor: 'Mong', modelo: 'Hyundai Accent', precio: 14.00 }
  ];

  constructor() {
    addIcons({ menuOutline, locationOutline, flagOutline, diceOutline, carSport });
  }

  ngOnInit() {}

  ionViewDidEnter() {
    this.initMap();
  }

  initMap() {
    if (this.map) {
      this.map.remove();
    }
    this.map = L.map('map').setView([19.4326, -99.1332], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
    L.marker([19.4326, -99.1332]).addTo(this.map).bindPopup('Tu ubicación').openPopup();
  }

  seleccionarTaxi(taxi: any) {
    console.log('Elegiste a:', taxi.conductor);
  }

  sugerirRuta() {
    alert('Calculando ruta rápida...');
  }
}