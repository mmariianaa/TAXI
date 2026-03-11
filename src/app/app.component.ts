import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { 
  IonApp, IonRouterOutlet, IonMenu, IonHeader, IonToolbar, 
  IonTitle, IonContent, IonList, IonItem, IonIcon, IonLabel, IonMenuToggle 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mapOutline, personOutline, notificationsOutline, searchOutline, carSport, diceOutline, flagOutline, locationOutline } from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [
    IonApp, IonRouterOutlet, IonMenu, IonHeader, IonToolbar, 
    IonTitle, IonContent, IonList, IonItem, IonIcon, IonLabel, 
    IonMenuToggle, RouterLink
  ],
})
export class AppComponent {
  constructor() {
    // Registramos todos los iconos que usas en toda la app aquí
    addIcons({ 
      mapOutline, 
      personOutline, 
      notificationsOutline, 
      searchOutline, 
      carSport, 
      diceOutline, 
      flagOutline, 
      locationOutline 
    });
  }
}