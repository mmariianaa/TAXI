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
  chofer = {
    nombre: '',
    apellido: '',
    edad: null as number | null,
    tipo_documento: 'CC',
    numero_documento: '',
    correo: '',
    telefono: '',
    contrasena: '',
    marca_vehiculo: '',
    modelo_vehiculo: '',
    color_vehiculo: '',
    placa: '',
    capacidad: null as number | null,
    licencia: '',
    experiencia: 0
  };

  confirmarContrasena = '';
  terminosAceptados = false;

  constructor(private http: HttpClient) {}

  async registrarChofer() {
    if (!this.validarFormulario()) {
      return;
    }

    try {
      const datosEnvio = { ...this.chofer };
      console.log('Enviando datos:', datosEnvio);

      const response = await lastValueFrom(
        this.http.post('http://localhost:3000/api/registrochofer', datosEnvio)
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
    if (!this.chofer.nombre || !this.chofer.apellido || !this.chofer.edad) {
      alert('Por favor completa nombre, apellido y edad');
      return false;
    }

    if (this.chofer.edad < 18) {
      alert('Debes ser mayor de 18 años');
      return false;
    }

    if (!this.chofer.tipo_documento || !this.chofer.numero_documento) {
      alert('Por favor completa tipo y número de documento');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.chofer.correo || !emailRegex.test(this.chofer.correo)) {
      alert('Ingresa un correo electrónico válido');
      return false;
    }

    if (!this.chofer.marca_vehiculo || !this.chofer.modelo_vehiculo || 
        !this.chofer.color_vehiculo || !this.chofer.placa || !this.chofer.capacidad) {
      alert('Por favor completa todos los datos del vehículo');
      return false;
    }

    if (this.chofer.capacidad < 1 || this.chofer.capacidad > 10) {
      alert('La capacidad debe ser entre 1 y 10 pasajeros');
      return false;
    }

    if (!this.chofer.licencia) {
      alert('Por favor ingresa el número de licencia');
      return false;
    }

    if (!this.chofer.contrasena || this.chofer.contrasena.length < 6) {
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
      edad: null,
      tipo_documento: 'CC',
      numero_documento: '',
      correo: '',
      telefono: '',
      contrasena: '',
      marca_vehiculo: '',
      modelo_vehiculo: '',
      color_vehiculo: '',
      placa: '',
      capacidad: null,
      licencia: '',
      experiencia: 0
    };
    this.confirmarContrasena = '';
    this.terminosAceptados = false;
  }
}