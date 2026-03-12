import { Routes } from '@angular/router';
import { authGuard } from './auth.guard'; // Importa el guard que creamos

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
    path: 'configuracionusuario',
    loadComponent: () => import('./configuracionusuario/configuracionusuario.page').then( m => m.ConfiguracionusuarioPage)
  },
  {
    path: 'historialusuario',
    loadComponent: () => import('./historialusuario/historialusuario.page').then( m => m.HistorialusuarioPage)
  },
  {
    path: 'calificarusuario',
    loadComponent: () => import('./calificarusuario/calificarusuario.page').then( m => m.CalificarusuarioPage)
  },

  // === RUTAS PROTEGIDAS (Solo entran si están logueados) ===

  {
    path: 'perfiladministrador',
    loadComponent: () => import('./perfiladministrador/perfiladministrador.page').then( m => m.PerfiladministradorPage),
    canActivate: [authGuard] // <--- AGREGADO
  },
  {
    path: 'perfil-chofer',
    loadComponent: () => import('./perfil-chofer/perfil-chofer.page').then( m => m.PerfilChoferPage),
    canActivate: [authGuard]
  },
  {
    path: 'viajenotificacion-chofer',
    loadComponent: () => import('./viajenotificacion-chofer/viajenotificacion-chofer.page').then( m => m.ViajenotificacionChoferPage),
    canActivate: [authGuard]
  },
  {
    path: 'historial-chofer',
    loadComponent: () => import('./historial-chofer/historial-chofer.page').then( m => m.HistorialChoferPage),
    canActivate: [authGuard]
  },
  {
    path: 'pantallausuario',
    loadComponent: () => import('./pantallausuario/pantallausuario.page').then( m => m.PantallausuarioPage),
    canActivate: [authGuard]
  },
  {
    path: 'perfilusuario',
    loadComponent: () => import('./perfilusuario/perfilusuario.page').then( m => m.PerfilusuarioPage),
    canActivate: [authGuard]
  },
  {
    path: 'chofer', 
    loadComponent: () => import('./chofer/chofer.page').then((m) => m.ChoferPage),
  },
];