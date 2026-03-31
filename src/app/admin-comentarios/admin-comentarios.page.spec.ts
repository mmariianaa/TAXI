import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminComentariosPage } from './admin-comentarios.page';

describe('AdminComentariosPage', () => {
  let component: AdminComentariosPage;
  let fixture: ComponentFixture<AdminComentariosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminComentariosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
