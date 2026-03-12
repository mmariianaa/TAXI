import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth'; // Asegúrate de que la ruta sea correcta
import { 
  IonContent, IonIcon, IonButton, IonAvatar, 
  IonItem, IonLabel, IonList, IonListHeader, 
  IonText, IonSpinner } from "@ionic/angular/standalone";

@Component({
  selector: 'app-perfil-chofer',
  templateUrl: './perfil-chofer.page.html',
  styleUrls: ['./perfil-chofer.page.scss'],
  standalone: true,
  imports: [IonSpinner, 
    CommonModule,
    IonButton, 
    IonIcon, 
    IonContent, 
    IonAvatar
    // Si usas IonItem o IonLabel en el HTML, agrégalos aquí también
  ],
})
export class PerfilChoferPage implements OnInit {
  
  // Inyecciones de servicios (Forma moderna de Angular)
  private authService = inject(AuthService);
  private router = inject(Router);

  /* Inicializamos choferInfo como null. 
     Se llenará automáticamente al entrar a la página con los datos del Login.
  */
  choferInfo: any = null;

  ngOnInit() {
    // 1. Intentamos obtener los datos del usuario guardados en el servicio
    const datosSesion = this.authService.getUserData();
    
    if (datosSesion) {
      // 2. Si existen, los asignamos a nuestra variable para el HTML
      this.choferInfo = datosSesion;
      console.log('Sesión activa. Datos cargados:', this.choferInfo);
    } else {
      // 3. Si no hay datos (intento de entrada ilegal), mandamos al Home
      console.warn('No se encontró sesión activa. Redirigiendo...');
      this.router.navigate(['/home']);
    }
  }

  /**
   * Navega a la pantalla principal del chofer
   */
  regresar() {
    // Ajusta 'chofer' por el nombre exacto de tu ruta principal
    this.router.navigate(['/chofer']); 
  }

  /**
   * Cierra la sesión limpiando el almacenamiento y redirigiendo al Home
   */
  cerrarSesion() {
    // Llamamos al método logout que creamos en el AuthService
    this.authService.logout();
    console.log('Sesión cerrada correctamente');
  }
}