import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AlertController, LoadingController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { personOutline, carOutline, documentTextOutline, mapOutline, cashOutline, peopleOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { Router } from '@angular/router'; 

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

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private router: Router
  ) {
    addIcons({ personOutline, carOutline, documentTextOutline, mapOutline, cashOutline, peopleOutline, checkmarkCircleOutline });
    
    // Formulario solo con campos editables (Vehículo y Profesionales)
    this.editForm = this.fb.group({
      marca: ['', [Validators.required]],
      modelo: ['', [Validators.required]],
      color: ['', [Validators.required]],
      placa: ['', [Validators.required]],
      capacidad: [4, [Validators.required]],
      licencia: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    this.cargarResumen('dia');
    this.cargarChoferes();
  }

  cargarResumen(periodo: string) {
    // Aquí llamarías a tu API: /api/admin/resumen?periodo=dia
    this.stats = { viajes: 45, ingresos: 1250, choferes: 12, disponibles: 8 };
  }

  cargarChoferes() {
    this.http.get<any[]>('http://localhost:3000/getTodosChoferes').subscribe(res => {
      this.listaChoferes = res;
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
    const loading = await this.loadingCtrl.create({ message: 'Actualizando...' });
    await loading.present();

    const url = `http://localhost:3000/api/admin/actualizar-chofer/${this.choferSel.id_chofer}`;
    
    this.http.put(url, this.editForm.value).subscribe({
      next: () => {
        loading.dismiss();
        this.isModalOpen = false;
        this.cargarChoferes(); 
      },
      error: () => loading.dismiss()
    });
  }

  irPerfil() {
  this.router.navigate(['/perfiladministrador']);
}

cambiarFiltro(event: any) {
 this.cargarResumen(event.detail.value);
}

}
