import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { 
  IonContent, IonIcon, IonButton, IonAvatar, 
  IonItem, IonLabel, IonList, IonListHeader, 
  IonText 
} from "@ionic/angular/standalone";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-perfil-chofer',
  templateUrl: './perfil-chofer.page.html',
  styleUrls: ['./perfil-chofer.page.scss'],
  standalone: true,
  imports: [
    IonButton, IonIcon, IonContent, IonAvatar, 
    IonItem, IonLabel, IonList, IonListHeader, CommonModule
  ],
})
export class PerfilChoferPage implements OnInit {
  
  /* ESTOS DATOS SON DE PRUEBA (ESTÁTICOS). 
     Cuando conectes la API, este objeto se iniciará vacío y se llenará 
     con la respuesta de tu base de datos (MySQL/MongoDB).
  */
  choferInfo: any = {
    personal: {
      nombre: 'Juan',
      apellido: 'Pérez García',
      correo: 'juan.perez@email.com',
      telefono: '3001234567',
      tipoDoc: 'CC',
      numDoc: '123456789',
      viajes: 1234,
      calificacion: 4.8
    },
    vehiculo: {
      marca: 'TSURU',
      modelo: '2018',
      color: 'Gris',
      placa: 'ABC-123',
      licencia: '12345678',
      experiencia: '5 años'
    },
    documentos: [
      { nombre: 'Licencia de conducción', estado: '✅ Vigente', alerta: false },
      { nombre: 'SOAT vigente', estado: '✅ Vigente', alerta: false },
      { nombre: 'Revisión técnico-mecánica', estado: '⚠ Vence en 15 días', alerta: true }
    ]
  };

  // Usamos public para evitar errores de acceso en el HTML
  constructor(public router: Router) { }

  ngOnInit() {
    /* AQUÍ ES DONDE LLAMARÁS A TU SERVICIO:
       this.tuServicio.getPerfil().subscribe(res => {
          this.choferInfo = res; // Esto reemplaza los datos de prueba por los de la BD
       });
    */
  }

  regresar() {
    this.router.navigate(['/home-chofer']);
  }

  cerrarSesion() {
    // Al cerrar sesión, podrías limpiar el almacenamiento local (Storage)
    this.router.navigate(['/home']);
  }
}