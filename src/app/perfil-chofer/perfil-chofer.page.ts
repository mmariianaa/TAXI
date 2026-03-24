import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';

import {
  pencil, checkmark, close, camera, imageOutline,
  trashOutline, logOutOutline, arrowBackOutline,
  eyeOutline, eyeOffOutline
} from 'ionicons/icons';
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
    IonSpinner, CommonModule, FormsModule, IonButton, IonIcon,
    IonContent, IonAvatar, IonInput
  ],
})
export class PerfilChoferPage implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private alertCtrl = inject(AlertController);

  choferInfo: any = null;
  modoEdicion: boolean = false;

  editData: any = {
    telefono: '',
    correo: '',
    passwordNueva: '',
    confirmarPassword: ''
  };

  mensaje: string = '';
  tipoMensaje: 'success' | 'error' = 'success';
  mostrarPasswordNueva: boolean = false;
  avatarUrl: string = 'assets/avatar.png';

  constructor() {
    addIcons({
      pencil, checkmark, close, camera, imageOutline,
      trashOutline, logOutOutline, arrowBackOutline,
      eyeOutline, eyeOffOutline
    });
  }

  ngOnInit() {
    const datosSesion = this.authService.getUserData();
    if (datosSesion) {
      this.choferInfo = datosSesion;
    } else {
      this.router.navigate(['/home']);
    }
  }

  async cambiarFoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos
      });
      if (image && image.dataUrl) {
        this.avatarUrl = image.dataUrl;

      }
    } catch (error) {
      console.log('Usuario canceló');
    }
  }

  quitarFoto() {
    this.avatarUrl = 'assets/avatar.png';

  }

  activarEdicion() {
    this.editData = {
      telefono: this.choferInfo.telefono || '',
      correo: this.choferInfo.correo || '',
      passwordNueva: '',
      confirmarPassword: ''
    };
    this.modoEdicion = true;
    this.mensaje = '';
  }

  cancelarEdicion() {
    this.modoEdicion = false;
    this.editData = {
      telefono: '',
      correo: '',
      passwordNueva: '',
      confirmarPassword: ''
    };
    this.mensaje = '';
  }

  guardarCambios() {
    const userId = this.choferInfo?.id;
    if (!userId) {
      this.mostrarMensaje('Error de sesión', 'error');
      return;
    }

    if (this.editData.telefono && this.editData.telefono.length !== 10) {
      this.mostrarMensaje('El teléfono debe tener 10 dígitos', 'error');
      return;
    }

    if (this.editData.correo) {
      if (!this.editData.correo.includes('@')) {
        this.mostrarMensaje('El correo debe contener @', 'error');
        return;
      }
      if (!this.editData.correo.includes('.com')) {
        this.mostrarMensaje('El correo debe terminar en .com', 'error');
        return;
      }
    }

    if (this.editData.passwordNueva) {
      if (this.editData.passwordNueva.length < 8) {
        this.mostrarMensaje('La contraseña debe tener al menos 8 caracteres', 'error');
        return;
      }
      if (this.editData.passwordNueva !== this.editData.confirmarPassword) {
        this.mostrarMensaje('Las contraseñas no coinciden', 'error');
        return;
      }
    }

    if (this.editData.telefono === this.choferInfo.telefono &&
      this.editData.correo === this.choferInfo.correo &&
      !this.editData.passwordNueva) {
      this.mostrarMensaje('No hay cambios para guardar', 'error');
      return;
    }

    if (this.editData.telefono !== this.choferInfo.telefono ||
      this.editData.correo !== this.choferInfo.correo) {

      this.http.put(`http://localhost:3000/api/usuarios/${userId}`, {
        telefono: this.editData.telefono,
        correo: this.editData.correo
      }).subscribe({
        next: async (res: any) => {
          this.choferInfo.telefono = this.editData.telefono;
          this.choferInfo.correo = this.editData.correo;

          const userData = this.authService.getUserData();
          userData.telefono = this.editData.telefono;
          userData.correo = this.editData.correo;
          localStorage.setItem('userData', JSON.stringify(userData));

          // this.mostrarMensaje('Datos actualizados', 'success');  // este es el mensaje anterior, lo comento para usar la alerta nueva
          await this.mostrarAlertaExito('Datos actualizados correctamente');

          if (this.editData.passwordNueva) {
            this.cambiarPassword(userId);
          } else {
            setTimeout(() => this.modoEdicion = false, 1500);
          }
        },
        error: (err) => {
          this.mostrarMensaje('Error al actualizar', 'error');
        }
      });
    } else if (this.editData.passwordNueva) {
      this.cambiarPassword(userId);
    }
  }

  cambiarPassword(userId: string) {
    this.http.put(`http://localhost:3000/api/usuarios/${userId}/password`, {
      nueva: this.editData.passwordNueva
    }).subscribe({
      next: () => {
        // this.mostrarMensaje('Contraseña actualizada', 'success');este es el mensaje anterior, lo comento para usar la alerta nueva
        this.mostrarAlertaExito('Tu contraseña ha sido actualizada correctamente');
        setTimeout(() => this.modoEdicion = false, 1500);
      },
      error: (err) => {
        this.mostrarMensaje('Error al cambiar contraseña', 'error');
      }
    });
  }

  // Alerta personalizada para mostrar mensajes de que se guardo correctamente los datos
  //y es opcional por que casi no me gusto, solo se quita este codigo
  mostrarMensaje(texto: string, tipo: 'success' | 'error') {
    this.mensaje = texto;
    this.tipoMensaje = tipo;
    setTimeout(() => this.mensaje = '', 3000);
  }
  async mostrarAlertaExito(mensaje: string) {
    const alert = await this.alertCtrl.create({
      header: '✅ Éxito',
      message: mensaje,
      cssClass: 'alerta-exito',
      buttons: ['OK']
    });
    await alert.present();
  }
  // Agrega el método para mostrar la alerta de confirmación
  async confirmarCerrarSesion() {
    console.log('Mostrando alerta con clase: alerta-cerrar'); // ← Agrega esto

    const alert = await this.alertCtrl.create({
      header: '¿Cerrar sesión?',
      message: '¿Estás seguro de que deseas salir?',
      cssClass: 'alerta-cerrar',  // ← Verifica que está aquí
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'cancel-btn'
        },
        {
          text: 'Sí, salir',
          handler: () => {
            this.cerrarSesion();
          }
        }
      ]
    });
    await alert.present();
  }

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  regresar() {
    this.router.navigate(['/chofer']);
  }
  soloNumeros(event: KeyboardEvent) {
    // Teclas permitidas (borrar, flechas, tab)
    const teclasPermitidas = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];

    if (teclasPermitidas.includes(event.key)) {
      return; // No bloquea estas teclas
    }

    // Bloquea si no es un número (0-9)
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }
}