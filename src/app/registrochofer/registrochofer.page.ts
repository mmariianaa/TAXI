import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient} from '@angular/common/http';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-registrochofer',
  templateUrl: './registrochofer.page.html',
  styleUrls: ['./registrochofer.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ]
})
export class RegistrochoferPage implements OnInit {

  chofer = {
    nombre: '',
    apellido: '',
    edad: 18,
    correo: '',
    telefono: '',
    contrasena: ''
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {}

  registrarChofer() {
    this.http.post('/api/registrochofer', this.chofer).subscribe({
      next: (res: any) => {
        alert('Chofer registrado exitosamente 🚖');
      },
      error: (err) => {
        alert('Error al registrar chofer ❌');
        console.error(err);
      }
    });
  }
}