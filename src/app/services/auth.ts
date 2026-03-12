import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://localhost:3000/api';

  login(correo: string, contrasena: string) {
    return this.http.post<any>(`${this.apiUrl}/login`, { correo, contrasena }).pipe(
      tap(res => {
        // Guardamos el token y la sesión
        localStorage.setItem('token', res.token);
        localStorage.setItem('user_session', JSON.stringify(res.user));
      })
    );
  }

  getUserData() {
    const data = localStorage.getItem('user_session');
    return data ? JSON.parse(data) : null;
  }

  // --- EL AJUSTE ESTÁ AQUÍ ---
  logout() {
    // Borra todo lo guardado (token, sesión, etc.)
    localStorage.clear(); 
    
    // Cambiamos '/login' por '/home' porque así se llama tu ruta raíz
    this.router.navigate(['/home']); 
  }
}