import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { 
  IonContent, 
  IonIcon, 
  IonInput, 
  IonCheckbox, 
  IonButton,
  ToastController,
  AlertController,
  LoadingController
} from "@ionic/angular/standalone";
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-registro-usuario',
  templateUrl: './registrousuario.page.html',
  styleUrls: ['./registrousuario.page.scss'],
  imports: [IonButton, IonCheckbox, IonInput, IonIcon, IonContent, FormsModule],
})
export class RegistrousuarioPage {
  // Objeto con los campos exactos de la BD
  usuarioData = {
    nombre: '',
    apellido: '',
    edad: null as number | null,
    correo: '',
    telefono: '',
    contrasena: '',
    confirmContrasena: '',
    aceptaTerminos: false
  };

  // URL de tu backend - ajusta según tu configuración
  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private router: Router,
    private http: HttpClient,
    private toastController: ToastController,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {}

  togglePassword(inputId: string, iconId: string) {
    const input = document.getElementById(inputId) as HTMLInputElement;
    const icon = document.getElementById(iconId) as HTMLElement;
    
    if (input) {
      if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('name', 'eye-outline');
      } else {
        input.type = 'password';
        icon.setAttribute('name', 'eye-off-outline');
      }
    }
  }

  // Validar todos los campos antes de enviar
  private validarFormulario(): { valido: boolean; mensaje: string } {
    // Validar nombre
    if (!this.usuarioData.nombre || this.usuarioData.nombre.trim() === '') {
      return { valido: false, mensaje: 'El nombre es obligatorio' };
    }

    // Validar apellido
    if (!this.usuarioData.apellido || this.usuarioData.apellido.trim() === '') {
      return { valido: false, mensaje: 'El apellido es obligatorio' };
    }

    // Validar correo
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!this.usuarioData.correo || !emailRegex.test(this.usuarioData.correo)) {
      return { valido: false, mensaje: 'Ingresa un correo electrónico válido' };
    }

    // Validar edad
    if (!this.usuarioData.edad) {
      return { valido: false, mensaje: 'La edad es obligatoria' };
    }
    if (this.usuarioData.edad < 18) {
      return { valido: false, mensaje: 'Debes ser mayor de 18 años para registrarte' };
    }
    if (this.usuarioData.edad > 100) {
      return { valido: false, mensaje: 'Por favor, ingresa una edad válida' };
    }

    // Validar teléfono (opcional pero si se ingresa, que tenga formato válido)
    if (this.usuarioData.telefono) {
      const phoneRegex = /^[0-9]{7,15}$/;
      if (!phoneRegex.test(this.usuarioData.telefono.replace(/[^0-9]/g, ''))) {
        return { valido: false, mensaje: 'Ingresa un número de teléfono válido (solo números)' };
      }
    }

    // Validar contraseña
    if (!this.usuarioData.contrasena || this.usuarioData.contrasena.length < 6) {
      return { valido: false, mensaje: 'La contraseña debe tener al menos 6 caracteres' };
    }

    // Validar que las contraseñas coincidan
    if (this.usuarioData.contrasena !== this.usuarioData.confirmContrasena) {
      return { valido: false, mensaje: 'Las contraseñas no coinciden' };
    }

    // Validar términos y condiciones
    if (!this.usuarioData.aceptaTerminos) {
      return { valido: false, mensaje: 'Debes aceptar los términos y condiciones' };
    }

    return { valido: true, mensaje: '' };
  }

  async registrarUsuario() {
    // Validar formulario
    const validacion = this.validarFormulario();
    if (!validacion.valido) {
      await this.mostrarToast(validacion.mensaje, 'warning');
      return;
    }

    // Mostrar loading
    const loading = await this.loadingController.create({
      message: 'Registrando usuario...',
      spinner: 'circles',
      cssClass: 'custom-loading'
    });
    await loading.present();

    try {
      // Preparar datos para enviar al backend (sin confirmContrasena ni aceptaTerminos)
      const datosRegistro = {
        nombre: this.usuarioData.nombre.trim(),
        apellido: this.usuarioData.apellido.trim(),
        edad: this.usuarioData.edad,
        correo: this.usuarioData.correo.trim().toLowerCase(),
        telefono: this.usuarioData.telefono ? this.usuarioData.telefono.trim() : null,
        contrasena: this.usuarioData.contrasena // En un entorno real, deberías hashearla en el backend
      };

      // Enviar al backend
      const response = await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/registrousuario`, datosRegistro)
      );

      await loading.dismiss();

      // Mostrar mensaje de éxito
      const alert = await this.alertController.create({
        header: '¡Registro Exitoso!',
        message: `Bienvenido ${this.usuarioData.nombre}, tu cuenta ha sido creada correctamente.`,
        buttons: [{
          text: 'Iniciar Sesión',
          handler: () => {
            this.router.navigate(['/home']);
          }
        }]
      });
      await alert.present();

    } catch (error: any) {
      await loading.dismiss();
      
      // Manejar errores específicos
      let mensajeError = 'Error al registrar usuario. Por favor, intenta de nuevo.';
      
      if (error.error && error.error.error) {
        // Error del backend
        if (error.error.error.includes('correo ya está registrado')) {
          mensajeError = 'Este correo electrónico ya está registrado. ¿Olvidaste tu contraseña?';
        } else if (error.error.error.includes('edad')) {
          mensajeError = 'Debes ser mayor de 18 años para registrarte.';
        } else {
          mensajeError = error.error.error;
        }
      } else if (error.status === 0) {
        mensajeError = 'No se pudo conectar con el servidor. Verifica tu conexión.';
      }

      await this.mostrarToast(mensajeError, 'danger');
    }
  }

  async mostrarToast(mensaje: string, color: 'success' | 'warning' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      position: 'bottom',
      color: color,
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  irALogin(event: Event) {
    event.preventDefault();
    this.router.navigate(['/home']);
  }

  // Método para limpiar el formulario (útil después de registro exitoso)
  limpiarFormulario() {
    this.usuarioData = {
      nombre: '',
      apellido: '',
      edad: null,
      correo: '',
      telefono: '',
      contrasena: '',
      confirmContrasena: '',
      aceptaTerminos: false
    };
  }

  // Método para validar en tiempo real el formato del teléfono
  formatearTelefono() {
    if (this.usuarioData.telefono) {
      // Eliminar cualquier caracter que no sea número
      this.usuarioData.telefono = this.usuarioData.telefono.replace(/[^0-9]/g, '');
    }
  }
}
