import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AlertController, LoadingController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
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
  adminId: any = null; // Cambiado a any por si el ID viene como número o string

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
      telefono: ['', [Validators.required, Validators.minLength(10)]], 
      departamento: ['', [Validators.required]] // Se queda aquí para el HTML, pero lo filtramos al enviar
    });
  }

  ngOnInit() {
    // IMPORTANTE: Verifica si en tu localStorage es 'id' o 'id_usuario'
    const adminData = JSON.parse(localStorage.getItem('user_data') || '{}');
    this.adminId = adminData.id_usuario || adminData.id;

    if (this.adminId) {
      this.perfilForm.patchValue({
        nombre: adminData.nombre,
        apellido: adminData.apellido,
        telefono: adminData.telefono,
        departamento: adminData.departamento || 'Administración'
      });
      if (adminData.foto) {
        this.avatarUrl = adminData.foto;
      }
    }
  }

  async cambiarFoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 60, // Bajamos un poco la calidad para que el string no sea tan pesado para la BD
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos 
      });

      if (image && image.dataUrl) {
        this.avatarUrl = image.dataUrl;
      }
    } catch (error) {
      console.log('Usuario canceló la selección');
    }
  }

  quitarFoto() {
    this.avatarUrl = 'assets/avatar.png';
  }

  esInvalido(campo: string) {
    return this.perfilForm.get(campo)?.invalid && this.perfilForm.get(campo)?.touched;
  }

  esValido(campo: string) {
    return this.perfilForm.get(campo)?.valid && this.perfilForm.get(campo)?.touched;
  }

  async guardarCambios() {
    if (this.perfilForm.invalid) {
      const alert = await this.alertCtrl.create({
        header: 'Formulario Incompleto',
        message: 'Por favor, llena todos los campos correctamente.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Actualizando perfil...',
      spinner: 'circles'
    });
    await loading.present();

    // --- EL TRUCO PARA EVITAR EL ERROR 500 ---
    // Solo enviamos los campos que EXISTEN en tu tabla Usuario de MySQL
    const datosParaBaseDeDatos = {
      nombre: this.perfilForm.value.nombre,
      apellido: this.perfilForm.value.apellido,
      telefono: this.perfilForm.value.telefono,
      foto: this.avatarUrl
    };

    const url = `http://localhost:3000/api/perfil/actualizar-completo/${this.adminId}`;
    
    this.http.put(url, datosParaBaseDeDatos).subscribe({
      next: async (res) => {
        await loading.dismiss();

        // Actualizamos el LocalStorage para que los cambios se vean sin recargar
        const currentData = JSON.parse(localStorage.getItem('user_data') || '{}');
        const newData = { ...currentData, ...this.perfilForm.value, foto: this.avatarUrl };
        localStorage.setItem('user_data', JSON.stringify(newData));

        const alert = await this.alertCtrl.create({
          header: '¡Éxito!',
          message: 'Tu perfil ha sido actualizado correctamente.',
          buttons: ['Genial']
        });
        await alert.present();
      },
      error: async (err) => {
        await loading.dismiss();
        console.error('Error al conectar con el servidor:', err);
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: 'No se pudo actualizar. Revisa que el servidor esté encendido.',
          buttons: ['Cerrar']
        });
        await alert.present();
      }
    });
  }
}