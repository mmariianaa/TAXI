import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonToolbar, IonList, IonItem, IonLabel, IonInput, IonButton, 
  IonButtons, IonBackButton, IonContent, IonIcon, IonHeader, IonTitle 
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { pencilSharp, person, shieldCheckmark, lockClosed, helpCircle, checkmarkCircle, arrowBackOutline, timeOutline, starOutline } from 'ionicons/icons';

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
  
  editingField: string = '';
  activeSection: string = 'inicio';
  editingPassword = false;

  user = {
    name: '',
    apellido: '',
    edad: '',
    genero: '',
    lada: '',
    numero: '',
    email: '',
    password: '',
    foto: 'https://ionicframework.com/docs/img/demos/avatar.svg',
    calificacion: '',
  };

  newPassword = '';
  confirmPassword = '';

  constructor(private alertController: AlertController, private router: Router) {
    addIcons({ 
      pencilSharp, person, shieldCheckmark, lockClosed, 
      helpCircle, checkmarkCircle, arrowBackOutline,
      timeOutline, starOutline
    });
  }

  ngOnInit() {}

  // --- Utilidades ---
  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  setSection(section: string) {
    this.activeSection = section;
    this.editingField = '';
    this.editingPassword = false;
  }

  // --- Validaciones Independientes ---

  async saveName() {
    if (!this.user.name.trim() || !this.user.apellido.trim()) {
      await this.showAlert('Campos Vacíos', 'El nombre y el apellido no pueden estar vacíos.');
      return;
    }
    this.editingField = '';
    await this.showAlert('Éxito', 'Nombre actualizado correctamente.');
  }

  async savePhone() {
    const phoneRegex = /^\d{10}$/;
    if (!this.user.lada.trim() || !this.user.numero.trim()) {
      await this.showAlert('Campos Vacíos', 'Debes ingresar la lada y el número.');
      return;
    }
    if (!this.user.lada.startsWith('+')) {
      await this.showAlert('Lada Inválida', 'La lada debe comenzar con el símbolo +');
      return;
    }
    if (!phoneRegex.test(this.user.numero)) {
      await this.showAlert('Teléfono Inválido', 'El número debe tener exactamente 10 dígitos.');
      return;
    }
    this.editingField = '';
    await this.showAlert('Éxito', 'Teléfono actualizado.');
  }

  async saveEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.user.email.trim()) {
      await this.showAlert('Campo Vacío', 'El correo no puede estar vacío.');
      return;
    }
    if (!emailRegex.test(this.user.email)) {
      await this.showAlert('Correo Inválido', 'Ingresa un formato de correo válido (ejemplo@dominio.com).');
      return;
    }
    this.editingField = '';
    await this.showAlert('Éxito', 'Correo electrónico actualizado.');
  }

  async savePassword() {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!this.newPassword || !this.confirmPassword) {
      await this.showAlert('Error', 'Los campos de contraseña son obligatorios.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      await this.showAlert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    if (!passwordRegex.test(this.newPassword)) {
      await this.showAlert('Seguridad Insuficiente', 'Mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.');
      return;
    }

    this.user.password = this.newPassword;
    this.editingPassword = false;
    this.newPassword = '';
    this.confirmPassword = '';
    await this.showAlert('Éxito', 'Contraseña actualizada con éxito.');
  }

  // --- Navegación y otros ---
  toggleEditPassword() { this.editingPassword = !this.editingPassword; }

  async changePhoto(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => { this.user.foto = reader.result as string; };
      reader.readAsDataURL(file);
    }
  }

  irAConfiguracionUsuario(event: Event) { this.router.navigate(['/configuracionusuario']); }
  irAHistorialUsuario(event: Event){ this.router.navigate(['/historialusuario']); }
  irACalificarUsuario(event: Event){ this.router.navigate(['/calificarusuario']); }
}