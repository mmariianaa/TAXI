import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chofer',
  templateUrl: './chofer.page.html',
  styleUrls: ['./chofer.page.scss'], // <-- IMPORTANTE: Cambia a .css si tu archivo termina en .css
  standalone: true,
  imports: [CommonModule, FormsModule]
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