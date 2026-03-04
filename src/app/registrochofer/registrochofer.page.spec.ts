import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistrochoferPage } from './registrochofer.page';

describe('RegistrochoferPage', () => {
  let component: RegistrochoferPage;
  let fixture: ComponentFixture<RegistrochoferPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistrochoferPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
