import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth'; 

import {
  IonContent,
  IonIcon,
  IonButton,
  IonCheckbox,
  IonInput
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  addOutline,
  mailOutline,
  lockClosedOutline,
  eyeOffOutline,
  eyeOutline,
  personOutline,
  carOutline,
  carSportOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonInput,
    IonCheckbox,
    IonButton,
    IonIcon,
    IonContent
  ]
})
export class HomePage {
  // Inyecciones de dependencia modernas
  private authService = inject(AuthService);
  private router = inject(Router);

  // Propiedades del componente
  userType: string = 'cliente';
  loginData = {
    email: '',
    password: '',
    rememberMe: false
  };

  constructor() {
    // Registro de iconos para que se vean en el HTML
    addIcons({
      addOutline, mailOutline, lockClosedOutline,
      eyeOffOutline, eyeOutline, personOutline,
      carOutline, carSportOutline
    });
  }

  // --- LÓGICA DE NEGOCIO ---

  setUserType(type: string) {
    this.userType = type;
  }

  iniciarSesion() {
    // Validación básica de campos vacíos
    if (!this.loginData.email || !this.loginData.password) {
      alert('Por favor completa todos los campos');
      return;
    }

    this.authService.login(this.loginData.email, this.loginData.password).subscribe({
      next: (res) => {
        console.log('¡Login exitoso!', res);

        // 1. Guardamos la información esencial en el navegador
        localStorage.setItem('token', res.token);
        localStorage.setItem('user_data', JSON.stringify(res.user));

        // 2. SISTEMA DE REDIRECCIÓN POR ROLES
        // Aquí decidimos a qué página va el usuario según su rol en la BD
        switch (res.user.rol) {
          case 'admin':
            this.router.navigate(['/administrador']);
            break;
          case 'chofer':
            this.router.navigate(['/chofer']);
            break;
          default:
            this.router.navigate(['/pantallausuario']);
            break;
        }
      },
      error: (err) => {
        console.error('Error en login:', err);
        const mensaje = err.error?.error || 'Credenciales incorrectas o error de conexión';
        alert(mensaje);
      }
    });
  }

  // --- LÓGICA DE INTERFAZ (UI) ---

  togglePassword(inputId: string, iconId: string) {
    const input = document.querySelector(`#${inputId}`) as any;
    const icon = document.querySelector(`#${iconId}`) as any;

    if (input.type === 'password') {
      input.type = 'text';
      icon.name = 'eye-outline';
    } else {
      input.type = 'password';
      icon.name = 'eye-off-outline';
    }
  }

  // --- NAVEGACIÓN ---

  irARegistroCliente(event: Event) {
    event.preventDefault();
    this.router.navigate(['/registrousuario']);
  }

  irARegistroChofer(event: Event) {
    event.preventDefault();
    this.router.navigate(['/registrochofer']);
  }

  olvidePassword(event: Event) {
    event.preventDefault();
    alert('Hemos enviado instrucciones a tu correo para recuperar tu acceso.');
  }
}