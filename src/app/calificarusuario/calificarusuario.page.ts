import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, 
  IonBackButton, IonIcon, IonAvatar, IonButton, IonTextarea, 
  IonChip, IonLabel, IonFooter 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  arrowBackOutline, star, starOutline, 
  thumbsUpOutline, carOutline, timeOutline, medalOutline 
} from 'ionicons/icons';

interface Tag {
  label: string;
  icon: string;
  selected: boolean;
}

@Component({
  selector: 'app-rating',
  templateUrl: './calificarusuario.page.html',
  styleUrls: ['./calificarusuario.page.scss'],
  standalone: true,
  imports: [
    FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, 
    IonButtons, IonBackButton, IonIcon, IonAvatar, IonButton, 
    IonTextarea, IonChip, IonLabel, IonFooter
  ]
})
export class CalificarusuarioPage {
  rating = 0;
  comment = '';
  driverName = 'Ricardo Esparza';
  driverPhoto = 'https://ionicframework.com/docs/img/demos/avatar.svg';

  tags: Tag[] = [
    { label: 'Excelente servicio', icon: 'medal-outline', selected: false },
    { label: 'Auto muy limpio', icon: 'car-outline', selected: false },
    { label: 'Buen conductor', icon: 'thumbs-up-outline', selected: false },
    { label: 'Llegó a tiempo', icon: 'time-outline', selected: false }
  ];

  constructor() {
    addIcons({ 
      arrowBackOutline, star, starOutline, 
      thumbsUpOutline, carOutline, timeOutline, medalOutline 
    });
  }

  setRating(val: number) {
    this.rating = val;
  }

  toggleTag(tag: Tag) {
    tag.selected = !tag.selected;
  }

  submitRating() {
    const report = {
      stars: this.rating,
      comment: this.comment,
      tags: this.tags.filter(t => t.selected).map(t => t.label)
    };
    console.log('Calificación enviada:', report);
    // Aquí navegarías de regreso o a una pantalla de éxito
  }
}