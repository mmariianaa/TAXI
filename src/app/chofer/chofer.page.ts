import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router'; // Añadimos RouterLink
import { AuthService } from '../services/auth'; 
import { 
  IonContent, IonIcon, IonButtons, IonHeader, IonTitle, 
  IonToolbar, IonMenuButton, IonList, IonItem, IonLabel,
  IonMenu, IonMenuToggle, // Importamos los componentes del menú
} from '@ionic/angular/standalone';
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
  imports: [
    // Componentes del Menú y Estructura
    IonMenu, IonMenuToggle, IonMenuButton,
    // Componentes de la Página
    IonLabel, IonItem, IonList, IonToolbar, IonTitle, 
    IonHeader, IonButtons, IonIcon, IonContent, 
    IonMenuButton, 
    // Módulos extra
    FormsModule, RouterLink
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
    // Registramos todos los iconos necesarios
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
    // 1. Intentamos obtener los datos de la sesión
    const data = this.authService.getUserData();
    
    if (data) {
      // 2. Si existen, llenamos la info del chofer
      this.driverInfo = data;
      console.log('Panel cargado para:', this.driverInfo.nombre);
    } else {
      // 3. Si no hay datos, al Login
      this.router.navigate(['/home']);
    }
  }

  // Control del Switch de disponibilidad (Online / Offline)
  toggleStatus() {
    // Aquí podrías llamar a un servicio para avisar al backend
    // que el taxi está disponible en el mapa
    console.log('Disponibilidad:', this.isActive ? 'ACTIVO' : 'INACTIVO');
  }

  // Acción del botón Guardar Cambios
  saveProfile() {
    alert(`Estado de ${this.driverInfo.nombre} guardado en el servidor.`);
  }

  // Función de cierre de sesión
  logout() {
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}