import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router'; // <-- Importamos el Router para navegar
import { addIcons } from 'ionicons';
import { star, chatbubbleEllipsesOutline, trashOutline, arrowBackOutline } from 'ionicons/icons';

@Component({
  selector: 'app-admin-comentarios',
  templateUrl: './admin-comentarios.page.html',
  styleUrls: ['./admin-comentarios.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class AdminComentariosPage implements OnInit {
  listaComentarios: any[] = [];

  constructor(
    private http: HttpClient,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private router: Router // <-- Lo inyectamos aquí
  ) {
    // Registramos el nuevo ícono de la flecha
    addIcons({ star, chatbubbleEllipsesOutline, trashOutline, arrowBackOutline });
  }

  ngOnInit() {
    this.obtenerComentarios();
  }

  // Función atada al nuevo botón para regresar
  volverPanel() {
    this.router.navigate(['/administrador']);
  }

  obtenerComentarios() {
    this.http.get<any[]>('http://localhost:3000/api/admin/comentarios').subscribe({
      next: (datosReales) => {
        this.listaComentarios = datosReales; 
      },
      error: (err) => {
        console.error('Error al traer comentarios:', err);
      }
    });
  }

  async eliminarComentario(id: number) {
    const alert = await this.alertCtrl.create({
      header: '¿Eliminar comentario?',
      message: 'Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => { this.ejecutarEliminacion(id); }
        }
      ]
    });
    await alert.present();
  }

  async ejecutarEliminacion(id: number) {
    const loading = await this.loadingCtrl.create({ message: 'Borrando...' });
    await loading.present();

    this.http.delete(`http://localhost:3000/api/admin/comentarios/${id}`).subscribe({
      next: () => {
        loading.dismiss();
        this.obtenerComentarios(); // Recargar lista para que desaparezca el borrado
      },
      error: () => {
        loading.dismiss();
        console.error('Error al eliminar');
      }
    });
  }
}