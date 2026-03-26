import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AlertController, LoadingController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { personOutline, carOutline, documentTextOutline, mapOutline, cashOutline, peopleOutline, checkmarkCircleOutline, star } from 'ionicons/icons';
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
  // Variables para el Dashboard
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
    addIcons({ personOutline, carOutline, documentTextOutline, mapOutline, cashOutline, peopleOutline, checkmarkCircleOutline, star });

    // Formulario solo con campos editables (Vehículo y Profesionales)
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
    // Aquí llamarías a tu API: /api/admin/resumen?periodo=dia
    this.stats = { viajes: 45, ingresos: 1250, choferes: 12, disponibles: 8 };
  }

  cargarChoferes() {
    this.http.get<any[]>('http://localhost:3000/getTodosChoferes').subscribe(res => {
      this.listaChoferes = res;
      this.stats.choferes = res.length;//choferes reales
      this.stats.disponibles = res.filter(c => c.estado === 'activo' || c.estado === 'disponible').length;
    });//actividad real de los choferes
  }


  abrirDetalle(chofer: any) {
    console.log('Datos del chofer seleccionado:', chofer);
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
  // --- NUEVA VALIDACIÓN ---
  // Si el formulario es inválido (algún campo requerido está vacío)
  if (this.editForm.invalid) {
    const alert = await this.alertCtrl.create({
      header: 'Campos Incompletos',
      message: 'Por favor, rellena todos los campos obligatorios antes de guardar (incluyendo la capacidad).',
      buttons: ['Entendido']
    });
    await alert.present();
    return; // Detenemos la ejecución aquí
  }

  // Si pasa la validación, procedemos con el ID
  if (!this.choferSel || !this.choferSel.id_chofer) {
    console.error("No hay un ID de chofer seleccionado");
    return;
  }

  const loading = await this.loadingCtrl.create({
    message: 'Actualizando vehículo...',
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
        message: 'Los datos han sido actualizados correctamente.',
        buttons: ['OK']
      });
      await alert.present();
    },
    error: async (err) => {
      await loading.dismiss();
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'No se pudo actualizar en la base de datos.',
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

  async salir() {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que quieres salir del sistema?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Cerrar Sesión',
          handler: () => {
            this.authService.logout(); // Esto limpia la memoria y te manda al Home
          }
        }
      ]
    });

    await alert.present();
  }

}