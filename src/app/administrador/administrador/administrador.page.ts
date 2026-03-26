import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AlertController, LoadingController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
// Se agregó logOutOutline a las importaciones
import { 
  personOutline, carOutline, documentTextOutline, mapOutline, 
  cashOutline, peopleOutline, checkmarkCircleOutline, star, 
  logOutOutline 
} from 'ionicons/icons';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-administrador',
  templateUrl: './administrador.page.html',
  styleUrls: ['./administrador.page.scss'],
  standalone: true,
  imports: [IonicModule, ReactiveFormsModule, CommonModule]
})
export class AdministradorPage implements OnInit {
  stats = { viajes: 0, ingresos: 0, choferes: 0, disponibles: 0 };
  listaChoferes: any[] = [];
  isModalOpen = false;
  choferSel: any = null;
  editForm: FormGroup;
  nombreAdmin: string = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private router: Router,
    private authService: AuthService
  ) {
    // Se agregó logOutOutline al registro de iconos
    addIcons({ 
      personOutline, carOutline, documentTextOutline, mapOutline, 
      cashOutline, peopleOutline, checkmarkCircleOutline, star, 
      logOutOutline 
    });

    this.editForm = this.fb.group({
      marca: ['', [Validators.required]],
      modelo: ['', [Validators.required]],
      color: ['', [Validators.required]],
      placa: ['', [Validators.required]],
      capacidad: [4, [Validators.required]],
      licencia: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    this.cargarResumen('dia');
    this.cargarChoferes();

    const data = localStorage.getItem('user_data');
    if (data) {
      const admin = JSON.parse(data);
      this.nombreAdmin = admin.nombre;
    }
  }

  cargarResumen(periodo: string) {
    this.stats = { viajes: 45, ingresos: 1250, choferes: 12, disponibles: 8 };
  }

  cargarChoferes() {
    this.http.get<any[]>('http://localhost:3000/getTodosChoferes').subscribe(res => {
      this.listaChoferes = res;
      this.stats.choferes = res.length;
      this.stats.disponibles = res.filter(c => c.estado === 'activo' || c.estado === 'disponible').length;
    });
  }

  abrirDetalle(chofer: any) {
    this.choferSel = chofer;
    this.editForm.patchValue({
      marca: chofer.marca,
      modelo: chofer.modelo,
      color: chofer.color,
      placa: chofer.placa,
      capacidad: chofer.capacidad,
      licencia: chofer.licencia
    });
    this.isModalOpen = true;
  }

  async confirmarCambios() {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Actualización',
      message: '¿Estás seguro de que deseas modificar los datos de este chofer?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sí, Actualizar',
          handler: () => { this.guardarCambiosChofer(); }
        }
      ]
    });
    await alert.present();
  }

  async guardarCambiosChofer() {
    if (this.editForm.invalid) {
      const alert = await this.alertCtrl.create({
        header: 'Campos Incompletos',
        message: 'Por favor, rellena todos los campos obligatorios.',
        buttons: ['Entendido']
      });
      await alert.present();
      return;
    }

    if (!this.choferSel || !this.choferSel.id_chofer) return;

    const loading = await this.loadingCtrl.create({
      message: 'Actualizando...',
      spinner: 'crescent'
    });
    await loading.present();

    const id = this.choferSel.id_chofer;
    const url = `http://localhost:3000/api/admin/actualizar-chofer/${id}`;

    this.http.put(url, this.editForm.value).subscribe({
      next: async () => {
        await loading.dismiss();
        this.isModalOpen = false;
        this.cargarChoferes();
        const alert = await this.alertCtrl.create({
          header: 'Éxito',
          message: 'Actualizado correctamente.',
          buttons: ['OK']
        });
        await alert.present();
      },
      error: async (err) => {
        await loading.dismiss();
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: 'Error al actualizar.',
          buttons: ['Cerrar']
        });
        await alert.present();
      }
    });
  }

  irPerfil() {
    this.router.navigate(['/perfiladministrador']);
  }

  cambiarFiltro(event: any) {
    this.cargarResumen(event.detail.value);
  }

  // --- LOGOUT REFORZADO (ANTI-CACHÉ) ---
  async salir() {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que quieres salir del sistema?',
      mode: 'ios', // Estilo iOS para que se vea más limpio
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Cerrar Sesión',
          cssClass: 'danger',
          handler: () => {
            this.ejecutarLogout();
          }
        }
      ]
    });

    await alert.present();
  }

  private ejecutarLogout() {
    // 1. Limpiamos TODA la memoria local
    localStorage.clear();
    sessionStorage.clear();

    // 2. Si tu authService tiene logout, lo llamamos (opcional si ya limpiaste arriba)
    if (this.authService.logout) {
      this.authService.logout();
    }

    // 3. Redirección forzada al home (login)
    // replaceUrl: true evita que el usuario pueda darle "atrás" y volver al panel
    this.router.navigate(['/home'], { replaceUrl: true });

    console.log('Sesión destruida y caché limpiada.');
  }
}