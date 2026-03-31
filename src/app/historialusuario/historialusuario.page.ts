import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonIcon, IonBackButton, IonSpinner, IonButton, IonCard, IonItem, IonLabel, IonBadge, IonCardContent, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth'; // <-- Ajusta la ruta si es necesario
import { addIcons } from 'ionicons';
import { 
  arrowBackOutline, 
  navigateCircleOutline, 
  timeOutline, 
  pinOutline, 
  carOutline, 
  cardOutline, 
  alertCircleOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-historialusuario',
  templateUrl: './historialusuario.page.html',
  styleUrls: ['./historialusuario.page.scss'],
  standalone: true,
  imports: [IonCardContent, IonBadge, IonLabel, IonItem, IonCard, IonButton, IonSpinner, 
    CommonModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonBackButton, 
    IonIcon,
    IonButton, IonButtons, IonBackButton, 
    FormsModule, IonContent, IonTitle, 
    IonToolbar,IonItem, IonLabel, IonBadge, 
    IonCard, IonCardContent, IonIcon, IonSpinner, IonRefresher, IonRefresherContent
  ]
})
export class HistorialusuarioPage implements OnInit {
  // Inyección de servicios
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);

  // Variables de estado
  viajes: any[] = [];
  cargando = true;
  errorMsg = '';
  userId: number | null = null;

  constructor() {
    // Registro de iconos para evitar errores de URL
    addIcons({ 
      'arrow-back-outline': arrowBackOutline,
      'navigate-circle-outline': navigateCircleOutline,
      'time-outline': timeOutline,
      'pin-outline': pinOutline,
      'car-outline': carOutline,
      'card-outline': cardOutline,
      'alert-circle-outline': alertCircleOutline
    });
  }

  ngOnInit() {
    this.obtenerHistorial();
  }

  // Recargar datos si el usuario vuelve a la pantalla
  ionViewWillEnter() {
    this.obtenerHistorial();
  }

  obtenerHistorial() {
    this.cargando = true;
    this.errorMsg = '';

    try {
      //id del usuario logeado 
      const authData = this.authService.getUserData();
      let idFinal = null;

      if (authData) {
        idFinal = authData.id_usuario || authData.id;
      } else {

        const localData = localStorage.getItem('user_data');
        if (localData) {
          const parsed = JSON.parse(localData);
          idFinal = parsed.id_usuario || parsed.id;
        }
      }

      //validar si realmente tenemos un id 
      if (!idFinal) {
        console.warn(' No se encontró ID de usuario logueado');
        this.errorMsg = 'Debes iniciar sesión para ver tu historial.';
        this.cargando = false;
        this.router.navigate(['/home']); 
        return;
      }

      this.userId = idFinal;
      console.log('Cargando historial para el ID:', this.userId);

      // llamamos a la api 
      this.http.get<any[]>(`http://localhost:3000/api/historialusuario/${this.userId}?tipo=usuario`)
        .subscribe({
          next: (data) => {
            this.viajes = data;
            this.cargando = false;
            console.log(' Viajes recuperados:', this.viajes.length);
          },
          error: (err) => {
            console.error(' Error al conectar con el servidor', err);
            this.errorMsg = 'No pudimos conectar con el servidor.';
            this.cargando = false;
          }
        });

    } catch (error) {
      console.error(' Error crítico en obtenerHistorial:', error);
      this.cargando = false;
    }
  }

  // Navegación al hacer clic en el botón de "Pedir mi primer Taxi"
  irAPantallausuario(event: Event) {
    this.router.navigate(['/pantallausuario']);
  }

  // Refrescar manualmente con el scroll
  doRefresh(event: any) {
    this.obtenerHistorial();
    event.target.complete();
  }
}