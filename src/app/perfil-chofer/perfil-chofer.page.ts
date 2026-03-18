import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { addIcons } from 'ionicons';
import { camera, imageOutline, trashOutline } from 'ionicons/icons';
import {
  IonContent, IonIcon, IonButton, IonAvatar,
  IonItem, IonLabel, IonList, IonListHeader,
  IonText, IonSpinner, IonInput
} from "@ionic/angular/standalone";
import { AlertController } from '@ionic/angular';  // 📌 NUEVO: Para la alerta

@Component({
  selector: 'app-perfil-chofer',
  templateUrl: './perfil-chofer.page.html',
  styleUrls: ['./perfil-chofer.page.scss'],
  standalone: true,
  imports: [
    IonSpinner, CommonModule, FormsModule, IonButton, IonIcon,
    IonContent, IonAvatar, IonItem, IonLabel, IonList,
    IonListHeader, IonText, IonInput
  ],
})
export class PerfilChoferPage implements OnInit {
  // Servicios
  private authService = inject(AuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private alertCtrl = inject(AlertController);  // 📌 NUEVO: Para la alerta

  // Datos del chofer
  choferInfo: any = null;
  modoEdicion: boolean = false;

  // Datos para editar
  editData: any = {
    telefono: '',
    correo: '',
    passwordNueva: '',
    confirmarPassword: ''
  };

  // Mensajes
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' = 'success';
  mostrarPasswordNueva: boolean = false;
  avatarUrl: string = 'assets/avatar.png';

  constructor() {
    addIcons({ camera, imageOutline, trashOutline });
  }

  ngOnInit() {
    const datosSesion = this.authService.getUserData();
    if (datosSesion) {
      this.choferInfo = datosSesion;
    } else {
      this.router.navigate(['/home']);
    }
  }

  // 📷 Foto
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
        this.mostrarMensaje('Foto actualizada', 'success');
      }
    } catch (error) {
      console.log('Usuario canceló');
    }
  }

  quitarFoto() {
    this.avatarUrl = 'assets/avatar.png';
    this.mostrarMensaje('Foto eliminada', 'success');
  }

  // ✏️ Modo edición
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

  // 💾 Guardar cambios
  guardarCambios() {
    const userId = this.choferInfo?.id;
    if (!userId) {
      this.mostrarMensaje('Error de sesión', 'error');
      return;
    }

    // Validar teléfono
    if (this.editData.telefono && this.editData.telefono.length !== 10) {
      this.mostrarMensaje('El teléfono debe tener 10 dígitos', 'error');
      return;
    }

    // Validar correo
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

    // Validar contraseña
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

    // Validar cambios
    if (this.editData.telefono === this.choferInfo.telefono &&
      this.editData.correo === this.choferInfo.correo &&
      !this.editData.passwordNueva) {
      this.mostrarMensaje('No hay cambios para guardar', 'error');
      return;
    }

    // Actualizar datos
    if (this.editData.telefono !== this.choferInfo.telefono ||
      this.editData.correo !== this.choferInfo.correo) {

      this.http.put(`http://localhost:3000/api/usuarios/${userId}`, {
        telefono: this.editData.telefono,
        correo: this.editData.correo
      }).subscribe({
        next: (res: any) => {
          this.choferInfo.telefono = this.editData.telefono;
          this.choferInfo.correo = this.editData.correo;

          const userData = this.authService.getUserData();
          userData.telefono = this.editData.telefono;
          userData.correo = this.editData.correo;
          localStorage.setItem('userData', JSON.stringify(userData));

          this.mostrarMensaje('Datos actualizados', 'success');

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

  // 🔐 Cambiar contraseña
  cambiarPassword(userId: string) {
    this.http.put(`http://localhost:3000/api/usuarios/${userId}/password`, {
      nueva: this.editData.passwordNueva
    }).subscribe({
      next: () => {
        this.mostrarMensaje('Contraseña actualizada', 'success');
        setTimeout(() => this.modoEdicion = false, 1500);
      },
      error: (err) => {
        this.mostrarMensaje('Error al cambiar contraseña', 'error');
      }
    });
  }

  // 📨 Mostrar mensajes
  mostrarMensaje(texto: string, tipo: 'success' | 'error') {
    this.mensaje = texto;
    this.tipoMensaje = tipo;
    setTimeout(() => this.mensaje = '', 3000);
  }

  // 👋 NUEVO: Confirmar cierre de sesión
  async confirmarCerrarSesion() {
    const alert = await this.alertCtrl.create({
      header: '¿Cerrar sesión?',
      message: '¿Estás seguro de que deseas salir?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'cancel-btn'
        },
        {
          text: 'Sí, salir',
          handler: () => {
            this.cerrarSesion();  // Llama al método original
          }
        }
      ]
    });

    await alert.present();
  }

  // 🚪 Cerrar sesión (método original)
  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  // 🔙 Regresar
  regresar() {
    this.router.navigate(['/chofer']);
  }
}