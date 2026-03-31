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
  private authService = inject(AuthService);
  private router = inject(Router);

  userType: string = 'cliente';
  loginData = {
    email: '',
    password: '',
    rememberMe: false
  };

  constructor() {
    addIcons({
      addOutline, mailOutline, lockClosedOutline,
      eyeOffOutline, eyeOutline, personOutline,
      carOutline, carSportOutline
    });
  }

  setUserType(type: string) {
    this.userType = type;
  }

  iniciarSesion() {
    // 1. Limpieza de espacios en blanco (evita el error de "correo no registrado")
    const correoLimpio = this.loginData.email.trim().toLowerCase();
    const passLimpia = this.loginData.password.trim();

    if (!correoLimpio || !passLimpia) {
      alert('Por favor completa todos los campos');
      return;
    }

    // 2. Llamada al servicio con datos limpios
    this.authService.login(correoLimpio, passLimpia).subscribe({
      next: (res) => {
        console.log('¡Login exitoso!', res);

        // Guardamos token y datos del usuario
        localStorage.setItem('token', res.token);
        localStorage.setItem('user_data', JSON.stringify(res.user));

        // 3. REDIRECCIÓN BASADA EN EL ROL DE LA API
        // Asegúrate de que los strings coincidan con tu backend
        const rol = res.user.rol.toLowerCase(); 

        if (rol === 'admin') {
          this.router.navigate(['/administrador']);
        } else if (rol === 'chofer') {
          this.router.navigate(['/chofer']);
        } else {
          this.router.navigate(['/pantallausuario']);
        }
      },
      error: (err) => {
        console.error('Error en login:', err);
        // Si el error es 401, mostramos el mensaje de la API o uno genérico
        const mensaje = err.error?.error || 'Error de conexión con el servidor';
        alert(mensaje);
      }
    });
  }

  // Lógica para mostrar/ocultar contraseña
  togglePassword(inputId: string, iconId: string) {
    const input = document.getElementById(inputId) as any;
    const icon = document.getElementById(iconId) as any;

    if (input && icon) {
      if (input.type === 'password') {
        input.type = 'text';
        icon.name = 'eye-outline';
      } else {
        input.type = 'password';
        icon.name = 'eye-off-outline';
      }
    }
  }

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
    alert('Hemos enviado instrucciones a tu correo.');
  }
}