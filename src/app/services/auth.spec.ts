import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth'; // Cambia Auth por AuthService

describe('AuthService', () => { // Cambia el nombre del test
  let service: AuthService; // Cambia el tipo

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService); // Cambia el inject
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});