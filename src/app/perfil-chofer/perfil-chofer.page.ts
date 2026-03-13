import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth';
import {
  IonContent, IonIcon, IonButton, IonAvatar,
  IonItem, IonLabel, IonList, IonListHeader,
  IonText, IonSpinner, IonInput
} from "@ionic/angular/standalone";

@Component({
  selector: 'app-perfil-chofer',
  templateUrl: './perfil-chofer.page.html',
  styleUrls: ['./perfil-chofer.page.scss'],
  standalone: true,
  imports: [
    IonSpinner,
    CommonModule,
    FormsModule,
    IonButton,
    IonIcon,
    IonContent,
    IonAvatar,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonText,
    IonInput
  ],
})
export class PerfilChoferPage implements OnInit {

  // Servicios
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);

  // Datos del chofer
  choferInfo: any = null;

  // Control de modo edición
  modoEdicion: boolean = false;

  // 👉 VERIFICA 1: editData TIENE los campos correctos
  editData: any = {
    telefono: '',           // ✅ Para teléfono
    passwordNueva: '',      // ✅ Para nueva contraseña
    confirmarPassword: ''    // ✅ Para confirmar
  };

  // Mensajes
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' = 'success';

  // Para el ojo de la contraseña
  mostrarPasswordNueva: boolean = false;  // ✅ Solo una variable

  ngOnInit() {
    const datosSesion = this.authService.getUserData();

    if (datosSesion) {
      this.choferInfo = datosSesion;
      console.log('✅ Datos del login:', this.choferInfo);
    } else {
      console.warn('❌ No hay sesión');
      this.router.navigate(['/home']);
    }
  }

  // 👉 VERIFICA 2: activarEdicion USA los campos correctos
  activarEdicion() {
    this.editData = {
      telefono: this.choferInfo.telefono || '',
      passwordNueva: '',      // ✅ SOLO nueva contraseña
      confirmarPassword: ''   // ✅ Confirmación
    };
    this.modoEdicion = true;
    this.mensaje = '';
  }

  // Cancelar edición
  cancelarEdicion() {
    this.modoEdicion = false;
    this.editData = {
      telefono: '',
      passwordNueva: '',
      confirmarPassword: ''
    };
    this.mensaje = '';
  }

  // 👉 VERIFICA 3: guardarCambios TIENE validación de contraseñas
  guardarCambios() {
    const userId = this.choferInfo?.id;

    if (!userId) {
      this.mostrarMensaje('Error de sesión', 'error');
      return;
    }

    // Validar que haya cambios
    if (this.editData.telefono === this.choferInfo.telefono && !this.editData.passwordNueva) {
      this.mostrarMensaje('No hay cambios para guardar', 'error');
      return;
    }

    // 👉 VERIFICA 4: Validación de contraseña (¿ESTÁ ESTO?)
    if (this.editData.passwordNueva) {
      if (this.editData.passwordNueva.length < 6) {
        this.mostrarMensaje('La nueva contraseña debe tener al menos 6 caracteres', 'error');
        return;
      }

      // ✅ ESTA VALIDACIÓN ES CLAVE
      if (this.editData.passwordNueva !== this.editData.confirmarPassword) {
        this.mostrarMensaje('Las contraseñas no coinciden', 'error');
        return;
      }
    }

    // Actualizar teléfono si cambió
    if (this.editData.telefono !== this.choferInfo.telefono) {
      this.http.put(`http://localhost:3000/api/usuarios/${userId}`, {
        telefono: this.editData.telefono
      }).subscribe({
        next: (res: any) => {
          // Actualizar datos locales
          this.choferInfo.telefono = this.editData.telefono;

          // Actualizar localStorage
          const userData = this.authService.getUserData();
          userData.telefono = this.editData.telefono;
          localStorage.setItem('userData', JSON.stringify(userData));

          this.mostrarMensaje('Teléfono actualizado', 'success');

          // Si también quiere cambiar contraseña
          if (this.editData.passwordNueva) {
            this.cambiarPassword(userId);
          } else {
            setTimeout(() => {
              this.modoEdicion = false;
            }, 1500);
          }
        },
        error: (err) => {
          console.error('Error:', err);
          this.mostrarMensaje('Error al actualizar teléfono', 'error');
        }
      });
    } else if (this.editData.passwordNueva) {
      // Solo cambiar contraseña
      this.cambiarPassword(userId);
    } else {
      this.modoEdicion = false;
    }
  }

  // 👉 VERIFICA 5: cambiarPassword SOLO envía nueva contraseña
  cambiarPassword(userId: string) {
    // ✅ SOLO envía nueva, sin passwordActual
    this.http.put(`http://localhost:3000/api/usuarios/${userId}/password`, {
      nueva: this.editData.passwordNueva
    }).subscribe({
      next: () => {
        this.mostrarMensaje('Contraseña actualizada correctamente', 'success');
        setTimeout(() => {
          this.modoEdicion = false;
        }, 1500);
      },
      error: (err) => {
        this.mostrarMensaje(err.error?.error || 'Error al cambiar contraseña', 'error');
      }
    });
  }

  // Mostrar mensajes
  mostrarMensaje(texto: string, tipo: 'success' | 'error') {
    this.mensaje = texto;
    this.tipoMensaje = tipo;
    setTimeout(() => this.mensaje = '', 3000);
  }

  cambiarFoto() {
    console.log('Funcionalidad para cambiar foto');
  }

  regresar() {
    this.router.navigate(['/chofer']);
  }

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}