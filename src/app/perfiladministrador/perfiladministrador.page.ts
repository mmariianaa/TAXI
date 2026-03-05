import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonButton, IonBadge } from '@ionic/angular/standalone';

@Component({
  selector: 'app-perfiladministrador',
  templateUrl: './perfiladministrador.page.html',
  styleUrls: ['./perfiladministrador.page.scss'],
  standalone: true,
  imports: [IonBadge, IonButton, IonIcon, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class PerfiladministradorPage{
  mostrarEjemplo = true; // control para el @if

  // Datos para demostrar @for
  itemsEjemplo = [
    {
      id: 1,
      icono: 'cube-outline',
      titulo: 'Ejemplo 1',
      detalles: ['Detalle dinámico A', 'Detalle dinámico B', 'Detalle dinámico C'],
      destacado: true,
    },
    {
      id: 2,
      icono: 'apps-outline',
      titulo: 'Ejemplo 2',
      detalles: ['Elemento X', 'Elemento Y', 'Elemento Z'],
      destacado: false,
    },
    {
      id: 3,
      icono: 'layers-outline',
      titulo: 'Ejemplo 3',
      detalles: ['Fila 1', 'Fila 2', 'Fila 3'],
      destacado: false,
    },
    {
      id: 4,
      icono: 'grid-outline',
      titulo: 'Ejemplo 4',
      detalles: ['Ítem α', 'Ítem β', 'Ítem γ'],
      destacado: true,
    },
  ];

  constructor() {}
}
