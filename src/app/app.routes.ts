import { Routes } from '@angular/router';
import { authGuard } from './auth.guard'; 

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  
  // === RUTAS PÚBLICAS (Registro) ===
  {
    path: 'registrochofer',
    loadComponent: () => import('./registrochofer/registrochofer.page').then( m => m.RegistrochoferPage)
  },
  {
    path: 'registrousuario',
    loadComponent: () => import('./registrousuario/registrousuario.page').then( m => m.RegistrousuarioPage)
  },

  // === RUTAS PROTEGIDAS (Requieren Login) ===
  {
    path: 'administrador',
    loadComponent: () => import('./administrador/administrador/administrador.page').then( m => m.AdministradorPage),
    canActivate: [authGuard] // <-- Protegida
  },
  {
    path: 'perfiladministrador',
    loadComponent: () => import('./perfiladministrador/perfiladministrador.page').then( m => m.PerfiladministradorPage),
    canActivate: [authGuard]
  },
  {
    path: 'chofer', 
    loadComponent: () => import('./chofer/chofer.page').then((m) => m.ChoferPage),
    canActivate: [authGuard]
  },
  {
    path: 'perfil-chofer',
    loadComponent: () => import('./perfil-chofer/perfil-chofer.page').then( m => m.PerfilChoferPage),
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
    path: 'historialusuario',
    loadComponent: () => import('./historialusuario/historialusuario.page').then( m => m.HistorialusuarioPage),
    canActivate: [authGuard]
  },
  {
    path: 'calificarusuario',
    loadComponent: () => import('./calificarusuario/calificarusuario.page').then( m => m.CalificarusuarioPage),
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
  },  {
    path: 'admin-comentarios',
    loadComponent: () => import('./admin-comentarios/admin-comentarios.page').then( m => m.AdminComentariosPage)
  },

];