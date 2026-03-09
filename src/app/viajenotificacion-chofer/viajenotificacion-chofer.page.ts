import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-viajenotificacion-chofer',
  templateUrl: './viajenotificacion-chofer.page.html',
  styleUrls: ['./viajenotificacion-chofer.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class ViajenotificacionChoferPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
