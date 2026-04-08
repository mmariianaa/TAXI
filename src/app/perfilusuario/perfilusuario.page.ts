import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonToolbar, IonList, IonItem, IonLabel, IonInput, IonButton, 
  IonButtons, IonBackButton, IonContent, IonIcon, IonHeader, IonTitle
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { pencilSharp, person, shieldCheckmark, lockClosed, helpCircle, checkmarkCircle,starOutline, arrowBackOutline, trashOutline, timeOutline } from 'ionicons/icons';
import { AuthService } from '../services/auth'; // <-- IMPORTAR AuthService
import { HttpClient } from '@angular/common/http'; // <-- Para llamadas API
import { lastValueFrom } from 'rxjs';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-perfilusuario',
  templateUrl: './perfilusuario.page.html',
  styleUrls: ['./perfilusuario.page.scss'],
  standalone: true,
  imports: [
    IonTitle, IonHeader, IonIcon, IonContent, IonBackButton, IonButtons, IonToolbar,
    IonList, IonItem, IonLabel, IonInput, IonButton,
    CommonModule, FormsModule,
  ]
})
export class PerfilusuarioPage implements OnInit {
  // Inyectar servicios
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private alertController = inject(AlertController);
  private router = inject(Router);

  // Variables para edición
  editingField: string = '';
  activeSection: string = 'inicio';
  editingPersonal = false;
  editingPassword = false;
  newPassword = '';
  confirmPassword = '';

  // Datos del usuario
  user = {
    id: null,
    name: '',
    apellido: '',
    edad: '',
    genero: '',
    numero: '',
    email: '',
    password: '',
    foto: 'assets/default-avatar.png',
    calificacion: '★★★★☆ 4.5',
  };

  avatarUrl: string = 'assets/avatar.png';   // 👈 foto por defecto
  selectedFile: File | null = null;          // 👈 archivo seleccionado


  constructor() {
    // Registrar iconos
    addIcons({pencilSharp,trashOutline,person,shieldCheckmark,timeOutline,starOutline,lockClosed,helpCircle,checkmarkCircle,arrowBackOutline});
  }

  ngOnInit() {
    this.cargarDatosUsuario();
  }

  ionViewWillEnter() {
    // Recargar datos cada vez que entra a la página
    this.cargarDatosUsuario();
  }


  cargarDatosUsuario() {
    try {
      // Obtener datos del AuthService
      const authData = this.authService.getUserData();
      
      if (authData) {
        console.log(' Datos desde AuthService:', authData);
        
        // Mapear los datos del AuthService a la estructura de la vista
        this.user = {
          id: authData.id_usuario || authData.id || null,
          name: authData.nombre || '',
          apellido: authData.apellido || '',
          email: authData.correo || authData.email || '',
          numero: authData.telefono || '',
          edad: authData.edad ? authData.edad + ' años' : '',
          genero: authData.genero || '',
          foto: authData.foto || 'assets/avatar.png',
          password: '',
          calificacion: authData.calificacion || '★★★★☆ 4.5',
        };
         this.avatarUrl = this.user.foto;
        console.log(' Usuario mapeado:', this.user);
      } else {
        // Fallback a localStorage si AuthService no tiene datos
        const localData = localStorage.getItem('user_session');
        if (localData) {
          const parsed = JSON.parse(localData);
          console.log(' Datos desde localStorage:', parsed);
          
          this.user = {
            id: parsed.id_usuario || parsed.id || null,
            name: parsed.nombre || '',
            apellido: parsed.apellido || '',
            email: parsed.correo || parsed.email || '',
            numero: parsed.telefono || '',
            edad: parsed.edad ? parsed.edad + ' años' : '',
            genero: parsed.genero || '',
            foto: parsed.foto || 'assets/avatar.png',
            password: '',
            calificacion: parsed.calificacion || '★★★★☆ 4.5',
          };
          this.avatarUrl = this.user.foto;
        } else {
          // Si no hay sesión, redirigir al login
          console.warn(' No hay sesión activa');
          this.router.navigate(['/home']);
        }
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  }

  
  // FOTO DE PERFIL
  
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
        this.selectedFile = new File([blob], "foto.jpg", { type: blob.type });
      }
    } catch (error) {
      console.log('Usuario canceló');
    }
  }


  quitarFoto() {
    this.avatarUrl = 'assets/avatar.png';
    this.selectedFile = null;
  }

  async guardarCambios() {
    if (!this.user?.id) return;

    const formData = new FormData();
    formData.append('nombre', this.user.name);
    formData.append('apellido', this.user.apellido);
    formData.append('telefono', this.user.numero);
    formData.append('correo', this.user.email);

    if (this.selectedFile) {
      formData.append('foto', this.selectedFile);
    } else if (this.avatarUrl === 'assets/avatar.png') {
      formData.append('quitarFoto', 'true');
    }

    try {
      const res: any = await lastValueFrom(
        this.http.put(`http://localhost:3000/api/perfil/actualizar-completo/${this.user.id}`, formData)
      );

      this.user.foto = res.foto || 'assets/avatar.png';
      this.avatarUrl = this.user.foto;

      const localData = localStorage.getItem('user_session');
      if (localData) {
        const parsed = JSON.parse(localData);
        parsed.foto = res.foto || null;
        localStorage.setItem('user_session', JSON.stringify(parsed));
      }
       const alert = await this.alertController.create({
        header: ' Éxito',
        message: 'Perfil actualizado con éxito',
        buttons: ['OK']
      });
      await alert.present();

    } catch (error) {
      console.error(' Error al actualizar perfil:', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'No se pudo actualizar el perfil',
        buttons: ['OK']
      });
      await alert.present();
    }
  }
  
