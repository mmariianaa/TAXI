import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChoferPage } from './chofer.page';

describe('ChoferPage', () => {
  let component: ChoferPage;
  let fixture: ComponentFixture<ChoferPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ChoferPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});