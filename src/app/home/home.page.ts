import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton, IonCheckbox, IonInput } from '@ionic/angular/standalone';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonInput, IonCheckbox, IonButton, IonIcon, IonHeader, IonToolbar, IonTitle, IonContent],
})
export class HomePage {
  constructor() {}
}
