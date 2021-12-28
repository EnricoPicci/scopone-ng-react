import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MaterialModule } from 'src/app/material.module';
import { CardsComponent } from '../cards/cards.component';
import { ErrorComponent } from '../error/error.component';

import { HandResultComponent } from './hand-result.component';

describe('HandResultComponent', () => {
  let component: HandResultComponent;
  let fixture: ComponentFixture<HandResultComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HandResultComponent, CardsComponent],
      imports: [
        MaterialModule,
        RouterTestingModule.withRoutes([
          { path: 'error', component: ErrorComponent },
        ]),
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HandResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
