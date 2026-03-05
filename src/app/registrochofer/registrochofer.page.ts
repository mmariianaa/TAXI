import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { IonContent, IonButton, IonIcon, IonCheckbox, IonInput, IonSelectOption, IonSelect } from '@ionic/angular/standalone';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-registrochofer',
  templateUrl: './registrochofer.page.html',
  styleUrls: ['./registrochofer.page.scss'],
  standalone: true,
  imports: [
    IonInput, 
    IonCheckbox, 
    IonIcon, 
    IonButton,
    CommonModule,
    FormsModule, 
    IonSelectOption, 
    IonSelect, 
    IonContent
  ]
})
export class RegistrochoferPage {
  // Modelo que coincide con lo que espera el backend
  chofer = {
    nombre: '',
    apellido: '',
    correo: '',
    telefono: '',
    contrasena: '',
    licencia: '',
    experiencia: 0,
    tipo_documento: 'cc',
    numero_documento: '',
    marca_vehiculo: '',
    modelo_vehiculo: '',
    color_vehiculo: '',
    placa: ''
  };

  confirmarContrasena = '';
  terminosAceptados = false;

  constructor(private http: HttpClient) {}

  async registrarChofer() {
    if (!this.validarFormulario()) {
      return;
    }

    try {
      // 🔑 Aquí cambiamos la URL al puerto correcto del backend
      const response = await lastValueFrom(
        this.http.post('http://localhost:3000/api/registrochofer', this.chofer)
      );
      
      console.log('Respuesta:', response);
      alert('✅ Chofer registrado exitosamente');
      this.resetFormulario();
      
    } catch (error: any) {
      console.error('Error completo:', error);
      
      let mensajeError = 'Error al registrar chofer ❌';
      
      if (error.error && error.error.error) {
        mensajeError = error.error.error;
      } else if (error.status === 400) {
        mensajeError = 'Datos incompletos o incorrectos';
      } else if (error.status === 500) {
        mensajeError = 'Error en el servidor';
      }
      
      alert(mensajeError);
    }
  }

  validarFormulario(): boolean {
    if (!this.chofer.nombre || !this.chofer.apellido || 
        !this.chofer.correo || !this.chofer.contrasena || 
        !this.chofer.licencia) {
      alert('Por favor completa todos los campos requeridos');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.chofer.correo)) {
      alert('Ingresa un correo electrónico válido');
      return false;
    }

    if (this.chofer.contrasena.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (this.chofer.contrasena !== this.confirmarContrasena) {
      alert('Las contraseñas no coinciden');
      return false;
    }

    if (!this.terminosAceptados) {
      alert('Debes aceptar los términos y condiciones');
      return false;
    }

    return true;
  }

  resetFormulario() {
    this.chofer = {
      nombre: '',
      apellido: '',
      correo: '',
      telefono: '',
      contrasena: '',
      licencia: '',
      experiencia: 0,
      tipo_documento: 'cc',
      numero_documento: '',
      marca_vehiculo: '',
      modelo_vehiculo: '',
      color_vehiculo: '',
      placa: ''
    };
    this.confirmarContrasena = '';
    this.terminosAceptados = false;
  }
}