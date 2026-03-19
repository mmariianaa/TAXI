import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth'; // Asegúrate de que esta ruta sea correcta
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, 
  IonButton, IonCheckbox, IonInput 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonInput, IonCheckbox, IonButton, IonIcon, IonContent
  ]
})
export class HomePage {
  constructor(){
    addIcons({
      addOutline
    });

  }
  // Inyectamos los servicios necesarios
  private authService = inject(AuthService);
  private router = inject(Router);

  userType: string = 'cliente'; // Controla qué formulario se ve en el HTML
  
  // Datos para el login (unificados para ambos tipos de usuario)
  loginData = {
    email: '',
    password: '',
    rememberMe: false
  };

  setUserType(type: string) {
    this.userType = type;
  }

  // --- FUNCIÓN DE LOGIN REAL ---
iniciarSesion() {
  if (!this.loginData.email || !this.loginData.password) {
    alert('Por favor completa todos los campos');
    return;
  }

  this.authService.login(this.loginData.email, this.loginData.password).subscribe({
    next: (res) => {
      console.log('Inicio de sesión exitoso', res);
      
      // ✅ ESTAS LÍNEAS SON LAS QUE FALTAN
      localStorage.setItem('user', JSON.stringify(res.user));
      localStorage.setItem('token', res.token);
      
      if (res.user.rol === 'chofer') {
        this.router.navigate(['/chofer']);
      } else {
        this.router.navigate(['/pantallausuario']);
      }
    },
    error: (err) => {
      console.error('Error en login:', err);
      alert(err.error?.error || 'Error al conectar con el servidor');
    }
  });
}

  // Lógica visual para mostrar/ocultar contraseña
  togglePassword(inputId: string, iconId: string) {
    const input = document.getElementById(inputId) as HTMLInputElement;
    const icon = document.getElementById(iconId) as HTMLElement;
    
    if (input.type === 'password') {
      input.type = 'text';
      icon.setAttribute('name', 'eye-outline');
    } else {
      input.type = 'password';
      icon.setAttribute('name', 'eye-off-outline');
    }
  }

  // Navegación a registros
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
    console.log('Recuperar contraseña');
  }
}