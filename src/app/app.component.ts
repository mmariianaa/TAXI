import { Component } from '@angular/core'; 
import { RouterLink } from '@angular/router'; 
import { 
  IonApp, IonRouterOutlet, IonMenu, IonHeader, IonToolbar, 
  IonTitle, IonContent, IonList, IonItem, IonIcon, IonLabel, IonMenuToggle 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  mapOutline, personOutline, notificationsOutline, 
  searchOutline, carSport, diceOutline, flagOutline, 
  locationOutline, carOutline, logOutOutline, timeOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [
    IonApp, IonRouterOutlet,
  ],
})
export class AppComponent {

  constructor() {
    // Registramos los iconos para que se vean en el HTML, 
    // pero no añadimos lógica de servicios.
    addIcons({
      personOutline,
      carOutline,
      logOutOutline,
      mapOutline,
      notificationsOutline,
      searchOutline,
      carSport,
      diceOutline,
      flagOutline,
      locationOutline,
      timeOutline
    });
  }

  // Si quitas el logout() de aquí, recuerda quitar el (click)="logout()" 
  // en el archivo app.component.html para que no te dé error.
}