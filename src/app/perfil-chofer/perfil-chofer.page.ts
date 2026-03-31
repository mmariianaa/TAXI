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
  IonSpinner, IonInput
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
   selectedFile: File | null = null;

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
       //Inicializar avatarUrl con la foto de la BD si existe
    if (this.choferInfo.foto) {
      this.avatarUrl = this.choferInfo.foto; // URL pública de Cloudinary
    } else {
      this.avatarUrl = 'assets/avatar.png'; // Imagen por defecto
    }  
    } else {
      this.router.navigate(['/home']);
    }
  }

async cambiarFoto() {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri, 
      source: CameraSource.Photos
    });

    if (image && image.webPath) {
      const response = await fetch(image.webPath);
      const blob = await response.blob();
      
      this.avatarUrl = image.webPath; 
      // Guardamos el blob directamente
      this.selectedFile = blob as any; 
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

  // Validaciones de teléfono
  if (this.editData.telefono && this.editData.telefono.length !== 10) {
    this.mostrarMensaje('El teléfono debe tener 10 dígitos', 'error');
    return;
  }

  // Validaciones de correo
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

  // Validaciones de contraseña
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

  const noHayCambios =
    this.editData.telefono === this.choferInfo.telefono &&
    this.editData.correo === this.choferInfo.correo &&
    !this.editData.passwordNueva &&
    !this.selectedFile &&
    this.avatarUrl === this.choferInfo.foto;
  // Si no hay cambios

  if (noHayCambios) {
    this.mostrarMensaje('No hay cambios para guardar', 'error');
    return;
  }

  
  const formData = new FormData();
  formData.append('nombre', this.choferInfo.nombre);
  formData.append('apellido', this.choferInfo.apellido);
  formData.append('telefono', this.editData.telefono);
  formData.append('correo', this.editData.correo);

  if (this.selectedFile) {
    formData.append('foto', this.selectedFile); 
  } else if(this.avatarUrl === 'assets/avatar.png'){
    formData.append('quitarFoto','true');
  }

  this.http.put(`http://localhost:3000/api/perfil/actualizar-completo/${userId}`, formData)
    .subscribe({
      next: async (res: any) => {
        // Actualizar datos en memoria/localStorage
        this.choferInfo.telefono = this.editData.telefono;
        this.choferInfo.correo = this.editData.correo;

        if (res.foto) {
          this.avatarUrl = res.foto;
          this.choferInfo.foto=res.foto; 
        } else{
          this.avatarUrl = 'assets/avatar.png';
          this.choferInfo.foto =null;
        }

        const userData = this.authService.getUserData();
        userData.telefono = this.editData.telefono;
        userData.correo = this.editData.correo;
        userData.foto= res.foto ||null;
        localStorage.setItem('user_session',JSON.stringify(userData));

        await this.mostrarAlertaExito('Datos actualizados correctamente');

        if (this.editData.passwordNueva) {
          this.cambiarPassword(userId);
        } else {
          setTimeout(() => this.modoEdicion = false, 1500);
        }
      },
      error: () => {
        this.mostrarMensaje('Error al actualizar', 'error');
      }
    });
}


  cambiarPassword(userId: string) {
    this.http.put(`http://localhost:3000/api/usuarios/${userId}/password`, {
      nueva: this.editData.passwordNueva
    }).subscribe({
      next: () => {

        this.mostrarAlertaExito('Tu contraseña ha sido actualizada correctamente');
        setTimeout(() => this.modoEdicion = false, 1500);
      },
      error: (err) => {
        this.mostrarMensaje('Error al cambiar contraseña', 'error');
      }
    });
  }

  mostrarMensaje(texto: string, tipo: 'success' | 'error') {
    this.mensaje = texto;
    this.tipoMensaje = tipo;
    setTimeout(() => this.mensaje = '', 3000);
  }
  async mostrarAlertaExito(mensaje: string) {
    const alert = await this.alertCtrl.create({
      header: ' Éxito',
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