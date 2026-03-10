import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Importamos SOLO IonContent para que Ionic no nos oculte la pantalla
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-chofer',
  templateUrl: './chofer.page.html',
  styleUrls:['./chofer.page.scss'], // <--- ¡AQUÍ ESTABA EL DETALLE! Ponle la 's'
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule]
})
export class ChoferPage implements OnInit {
  activeTab: string = 'perfil';
  isActive: boolean = true;
  driverInfo: any = {};

  listaChoferes =[
    { nombre: 'Juan Carlos Pérez', placas: 'XYZ-987-A', vehiculo: 'Nissan Versa' }
  ];

  ngOnInit() {
    this.driverInfo = this.listaChoferes[0];
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }

  toggleStatus() {
    this.isActive = !this.isActive;
  }

  saveProfile() {
    alert(`¡Datos de ${this.driverInfo.nombre} guardados!`);
  }
}