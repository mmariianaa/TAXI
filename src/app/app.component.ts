import { Component, inject } from '@angular/core'; // Añadimos inject
import { Router, RouterLink } from '@angular/router'; // Añadimos Router
import { AuthService } from './services/auth'; // Importamos tu servicio
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
    IonApp, IonRouterOutlet, IonMenu, IonHeader, IonToolbar, 
    IonTitle, IonContent, IonList, IonItem, IonIcon, IonLabel, 
    IonMenuToggle, RouterLink
  ],
})
export class AppComponent {
  // Inyectamos los servicios necesarios
  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    // Registramos todos los iconos
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

  // Esta función es la que conectamos con el (click) en el HTML
  logout() {
    this.authService.logout(); // Borra el token/sesión
    this.router.navigate(['/home']); // Te manda al inicio
  }
}