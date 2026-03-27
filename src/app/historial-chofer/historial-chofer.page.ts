import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonIcon, IonBackButton, IonSpinner, IonButton, IonCard, IonItem, IonLabel, IonBadge, IonCardContent, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth'; 
import { addIcons } from 'ionicons';
import { 
  arrowBackOutline, 
  navigateCircleOutline, 
  timeOutline, 
  pinOutline, 
  carOutline, 
  cardOutline, 
  alertCircleOutline,
  personOutline // Añadí este icono para el pasajero
} from 'ionicons/icons';

@Component({
  selector: 'app-historialchofer', // Cambiado
  templateUrl: './historial-chofer.page.html', // Cambiado
  styleUrls: ['./historial-chofer.page.scss'], // Cambiado
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
export class HistorialChoferPage implements OnInit { // Cambiado el nombre de la clase
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);

  viajes: any[] = [];
  cargando = true;
  errorMsg = '';
  choferId: number | null = null; // Cambiado a choferId para mayor claridad

  constructor() {
    addIcons({ 
      'arrow-back-outline': arrowBackOutline,
      'navigate-circle-outline': navigateCircleOutline,
      'time-outline': timeOutline,
      'pin-outline': pinOutline,
      'car-outline': carOutline,
      'card-outline': cardOutline,
      'alert-circle-outline': alertCircleOutline,
      'person-outline': personOutline
    });
  }

  ngOnInit() {
    this.obtenerHistorial();
  }

  ionViewWillEnter() {
    this.obtenerHistorial();
  }

  obtenerHistorial() {
    this.cargando = true;
    this.errorMsg = '';

    try {
      const authData = this.authService.getUserData();
      let idFinal = null;

      // Intentamos obtener el id_chofer en lugar del id_usuario
      if (authData) {
        idFinal = authData.id_chofer || authData.id;
      } else {
        const localData = localStorage.getItem('user_data');
        if (localData) {
          const parsed = JSON.parse(localData);
          idFinal = parsed.id_chofer || parsed.id;
        }
      }

      if (!idFinal) {
        console.warn('⚠️ No se encontró ID de chofer logueado');
        this.errorMsg = 'Debes iniciar sesión para ver tu historial de viajes.';
        this.cargando = false;
        return;
      }

      this.choferId = idFinal;
      console.log('🔍 Cargando historial para el Chofer ID:', this.choferId);

      // LLAMADA A LA NUEVA API QUE CREAMOS EXCLUSIVA PARA EL CHOFER
      this.http.get<any[]>(`http://localhost:3000/api/historialchofer/${this.choferId}`)
        .subscribe({
          next: (data) => {
            this.viajes = data;
            this.cargando = false;
            console.log('✅ Viajes recuperados:', this.viajes.length);
          },
          error: (err) => {
            console.error('❌ Error al conectar con el servidor', err);
            this.errorMsg = 'No pudimos conectar con el servidor.';
            this.cargando = false;
          }
        });

    } catch (error) {
      console.error('❌ Error crítico en obtenerHistorial:', error);
      this.cargando = false;
    }
  }

  // Redirigir a la pantalla principal del chofer si no tiene viajes
  irAPantallachofer(event: Event) {
    this.router.navigate(['/pantallachofer']); // Asegúrate de que esta ruta coincida con la de tu app
  }

  doRefresh(event: any) {
    this.obtenerHistorial();
    event.target.complete();
  }
}