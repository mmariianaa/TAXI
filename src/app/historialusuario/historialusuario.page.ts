import { Component, OnInit } from '@angular/core';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonList, IonItem, IonLabel, IonNote, IonIcon, IonBadge, IonBackButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { carOutline, locationOutline, chevronForwardOutline, giftOutline } from 'ionicons/icons';

@Component({
  selector: 'app-history',
  templateUrl: './historialusuario.page.html',
  standalone: true,
  imports: [IonBackButton, 
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, 
    IonList, IonItem, IonLabel, IonNote, IonIcon, IonBadge
  ]
})
export class HistorialusuarioPage implements OnInit {
  
  // Simulamos un array que podría venir de un servicio
  trips = [
    {
      id: 101,
      date: '15 Mar, 2024',
      price: 25.40,
      origin: '📍 Calle Principal 45',
      destination: '🏁 Aeropuerto Terminal 1',
      status: 'completed'
    },
    {
      id: 102,
      date: '14 Mar, 2024',
      price: 12.00,
      origin: '📍 Plaza Central',
      destination: '🏁 Gimnasio Smart',
      status: 'cancelled'
    }
  ];

  constructor() {
    addIcons({ carOutline, locationOutline, chevronForwardOutline });
  }

  ngOnInit() {}
}