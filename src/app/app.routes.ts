import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'registrochofer',
    loadComponent: () => import('./registrochofer/registrochofer.page').then( m => m.RegistrochoferPage)
  },
  {
    path: 'registrousuario',
    loadComponent: () => import('./registrousuario/registrousuario.page').then( m => m.RegistrousuarioPage)
  },
  {
    path: 'perfiladministrador',
    loadComponent: () => import('./perfiladministrador/perfiladministrador.page').then( m => m.PerfiladministradorPage)
  },
  {
    path: 'perfil-chofer',
    loadComponent: () => import('./perfil-chofer/perfil-chofer.page').then( m => m.PerfilChoferPage)
  },
  {
    path: 'viajenotificacion-chofer',
    loadComponent: () => import('./viajenotificacion-chofer/viajenotificacion-chofer.page').then( m => m.ViajenotificacionChoferPage)
  },
  {
    path: 'historial-chofer',
    loadComponent: () => import('./historial-chofer/historial-chofer.page').then( m => m.HistorialChoferPage)
  },
  {
    path: 'pantallausuario',
    loadComponent: () => import('./pantallausuario/pantallausuario.page').then( m => m.PantallausuarioPage)
  },

];
