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
  personOutline //icono para el pasajero
} from 'ionicons/icons';

@Component({
  selector: 'app-historialchofer',
  templateUrl: './historial-chofer.page.html', 
  styleUrls: ['./historial-chofer.page.scss'],
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
export class HistorialChoferPage implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);

  viajes: any[] = [];
  cargando = true;
  errorMsg = '';
  choferId: number | null = null;
// Agregar iconos personalizados y alertas 
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
// trae el historial del chofer logueado, si no tiene viajes muestra un mensaje y un boton para ir a la pantalla principal del chofer
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

      // obtenemos los datos del id chofer 
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
        console.warn(' No se encontró ID de chofer logueado');
        this.errorMsg = 'Debes iniciar sesión para ver tu historial de viajes.';
        this.cargando = false;
        return;
      }

      this.choferId = idFinal;
      console.log(' Cargando historial para el Chofer ID:', this.choferId);

      // realizamos la petición al backend para obtener el historial del chofer
      this.http.get<any[]>(`http://localhost:3000/api/historialchofer/${this.choferId}`)
        .subscribe({
          next: (data) => {
            this.viajes = data;
            this.cargando = false;
            console.log('Viajes recuperados:', this.viajes.length);
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

  // Redirigir a la pantalla principal del chofer si no tiene viajes
  irAPantallachofer(event: Event) {
    this.router.navigate(['/chofer']);
  }

  doRefresh(event: any) {
    this.obtenerHistorial();
    event.target.complete();
  }
}