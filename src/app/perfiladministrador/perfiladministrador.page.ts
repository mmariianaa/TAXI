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
  // Imagen por defecto
  avatarUrl: string = 'assets/avatar.png'; 

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
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required]],
      numero_empleado: [{value: '', disabled: false}], 
      departamento: ['', [Validators.required]],
      titulo: ['']
    });
  }

  ngOnInit() {}

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
      ...this.perfilForm.value,
      foto: this.avatarUrl 
    };

    const url = 'http://localhost:3000/api/perfil/actualizar';
    
    this.http.put(url, datosFinales).subscribe({
      next: async (res) => {
        await loading.dismiss();
        const alert = await this.alertCtrl.create({
          header: '¡Éxito!',
          message: 'Tu perfil ha sido actualizado correctamente.',
          buttons: ['OK']
        });
        await alert.present();
      },
      error: async (err) => {
        await loading.dismiss();
        console.error(err);
      }
    });
  }
}