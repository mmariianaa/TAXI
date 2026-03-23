import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
<<<<<<< HEAD
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonIcon, IonBackButton, 
=======
  IonContent, IonHeader, IonTitle, IonToolbar, 
  IonList, IonItem, IonLabel, IonBadge, 
  IonCard, IonCardContent, IonIcon, IonText, 
  IonSpinner, IonBackButton, IonButtons, IonButton 
>>>>>>> Monybbranch
} from '@ionic/angular/standalone';
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
  imports: [
<<<<<<< HEAD
    CommonModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonButtons,
    IonBackButton, 
    IonIcon, // ← AGREGADO: Faltaba importar IonIcon
=======
    IonButton, IonButtons, IonBackButton, 
    CommonModule, FormsModule, IonContent, IonHeader, IonTitle, 
    IonToolbar,IonItem, IonLabel, IonBadge, 
    IonCard, IonCardContent, IonIcon, IonSpinner
>>>>>>> Monybbranch
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
      // 1. OBTENER ID REAL (Siguiendo la lógica de tu PerfilusuarioPage)
      const authData = this.authService.getUserData();
      let idFinal = null;

      if (authData) {
        idFinal = authData.id_usuario || authData.id;
      } else {
        // Fallback al localStorage si el servicio está vacío
        const localData = localStorage.getItem('user_session');
        if (localData) {
          const parsed = JSON.parse(localData);
          idFinal = parsed.id_usuario || parsed.id;
        }
      }

      // 2. VALIDAR SI TENEMOS UN ID
      if (!idFinal) {
        console.warn('⚠️ No se encontró ID de usuario logueado');
        this.errorMsg = 'Debes iniciar sesión para ver tu historial.';
        this.cargando = false;
        // Opcional: Redirigir al login
        // this.router.navigate(['/home']); 
        return;
      }

      this.userId = idFinal;
      console.log('🔍 Cargando historial para el ID:', this.userId);

      // 3. LLAMADA A LA API
      // Usamos el ID dinámico y tipo 'usuario'
      this.http.get<any[]>(`http://localhost:3000/api/historialusuario/${this.userId}?tipo=usuario`)
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
<<<<<<< HEAD
=======

  // Navegación al hacer clic en el botón de "Pedir mi primer Taxi"
  irAPantallausuario(event: Event) {
    this.router.navigate(['/pantallausuario']);
  }

  // Refrescar manualmente con el scroll (si lo añades al HTML)
  doRefresh(event: any) {
    this.obtenerHistorial();
    event.target.complete();
  }
>>>>>>> Monybbranch
}