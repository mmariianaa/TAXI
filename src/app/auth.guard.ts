import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authGuard = () => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (token) {
    return true; // Deja pasar
  } else {
    router.navigate(['/login']); // Bloquea y manda al login
    return false;
  }
};