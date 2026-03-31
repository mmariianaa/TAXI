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
  selectedFile: File | null=null;
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
      departamento: ['', [Validators.required]] 
    });
  }

  ngOnInit() {
    const adminData = JSON.parse(localStorage.getItem('user_session') || '{}');
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
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos
      });

      if (image && image.webPath) {
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        this.avatarUrl = image.webPath;
        this.selectedFile = new File([blob], "foto.jpg", { type: blob.type });
      }
    } catch (error) {
      console.log('Usuario canceló');
    }
  }

  quitarFoto() {
    this.avatarUrl = 'assets/avatar.png';
      this.selectedFile = null;
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


    const formData = new FormData();
    formData.append('nombre', this.perfilForm.value.nombre);
    formData.append('apellido', this.perfilForm.value.apellido);
    formData.append('telefono', this.perfilForm.value.telefono);
    formData.append('departamento', this.perfilForm.value.departamento);

    if (this.selectedFile) {
      formData.append('foto', this.selectedFile);
    } else if (this.avatarUrl === 'assets/avatar.png') {
      formData.append('quitarFoto', 'true');
    }

    const url = `http://localhost:3000/api/perfil/actualizar-completo/${this.adminId}`;
    
    this.http.put(url, formData).subscribe({
      next: async (res: any) => {
        await loading.dismiss();

        // Actualizamos el LocalStorage para que los cambios se vean sin recargar
        const currentData = JSON.parse(localStorage.getItem('user_session') || '{}');
        const newData = { ...currentData, ...this.perfilForm.value, foto: res.foto || null};
        localStorage.setItem('user_session', JSON.stringify(newData));

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