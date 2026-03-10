import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, 
  IonButton, IonCheckbox, IonInput 
} from '@ionic/angular/standalone';

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
  userType: string = 'cliente'; // 'cliente' o 'chofer'
  
  // Datos para login de cliente
  loginData = {
    email: '',
    password: '',
    rememberMe: false
  };
  
  // Datos para login de chofer
  loginChoferData = {
    email: '',
    password: '',
    rememberMe: false
  };

  // Credenciales quemadas para demostración
  private credencialesCliente = {
    email: 'cliente@test.com',
    password: '123456'
  };

  private credencialesChofer = {
    email: 'chofer@test.com',
    password: '123456'
  };

  constructor(private router: Router) {}

  setUserType(type: string) {
    this.userType = type;
  }

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

  olvidePassword(event: Event) {
    event.preventDefault();
    // Aquí puedes agregar la lógica para recuperar contraseña
    console.log('Recuperar contraseña');
  }

  irARegistroCliente(event: Event) {
    event.preventDefault();
    this.router.navigate(['/registrousuario']);
  }

  irARegistroChofer(event: Event) {
    event.preventDefault();
    this.router.navigate(['/registrochofer']);
  }

  loginCliente() {
    // Validar que los campos no estén vacíos
    if (!this.loginData.email || !this.loginData.password) {
      this.mostrarMensaje('Por favor completa todos los campos');
      return;
    }

    // Validar credenciales (ejemplo con credenciales quemadas)
    if (this.loginData.email === this.credencialesCliente.email && 
        this.loginData.password === this.credencialesCliente.password) {
      
      console.log('Inicio de sesión exitoso como cliente', this.loginData);
      
      // Aquí puedes guardar datos del usuario en localStorage o un servicio
      localStorage.setItem('userType', 'cliente');
      localStorage.setItem('userEmail', this.loginData.email);
      
      // Redirigir a la vista de usuario
      this.router.navigate(['/vista-usuario']);
    } else {
      this.mostrarMensaje('Credenciales incorrectas. Usa cliente@test.com / 123456');
    }
  }

  loginChofer() {
    // Validar que los campos no estén vacíos
    if (!this.loginChoferData.email || !this.loginChoferData.password) {
      this.mostrarMensaje('Por favor completa todos los campos');
      return;
    }

    // Validar credenciales (ejemplo con credenciales quemadas)
    if (this.loginChoferData.email === this.credencialesChofer.email && 
        this.loginChoferData.password === this.credencialesChofer.password) {
      
      console.log('Inicio de sesión exitoso como chofer', this.loginChoferData);
      
      // Aquí puedes guardar datos del usuario en localStorage o un servicio
      localStorage.setItem('userType', 'chofer');
      localStorage.setItem('userEmail', this.loginChoferData.email);
      
      // Redirigir a la vista de chofer
      this.router.navigate(['/historial-chofer']);
    } else {
      this.mostrarMensaje('Credenciales incorrectas. Usa chofer@test.com / 123456');
    }
  }

  private mostrarMensaje(mensaje: string) {
    // Aquí puedes implementar un toast o alert
    console.log(mensaje);
    alert(mensaje); // Temporal, luego puedes cambiar por un Toast de Ionic
  }
}