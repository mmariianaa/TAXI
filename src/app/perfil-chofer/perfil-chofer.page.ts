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
  eyeOutline, eyeOffOutline, star
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

  promedioCalificacion: number = 0;
  totalEvaluaciones: number = 0;
  mensajeCalificacion: string = '';

  constructor() {
    addIcons({
      pencil, checkmark, close, camera, imageOutline,
      trashOutline, logOutOutline, arrowBackOutline,
      eyeOutline, eyeOffOutline, star
    });
  }

  ngOnInit() {
    this.cargarDatosUsuario();
  }

  cargarDatosUsuario() {
    const datosSesion = this.authService.getUserData();
    if (datosSesion) {
      this.choferInfo = datosSesion;
      this.avatarUrl = this.choferInfo.foto || 'assets/avatar.png';
      const userId = this.choferInfo.id || this.choferInfo.id_usuario;
      if (userId) {
        this.obtenerCalificacion(userId);
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
        // Convertir URI a Blob y luego a File para que Multer lo reciba bien
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        
        this.avatarUrl = image.webPath;
        // Creamos un archivo real a partir del blob
        this.selectedFile = new File([blob], `perfil_${Date.now()}.jpg`, { type: 'image/jpeg' });
      }
    } catch (error) {
      console.log('Usuario canceló selección de imagen');
    }
  }

  quitarFoto() {
    this.avatarUrl = 'assets/avatar.png';
    this.selectedFile = null;
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
    this.avatarUrl = this.choferInfo.foto || 'assets/avatar.png';
    this.selectedFile = null;
  }

  guardarCambios() {
    // Intentamos obtener el ID de cualquiera de las dos formas comunes
    const userId = this.choferInfo?.id || this.choferInfo?.id_usuario;

    if (!userId) {
      this.mostrarMensaje('Error de sesión: No se encontró el ID', 'error');
      return;
    }

    // Validaciones básicas
    if (this.editData.telefono && this.editData.telefono.length !== 10) {
      this.mostrarMensaje('El teléfono debe tener 10 dígitos', 'error');
      return;
    }

    if (this.editData.correo && (!this.editData.correo.includes('@') || !this.editData.correo.includes('.com'))) {
      this.mostrarMensaje('Correo inválido', 'error');
      return;
    }

    if (this.editData.passwordNueva) {
      if (this.editData.passwordNueva.length < 8) {
        this.mostrarMensaje('Contraseña mínima 8 caracteres', 'error');
        return;
      }
      if (this.editData.passwordNueva !== this.editData.confirmarPassword) {
        this.mostrarMensaje('Las contraseñas no coinciden', 'error');
        return;
      }
    }

    // Preparar FormData para enviar al Backend
    const formData = new FormData();
    formData.append('nombre', this.choferInfo.nombre || '');
    formData.append('apellido', this.choferInfo.apellido || '');
    formData.append('telefono', this.editData.telefono);
    formData.append('correo', this.editData.correo);

    if (this.selectedFile) {
      formData.append('foto', this.selectedFile);
    } else if (this.avatarUrl === 'assets/avatar.png' && this.choferInfo.foto) {
      formData.append('quitarFoto', 'true');
    }

    this.http.put(`http://localhost:3000/api/perfil/actualizar-completo/${userId}`, formData)
      .subscribe({
        next: async (res: any) => {
          // 1. Actualizar objeto local
          this.choferInfo.telefono = this.editData.telefono;
          this.choferInfo.correo = this.editData.correo;
          this.choferInfo.foto = res.foto || (this.avatarUrl === 'assets/avatar.png' ? null : this.choferInfo.foto);
          
          // 2. Actualizar LocalStorage para persistencia
          localStorage.setItem('user_session', JSON.stringify(this.choferInfo));

          await this.mostrarAlertaExito('Perfil actualizado correctamente');

          // 3. Si hay contraseña nueva, la actualizamos por separado
          if (this.editData.passwordNueva) {
            this.cambiarPassword(userId);
          } else {
            this.modoEdicion = false;
          }
        },
        error: (err) => {
          console.error('Error 500:', err);
          this.mostrarMensaje('Error al actualizar el perfil', 'error');
        }
      });
  }

  cambiarPassword(userId: any) {
    this.http.put(`http://localhost:3000/api/usuarios/${userId}/password`, {
      nueva: this.editData.passwordNueva
    }).subscribe({
      next: () => {
        this.mostrarAlertaExito('Tu contraseña ha sido actualizada');
        this.modoEdicion = false;
      },
      error: () => this.mostrarMensaje('Error al cambiar contraseña', 'error')
    });
  }

  obtenerCalificacion(userId: number) { 
    console.log('Solicitando calificación para el ID:', userId); // 👈 Agrega este log
    this.http.get<any>(`http://localhost:3000/api/usuarios/${userId}/calificacion`) 
      .subscribe({
        next: (res) => {
          console.log('Respuesta del servidor:', res); // 👈 Mira qué responde el servidor
          this.promedioCalificacion = res.promedio;
          
          // Tu backend devuelve "total" cuando es cero, o "total_resenas" cuando sí hay.
          this.totalEvaluaciones = res.total_resenas || res.total || 0; 
          
          // Guardamos el mensaje por si es un chofer nuevo
          if (res.mensaje) {
            this.mensajeCalificacion = res.mensaje; 
          }
        },
        error: (err) => {
          console.error('No se pudo obtener la calificación', err); 
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
      header: 'Éxito',
      message: mensaje,
      cssClass: 'alerta-exito',
      buttons: ['OK']
    });
    await alert.present();
  }

  async confirmarCerrarSesion() {
    const alert = await this.alertCtrl.create({
      header: '¿Cerrar sesión?',
      message: '¿Estás seguro de que deseas salir?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { 
          text: 'Sí, salir', 
          handler: () => this.cerrarSesion() 
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
    const teclasPermitidas = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    if (teclasPermitidas.includes(event.key)) return;
    if (!/^[0-9]$/.test(event.key)) event.preventDefault();
  }
}