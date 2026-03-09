import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-historial-chofer',
  templateUrl: './historial-chofer.page.html',
  styleUrls: ['./historial-chofer.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class HistorialChoferPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
