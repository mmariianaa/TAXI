import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { IonContent, IonIcon, IonInput, IonCheckbox, IonButton } from "@ionic/angular/standalone";
import { FormsModule } from '@angular/forms';
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
    edad: null,
    correo: '',
    telefono: '',
    contrasena: '',
    confirmContrasena: '',
    aceptaTerminos: false
  };

  constructor(private router: Router) {}

  togglePassword(inputId: string, iconId: string) {
    const input = document.getElementById(inputId) as HTMLInputElement;
    const icon = document.getElementById(iconId) as HTMLElement;
    
    if (input.type === 'password') {
      input.type = 'text';
      icon.setAttribute('name', 'eye-outline');
    } else {
      input.type = 'password';
      icon.setAttribute('name', 'eye-off-outline');
    }
  }

  registrarUsuario() {
    // Validar edad mínima
    if (this.usuarioData.edad && this.usuarioData.edad < 18) {
      this.mostrarMensaje('Debes ser mayor de 18 años para registrarte');
      return;
    }

    // Validar que las contraseñas coincidan
    if (this.usuarioData.contrasena !== this.usuarioData.confirmContrasena) {
      this.mostrarMensaje('Las contraseñas no coinciden');
      return;
    }

    // Validar términos y condiciones
    if (!this.usuarioData.aceptaTerminos) {
      this.mostrarMensaje('Debes aceptar los términos y condiciones');
      return;
    }

    // Aquí iría la llamada a tu servicio para guardar en BD
    console.log('Datos a guardar en BD:', {
      nombre: this.usuarioData.nombre,
      apellido: this.usuarioData.apellido,
      edad: this.usuarioData.edad,
      correo: this.usuarioData.correo,
      telefono: this.usuarioData.telefono,
      contrasena: this.usuarioData.contrasena // Recuerda hashearla antes de enviar
    });

    // Simulación de registro exitoso
    this.mostrarMensaje('Registro exitoso! Redirigiendo...');
    
    // Redirigir al login después de 2 segundos
    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 2000);
  }

  irALogin(event: Event) {
    event.preventDefault();
    this.router.navigate(['/home']);
  }

  private mostrarMensaje(mensaje: string) {
    // Puedes implementar un Toast de Ionic aquí
    console.log(mensaje);
    alert(mensaje);
  }
}
