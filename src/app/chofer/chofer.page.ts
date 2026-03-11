import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth'; 
import { 
  IonContent, IonIcon, IonSpinner, IonButton, 
  IonToggle, IonButtons, IonHeader, IonTitle, 
  IonToolbar, IonMenuButton, IonApp, IonItem,
  IonList, IonLabel, IonRouterOutlet, IonMenu } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  menuOutline, notificationsOutline, personCircle, 
  personCircleOutline, saveOutline, carOutline, 
  logOutOutline, timeOutline, checkmarkOutline,
  personOutline, homeOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-chofer',
  templateUrl: './chofer.page.html',
  styleUrls: ['./chofer.page.scss'],
  standalone: true,
  imports: [IonRouterOutlet, IonLabel, IonList, IonItem, IonApp, 
    IonToolbar, IonTitle, IonHeader, IonButtons, 
    IonToggle, IonButton, IonSpinner, IonIcon, 
    IonContent, IonMenuButton, FormsModule, IonMenu
  ]
})
export class ChoferPage implements OnInit {
  // Inyección de servicios
  private authService = inject(AuthService);
  private router = inject(Router);

  // Variables para la vista
  isActive: boolean = true;
  driverInfo: any = {
    nombre: '',
    apellido: '',
    vehiculo: {
      placa: '',
      marca: '',
      modelo: ''
    }
  };

  constructor() {
    // Registramos los iconos que necesita tanto el HTML de esta página 
    // como los que se verán cuando se abra el Menú Lateral
    addIcons({ 
      menuOutline, 
      notificationsOutline, 
      personCircle, 
      personCircleOutline,
      saveOutline, 
      carOutline, 
      logOutOutline, 
      timeOutline,
      checkmarkOutline,
      personOutline,
      homeOutline
    });
  }

  ngOnInit() {
    // 1. Intentamos obtener los datos de la sesión (Token/User)
    const data = this.authService.getUserData();
    
    if (data) {
      // 2. Si existen, los pintamos en el HTML
      this.driverInfo = data;
      console.log('Sesión activa para:', this.driverInfo.nombre);
    } else {
      // 3. Si no hay datos, seguridad ante todo: al Login
      this.router.navigate(['/home']);
    }
  }

  // Control del Switch de disponibilidad
  toggleStatus() {
    this.isActive = !this.isActive;
    console.log('El chofer ahora está:', this.isActive ? 'Activo' : 'Inactivo');
  }

  // Acción del botón Guardar
  saveProfile() {
    // Aquí podrías enviar una petición al backend para actualizar el estado
    alert(`Estado de ${this.driverInfo.nombre} actualizado correctamente.`);
  }

  // Esta función es por si quieres un botón que mande al perfil
  // (Aunque ya lo tienes en las tres rayitas del menú lateral)
  irAPerfil() {
    this.router.navigate(['/perfil-chofer']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}