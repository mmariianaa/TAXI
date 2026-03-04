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
  // Tipo de usuario: 'cliente' o 'chofer'
  userType: string = 'cliente';
  
  // Pestañas para cliente
  activeTab: string = 'login';
  
  // Pestañas para chofer
  activeTabChofer: string = 'login';

  // Datos de login para cliente
  loginData = {
    email: '',
    password: '',
    rememberMe: false
  };

  // Datos de registro para cliente
  registroData = {
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    edad: null,
    password: '',
    confirmPassword: '',
    aceptaTerminos: false
  };

  // Datos de login para chofer
  loginChoferData = {
    email: '',
    password: '',
    rememberMe: false
  };

  // Datos de registro para chofer
  registroChoferData = {
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    licencia: '',
    experiencia: null,
    password: '',
    confirmPassword: '',
    aceptaTerminos: false
  };

  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  // Cambiar entre Cliente y Chofer
  setUserType(type: string) {
    this.userType = type;
  }

  // Cambiar pestañas de cliente
  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  // Cambiar pestañas de chofer
  setActiveTabChofer(tab: string) {
    this.activeTabChofer = tab;
  }

  // Login de cliente
  loginCliente() {
    console.log('Login cliente:', this.loginData);
    // Aquí va la lógica de login
    // this.http.post(`${this.apiUrl}/login/cliente`, this.loginData)
  }

  // Login de chofer
  loginChofer() {
    console.log('Login chofer:', this.loginChoferData);
    // Aquí va la lógica de login
    // this.http.post(`${this.apiUrl}/login/chofer`, this.loginChoferData)
  }

  // Registro de cliente
  registrarCliente() {
    console.log('Registro cliente:', this.registroData);
    // Aquí va la lógica de registro
    // this.http.post(`${this.apiUrl}/registro/cliente`, this.registroData)
  }

  // Registro de chofer
  registrarChofer() {
    console.log('Registro chofer:', this.registroChoferData);
    // Aquí va la lógica de registro
    // this.http.post(`${this.apiUrl}/registro/chofer`, this.registroChoferData)
  }

  // Recuperar contraseña
  olvidePassword(event: Event) {
    event.preventDefault();
    console.log('Recuperar contraseña');
    // Aquí va la lógica para recuperar contraseña
  }

  // Login con Google
  loginWithGoogle() {
    console.log('Login con Google');
  }

  // Login con Facebook
  loginWithFacebook() {
    console.log('Login con Facebook');
  }

  // Login con Apple
  loginWithApple() {
    console.log('Login con Apple');
  }

  // Mostrar/ocultar contraseña
  togglePassword(inputId: string, iconId: string) {
    const input = document.getElementById(inputId) as HTMLInputElement;
    const icon = document.getElementById(iconId) as HTMLIonIconElement;
    
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
}