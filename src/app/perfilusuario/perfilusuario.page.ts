import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonList, IonItem, IonLabel, IonInput, IonButton,
  IonAvatar, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, IonButtons, IonBackButton, IonSelectOption } from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';


@Component({
  selector: 'app-perfilusuario',
  templateUrl: './perfilusuario.page.html',
  styleUrls: ['./perfilusuario.page.scss'],
  standalone: true,
  imports: [IonBackButton, IonButtons, IonIcon, 
    IonCardTitle, IonCardHeader,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonList, IonItem, IonLabel, IonInput, IonButton,
    IonAvatar, IonCard, IonCardContent,
    CommonModule, FormsModule, IonSelectOption
  ]
})
export class PerfilusuarioPage implements OnInit {

  editingField: string = '';

  user = {
    name: '',
    apellido: '',
    edad:'',
    genero: '',
    numero: '',
    email: '',
    password: '',
    foto:'',
    calificacion:'',
  };

  async changePhoto(event: any) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      this.user.foto = reader.result as string; // actualiza la foto en base64
    };
    reader.readAsDataURL(file);
  }

}


  activeSection: string = '';
  editingPersonal = false;
  editingPassword = false;

  newPassword = '';
  confirmPassword = '';

  constructor(private alertController: AlertController, private router: Router) { }
  

  ngOnInit() { }

  saveField(field: string) {
    
  console.log(`Guardando cambios en: ${field}`);
  this.editingField = '';}

  setSection(section: string) {
    this.activeSection = section;
  }

  toggleEditPersonal() {
    this.editingPersonal = !this.editingPersonal;
  }

  toggleEditPassword() {
    this.editingPassword = !this.editingPassword;
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

  async savePassword() {
    if (this.newPassword === this.confirmPassword && this.newPassword.trim() !== '') {
      this.user.password = '';
      this.editingPassword = false;
      this.newPassword = '';
      this.confirmPassword = '';

      const alert = await this.alertController.create({
        header: 'Éxito',
        message: 'Tu nueva contraseña ha sido guardada correctamente.',
        buttons: ['OK']
      });
      await alert.present();
    } else {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Las contraseñas no coinciden. Por favor, verifica.',
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

  irACalificarUsuario(event: Event){
    event.preventDefault();
    this.router.navigate(['/calificarusuario'])
  }

}