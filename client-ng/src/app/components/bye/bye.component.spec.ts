import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MaterialModule } from 'src/app/material.module';
import { ErrorComponent } from '../error/error.component';

import { ByeComponent } from './bye.component';

describe('ByeComponent', () => {
  let component: ByeComponent;
  let fixture: ComponentFixture<ByeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ByeComponent],
      imports: [
        MaterialModule,
        RouterTestingModule.withRoutes([
          { path: 'error', component: ErrorComponent },
        ]),
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ByeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
