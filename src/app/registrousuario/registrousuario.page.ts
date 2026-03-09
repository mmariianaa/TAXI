import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { IonContent, IonButton, IonIcon, IonCheckbox, IonInput, IonSelectOption, IonSelect } from '@ionic/angular/standalone';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-registrousuario',
  templateUrl: './registrousuario.page.html',
  styleUrls: ['./registrousuario.page.scss'],
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
export class RegistrousuarioPage {
  // Modelo ACTUALIZADO con todos los campos necesarios
  usuarioData = {
    nombre: '',
    apellido: '',
    tipo_documento: 'CC', // Valor por defecto en mayúsculas
    numero_documento: '',
    correo: '',
    telefono: '',
    edad: null as number | null,
    contrasena: '',
    confirmContrasena: '',
    aceptaTerminos: false
  };

  constructor(private http: HttpClient) {}

  async registrarUsuario() {
    if (!this.validarFormulario()) {
      return;
    }

    try {
      // Preparar datos para enviar (sin campos de validación)
      const datosEnvio = {
        nombre: this.usuarioData.nombre,
        apellido: this.usuarioData.apellido,
        tipo_documento: this.usuarioData.tipo_documento,
        numero_documento: this.usuarioData.numero_documento,
        correo: this.usuarioData.correo,
        telefono: this.usuarioData.telefono || null,
        edad: this.usuarioData.edad,
        contrasena: this.usuarioData.contrasena
      };

      console.log('Enviando datos:', datosEnvio);

      // 🔑 URL corregida al backend
      const response = await lastValueFrom(
        this.http.post('http://localhost:3000/api/registrousuario', datosEnvio)
      );
      
      console.log('Respuesta:', response);
      alert('✅ Usuario registrado exitosamente');
      this.resetFormulario();
      
    } catch (error: any) {
      console.error('Error completo:', error);
      
      let mensajeError = 'Error al registrar usuario ❌';
      
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
    // Validar datos personales
    if (!this.usuarioData.nombre || !this.usuarioData.apellido) {
      alert('Por favor completa nombre y apellido');
      return false;
    }

    // Validar documento
    if (!this.usuarioData.tipo_documento || !this.usuarioData.numero_documento) {
      alert('Por favor completa tipo y número de documento');
      return false;
    }

    // Validar edad
    if (!this.usuarioData.edad) {
      alert('Por favor ingresa tu edad');
      return false;
    }

    if (this.usuarioData.edad < 18) {
      alert('Debes ser mayor de 18 años');
      return false;
    }

    // Validar correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.usuarioData.correo || !emailRegex.test(this.usuarioData.correo)) {
      alert('Ingresa un correo electrónico válido');
      return false;
    }

    // Validar teléfono (opcional, pero si se ingresa debe tener formato válido)
    if (this.usuarioData.telefono) {
      const phoneRegex = /^[0-9]{7,15}$/;
      if (!phoneRegex.test(this.usuarioData.telefono)) {
        alert('El teléfono debe contener solo números (7-15 dígitos)');
        return false;
      }
    }

    // Validar contraseña
    if (!this.usuarioData.contrasena || this.usuarioData.contrasena.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (this.usuarioData.contrasena !== this.usuarioData.confirmContrasena) {
      alert('Las contraseñas no coinciden');
      return false;
    }

    if (!this.usuarioData.aceptaTerminos) {
      alert('Debes aceptar los términos y condiciones');
      return false;
    }

    return true;
  }

  resetFormulario() {
    this.usuarioData = {
      nombre: '',
      apellido: '',
      tipo_documento: 'CC',
      numero_documento: '',
      correo: '',
      telefono: '',
      edad: null,
      contrasena: '',
      confirmContrasena: '',
      aceptaTerminos: false
    };
  }

  irALogin(event: Event) {
    event.preventDefault();
    // Aquí va la lógica para navegar al login
    console.log('Navegar a login');
  }
}