// metodos de edicion 
  setSection(section: string) {
    this.activeSection = section;
  }

  saveField(field: string) {
    console.log(`💾 Guardando cambios en: ${field}`, this.user);
    
    // Llamar al método correspondiente según el campo
    if (field === 'name') {
      this.actualizarNombre();
    } else if (field === 'phone') {
      this.actualizarTelefono();
    } else if (field === 'email') {
      this.actualizarEmail();
    }
    
    this.editingField = '';
  }

  // ACTUALIZAR TELÉFONO

  async actualizarTelefono() {
    if (!this.user.id) {
      console.error(' No hay ID de usuario');
      return;
    }

    try {
      const response = await lastValueFrom(
        this.http.put(`http://localhost:3000/api/usuarios/${this.user.id}`, {
          telefono: this.user.numero
        })
      );
      
      console.log(' Teléfono actualizado:', response);
      
      // Actualizar en AuthService/localStorage
      this.actualizarStorageLocal({ telefono: this.user.numero });
      
      // Mostrar mensaje de éxito
      const alert = await this.alertController.create({
        header: 'Éxito',
        message: 'Número de teléfono actualizado correctamente',
        buttons: ['OK']
      });
      await alert.present();
      
    } catch (error) {
      console.error(' Error al actualizar teléfono:', error);
      
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'No se pudo actualizar el teléfono',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

//actualizar el nombre y el apellido 
  async actualizarNombre() {
    if (!this.user.id) return;

    try {
    
      console.log('Actualizando nombre:', this.user.name, this.user.apellido);
      
      this.actualizarStorageLocal({ 
        nombre: this.user.name,
        apellido: this.user.apellido 
      });
      
    } catch (error) {
      console.error('Error:', error);
    }
  }


  // ACTUALIZAR EMAIL

  async actualizarEmail() {
    if (!this.user.id) return;
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.user.email)) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Correo electrónico no válido',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    try {
      
      console.log('Actualizando email:', this.user.email);
      
      this.actualizarStorageLocal({ correo: this.user.email });
      
    } catch (error) {
      console.error('Error:', error);
    }
  }


  actualizarStorageLocal(campos: any) {
    // Actualizar en localStorage
    const localData = localStorage.getItem('user_session');
    if (localData) {
      const parsed = JSON.parse(localData);
      const updated = { ...parsed, ...campos };
      localStorage.setItem('user_session', JSON.stringify(updated));
    }
    

  }

//cambiar foto del perfil 
  async changePhoto(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Vista previa local
      const reader = new FileReader();
      reader.onload = () => {
        this.user.foto = reader.result as string;
      };
      reader.readAsDataURL(file);
      
      // Aquí implementarías la subida al servidor
      console.log('📸 Foto seleccionada:', file.name);
      
    }
  }

  toggleEditPassword() {
    this.editingPassword = !this.editingPassword;
    this.newPassword = '';
    this.confirmPassword = '';
  }

  async savePassword() {
    // Validaciones
    if (this.newPassword !== this.confirmPassword) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Las contraseñas no coinciden',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    if (this.newPassword.length < 6) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'La contraseña debe tener al menos 6 caracteres',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    if (!this.user.id) return;

    try {
      const response = await lastValueFrom(
        this.http.put(`http://localhost:3000/api/usuarios/${this.user.id}/password`, {
          nueva: this.newPassword
        })
      );
      
      console.log(' Contraseña actualizada:', response);
      
      this.editingPassword = false;
      this.newPassword = '';
      this.confirmPassword = '';
      
      const alert = await this.alertController.create({
        header: 'Éxito',
        message: 'Contraseña actualizada correctamente',
        buttons: ['OK']
      });
      await alert.present();
      
    } catch (error) {
      console.error(' Error al actualizar contraseña:', error);
      
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'No se pudo actualizar la contraseña',
        buttons: ['OK']
      });
      await alert.present();
    }
  }


  irAConfiguracionUsuario(event: Event) {
    event.preventDefault();
    this.router.navigate(['/configuracionusuario']);
  }

  irAHistorialUsuario(event: Event){
    event.preventDefault();
    this.router.navigate(['/historialusuario']);
  }
  irARegresar(event: Event){
    event.preventDefault();
    this.router.navigate(['/pantallausuario']);
  }

  // Mantener por compatibilidad (si se usa en algún lugar)
  toggleEditPersonal() {
    this.editingPersonal = !this.editingPersonal;
  }

  async savePersonal() {
    this.editingPersonal = false;
    console.log('Información personal actualizada:', this.user);
    
    const alert = await this.alertController.create({
      header: 'Éxito',
      message: 'Tu información personal ha sido actualizada.',
      buttons: ['OK']
    });
    await alert.present();
  }
}