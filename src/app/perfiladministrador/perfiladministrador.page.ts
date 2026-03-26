import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AlertController, LoadingController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common'; // Necesario para el pipe async o directivas
import { addIcons } from 'ionicons';
import { camera, saveOutline, imageOutline, trashOutline } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-perfiladministrador',
  templateUrl: './perfiladministrador.page.html',
  styleUrls: ['./perfiladministrador.page.scss'],
  standalone: true,
  imports: [IonicModule, ReactiveFormsModule, CommonModule]
})
export class PerfiladministradorPage implements OnInit {
  perfilForm: FormGroup;
  avatarUrl: string = 'assets/avatar.png'; 
  adminId: string='';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {
    addIcons({ camera, saveOutline, imageOutline, trashOutline });
    
    this.perfilForm = this.fb.group({
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      telefono: ['', [Validators.required]], 
      departamento: ['', [Validators.required]],
      titulo: ['']
    });
  }

  ngOnInit() {
    const adminData = JSON.parse(localStorage.getItem('user_data') || '{}');
    this.adminId = adminData.id;

    if (this.adminId) {
      // Rellenamos el formulario con lo que ya tenemos
      this.perfilForm.patchValue({
        nombre: adminData.nombre,
        apellido: adminData.apellido,
        correo: adminData.correo,
        telefono: adminData.telefono,
        departamento: adminData.departamento
      });
      if (adminData.foto) {
        this.avatarUrl = adminData.foto;
      }
    }
  }

  // --- LÓGICA DE LA FOTO ---

  async cambiarFoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos // Abre directamente la galería/archivos
      });

      if (image && image.dataUrl) {
        this.avatarUrl = image.dataUrl;
      }
    } catch (error) {
      console.log('Usuario canceló la selección');
    }
  }

  quitarFoto() {
    this.avatarUrl = 'assets/avatar.png'; // Regresa a la imagen por defecto
  }

  // --- LÓGICA DEL FORMULARIO ---

  esInvalido(campo: string) {
    return this.perfilForm.get(campo)?.invalid && this.perfilForm.get(campo)?.touched;
  }

  esValido(campo: string) {
    return this.perfilForm.get(campo)?.valid && this.perfilForm.get(campo)?.touched;
  }

  async guardarCambios() {
    if (this.perfilForm.invalid) return;

    const loading = await this.loadingCtrl.create({
      message: 'Actualizando base de datos...',
      spinner: 'circles'
    });
    await loading.present();

    // Enviamos los datos del form + la imagen en base64
    const datosFinales = {
      ...this.perfilForm.getRawValue(),
      foto: this.avatarUrl 
    };

    const url = `http://localhost:3000/api/perfil/actualizar-completo/${this.adminId}`;
    
    this.http.put(url, datosFinales).subscribe({
      next: async (res) => {
        await loading.dismiss();

       // IMPORTANTE: Actualizar el localStorage para que los cambios se vean en toda la app
        const currentData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const newData = { ...currentData, ...datosFinales };
        localStorage.setItem('user_data', JSON.stringify(newData));

        const alert = await this.alertCtrl.create({
          header: '¡Actualizado!',
          message: 'Los cambios se guardaron en la base de datos.',
          buttons: ['Entendido']
        });
        await alert.present();
      },
      error: async (err) => {
        await loading.dismiss();
        console.error('Error al conectar con el servidor:', err);
      }
    });
  }
}