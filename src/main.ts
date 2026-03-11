import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
// 1. Agregamos "withInterceptors" a la importación
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http'; 
// 2. Importamos el interceptor que creamos (ajusta la ruta si es necesario)
import { authInterceptor } from './app/auth.interceptor'; 

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    
    // 3. Modificamos el provideHttpClient para incluir el interceptor
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor]) 
    ),
  ],
});