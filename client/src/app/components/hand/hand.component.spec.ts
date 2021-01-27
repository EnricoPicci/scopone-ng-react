import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RouterTestingModule } from '@angular/router/testing';

import { HandComponent } from './hand.component';
import { MaterialModule } from 'src/app/material.module';
import { CardsComponent } from '../cards/cards.component';
import { AddPlayerComponent } from '../add-player/add-player.component';
import { TeamsComponent } from '../teams/teams.component';
import { ErrorComponent } from '../error/error.component';

describe('HandComponent', () => {
  let component: HandComponent;
  let fixture: ComponentFixture<HandComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        HandComponent,
        CardsComponent,
        AddPlayerComponent,
        TeamsComponent,
        ErrorComponent,
      ],
      imports: [
        MaterialModule,
        RouterTestingModule.withRoutes([
          { path: 'error', component: ErrorComponent },
        ]),
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HandComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
